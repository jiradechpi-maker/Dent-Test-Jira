import "server-only";
import { createHash } from "node:crypto";
import { DATA_SOURCES, type SourceKey } from "@/config/data-sources";
import type { ScheduleBundle, SourceInfo, SourceResult } from "@/lib/schedule/bundle";
import { parseInvigilationWorkbook, type InvigilationBook } from "@/lib/schedule/invigilation";
import { pickTeachingSheet } from "@/lib/schedule/sources";
import { parseTeachingSchedule, type TeachingSchedule } from "@/lib/schedule/teaching";
import { DriveError, downloadPublicSpreadsheet, downloadSpreadsheet, getFileMeta, viewUrl } from "@/server/google/drive";
import { serviceAccountFromEnv } from "@/server/google/service-account";
import { readWorkbook } from "@/server/sheets/read-workbook";

/** Ask Drive whether a file changed at most this often; downloads happen only when it did. */
const CHECK_INTERVAL_MS = 30_000;
/** Public mode has no modifiedTime, so it re-downloads — less often. */
const PUBLIC_INTERVAL_MS = 120_000;

interface CacheEntry<T> {
  info: SourceInfo;
  version: string;
  data: T;
}

const cache = new Map<SourceKey, CacheEntry<unknown>>();
const inflight = new Map<SourceKey, Promise<CacheEntry<unknown>>>();

export function fileIdOf(key: SourceKey): string {
  const source = DATA_SOURCES[key];
  return process.env[source.envVar]?.trim() || source.defaultFileId;
}

export async function parseSource(key: SourceKey, bytes: Uint8Array): Promise<TeachingSchedule | InvigilationBook> {
  const grids = await readWorkbook(bytes);
  if (key === "teaching") return parseTeachingSchedule(pickTeachingSheet(grids, DATA_SOURCES.teaching.year));
  return parseInvigilationWorkbook(grids);
}

async function refresh<T>(key: SourceKey, force: boolean): Promise<CacheEntry<T>> {
  const previous = cache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();
  const age = previous ? now - Date.parse(previous.info.checkedAt) : Infinity;
  const fileId = fileIdOf(key);
  const account = serviceAccountFromEnv();
  if (previous && !force && age < (account ? CHECK_INTERVAL_MS : PUBLIC_INTERVAL_MS) && previous.info.fileId === fileId) return previous;

  const checkedAt = new Date(now).toISOString();
  const label = DATA_SOURCES[key].label;

  if (account) {
    const meta = await getFileMeta(fileId, account);
    const version = `${meta.id}@${meta.modifiedTime}`;
    if (previous && previous.version === version) {
      const next = { ...previous, info: { ...previous.info, checkedAt } };
      cache.set(key, next);
      return next;
    }
    const data = (await parseSource(key, await downloadSpreadsheet(meta, account))) as T;
    const entry: CacheEntry<T> = {
      version,
      data,
      info: {
        key,
        label,
        fileId,
        fileName: meta.name,
        url: meta.webViewLink,
        mode: "service-account",
        modifiedTime: meta.modifiedTime,
        modifiedBy: meta.modifiedBy,
        fetchedAt: checkedAt,
        checkedAt,
      },
    };
    cache.set(key, entry);
    return entry;
  }

  const bytes = await downloadPublicSpreadsheet(fileId);
  const version = createHash("sha256").update(bytes).digest("hex");
  if (previous && previous.version === version) {
    const next = { ...previous, info: { ...previous.info, checkedAt } };
    cache.set(key, next);
    return next;
  }
  const entry: CacheEntry<T> = {
    version,
    data: (await parseSource(key, bytes)) as T,
    info: {
      key,
      label,
      fileId,
      fileName: null,
      url: viewUrl(fileId, key === "invigilation" ? "application/vnd.google-apps.spreadsheet" : undefined),
      mode: "public",
      modifiedTime: null,
      modifiedBy: null,
      fetchedAt: checkedAt,
      checkedAt,
    },
  };
  cache.set(key, entry);
  return entry;
}

async function load<T>(key: SourceKey, force: boolean): Promise<SourceResult<T>> {
  const source = DATA_SOURCES[key];
  try {
    let pending = inflight.get(key) as Promise<CacheEntry<T>> | undefined;
    if (!pending) {
      pending = refresh<T>(key, force).finally(() => inflight.delete(key));
      inflight.set(key, pending as Promise<CacheEntry<unknown>>);
    }
    const entry = await pending;
    return { ok: true, source: entry.info, data: entry.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stale = cache.get(key) as CacheEntry<T> | undefined;
    const fileId = fileIdOf(key);
    console.error(`[schedule-sync] ${key}:`, message);
    if (stale) return { ok: true, source: { ...stale.info }, data: stale.data };
    return {
      ok: false,
      key,
      label: source.label,
      url: viewUrl(fileId, key === "invigilation" ? "application/vnd.google-apps.spreadsheet" : undefined),
      error: message,
      setup: error instanceof DriveError || !serviceAccountFromEnv(),
    };
  }
}

export async function loadScheduleBundle(options: { force?: boolean } = {}): Promise<ScheduleBundle> {
  const force = options.force ?? false;
  const [teaching, invigilation] = await Promise.all([
    load<TeachingSchedule>("teaching", force),
    load<InvigilationBook>("invigilation", force),
  ]);
  let serviceAccountEmail: string | null = null;
  try {
    serviceAccountEmail = serviceAccountFromEnv()?.clientEmail ?? null;
  } catch {
    serviceAccountEmail = null;
  }
  return { teaching, invigilation, serviceAccountEmail };
}
