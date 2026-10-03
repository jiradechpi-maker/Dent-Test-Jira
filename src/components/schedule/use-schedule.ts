"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DATA_SOURCES, type SourceKey } from "@/config/data-sources";
import { errorText, SourceError, type ScheduleBundle, type SourceInfo, type SourceResult } from "@/lib/schedule/bundle";
import { diffSnapshots, type Change, type Snapshot } from "@/lib/schedule/diff";
import type { InvigilationBook } from "@/lib/schedule/invigilation";
import type { TeachingSchedule } from "@/lib/schedule/teaching";

const QUERY_KEY = ["schedule-bundle"] as const;
/** Ask the server every 2 minutes; it only re-downloads from Drive when the file's modifiedTime changed. */
const POLL_MS = 120_000;

async function fetchBundle(force: boolean): Promise<ScheduleBundle> {
  const response = await fetch(`/api/schedule${force ? "?refresh=1" : ""}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as ScheduleBundle;
}

interface UploadedSource<T> {
  fileName: string;
  uploadedAt: string;
  data: T;
}

const UPLOAD_KEY = (key: SourceKey) => `dentops.schedule.upload.${key}`;

function readUpload<T>(key: SourceKey): UploadedSource<T> | null {
  try {
    const raw = localStorage.getItem(UPLOAD_KEY(key));
    return raw ? (JSON.parse(raw) as UploadedSource<T>) : null;
  } catch {
    return null;
  }
}

/** Server data wins whenever Drive is reachable; a manually uploaded .xlsx fills in until then. */
function resolve<T>(key: SourceKey, server: SourceResult<T> | undefined, upload: UploadedSource<T> | null): SourceResult<T> | undefined {
  if (server?.ok || !upload) return server;
  const info: SourceInfo = {
    key,
    label: server?.label ?? DATA_SOURCES[key].label,
    fileId: "",
    fileName: upload.fileName,
    url: server?.url ?? "",
    mode: "upload",
    modifiedTime: null,
    modifiedBy: null,
    fetchedAt: upload.uploadedAt,
    checkedAt: upload.uploadedAt,
  };
  return { ok: true, source: info, data: upload.data };
}

export function useScheduleBundle() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchBundle(false),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    staleTime: 20_000,
  });

  const [uploads, setUploads] = useState<{ teaching: UploadedSource<TeachingSchedule> | null; invigilation: UploadedSource<InvigilationBook> | null }>({
    teaching: null,
    invigilation: null,
  });
  useEffect(() => {
    setUploads({ teaching: readUpload("teaching"), invigilation: readUpload("invigilation") });
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      queryClient.setQueryData(QUERY_KEY, await fetchBundle(true));
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const upload = useCallback(async (key: SourceKey, file: File) => {
    const form = new FormData();
    form.set("kind", key);
    form.set("file", file);
    const response = await fetch("/api/schedule/parse", { method: "POST", body: form });
    // The route answers errors in both languages; the upload button shows the user's one.
    const body = (await response.json()) as { error?: unknown; data?: unknown };
    if (!response.ok || !body.data) throw new SourceError(errorText(body.error ?? `HTTP ${response.status}`));
    const entry = { fileName: file.name, uploadedAt: new Date().toISOString(), data: body.data };
    try {
      localStorage.setItem(UPLOAD_KEY(key), JSON.stringify(entry));
    } catch {
      // Storage full or blocked — keep it for this visit only.
    }
    setUploads((current) => ({ ...current, [key]: entry }));
  }, []);

  const clearUpload = useCallback((key: SourceKey) => {
    try {
      localStorage.removeItem(UPLOAD_KEY(key));
    } catch {
      // ignore
    }
    setUploads((current) => ({ ...current, [key]: null }));
  }, []);

  const teaching = useMemo(() => resolve("teaching", query.data?.teaching, uploads.teaching), [query.data?.teaching, uploads.teaching]);
  const invigilation = useMemo(
    () => resolve("invigilation", query.data?.invigilation, uploads.invigilation),
    [query.data?.invigilation, uploads.invigilation],
  );

  return {
    query,
    teaching,
    invigilation,
    serviceAccountEmail: query.data?.serviceAccountEmail ?? null,
    refresh,
    refreshing,
    upload,
    clearUpload,
    hasUpload: { teaching: uploads.teaching !== null, invigilation: uploads.invigilation !== null },
  };
}

/**
 * Remembers (per browser) what the schedule looked like when the user last pressed "Mark as seen", and lists
 * what changed since. The first visit just records a baseline. Stored snapshots are language-neutral.
 */
export function useChangeTracker(storageKey: string, snapshot: Snapshot | null) {
  const key = `dentops.schedule.seen.${storageKey}`;
  const [baseline, setBaseline] = useState<Snapshot | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setBaseline(raw ? (JSON.parse(raw) as Snapshot) : null);
    } catch {
      setBaseline(null);
    }
  }, [key]);

  useEffect(() => {
    if (baseline === null && snapshot) {
      try {
        localStorage.setItem(key, JSON.stringify(snapshot));
      } catch {
        // ignore
      }
      setBaseline(snapshot);
    }
  }, [baseline, snapshot, key]);

  const changes: Change[] = useMemo(
    () => (baseline && snapshot ? diffSnapshots(baseline, snapshot) : []),
    [baseline, snapshot],
  );

  const acknowledge = useCallback(() => {
    if (!snapshot) return;
    try {
      localStorage.setItem(key, JSON.stringify(snapshot));
    } catch {
      // ignore
    }
    setBaseline(snapshot);
  }, [key, snapshot]);

  return { changes, since: baseline?.takenAt ?? null, acknowledge };
}
