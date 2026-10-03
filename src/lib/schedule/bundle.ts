import type { SourceKey } from "@/config/data-sources";
import type { Bi } from "@/lib/i18n/locale";
import type { InvigilationBook } from "./invigilation";
import type { TeachingSchedule } from "./teaching";

export type SyncMode = "service-account" | "public" | "upload";

export interface SourceInfo {
  key: SourceKey;
  label: Bi;
  fileId: string;
  fileName: string | null;
  url: string;
  mode: SyncMode;
  /** When Google Drive last saw an edit (service-account mode only). */
  modifiedTime: string | null;
  modifiedBy: string | null;
  /** When this server last downloaded and parsed the file. */
  fetchedAt: string;
  /** When this server last asked Drive whether the file changed. */
  checkedAt: string;
}

export type SourceResult<T> =
  | { ok: true; source: SourceInfo; data: T }
  | { ok: false; key: SourceKey; label: Bi; url: string; error: Bi; setup: boolean };

export interface ScheduleBundle {
  teaching: SourceResult<TeachingSchedule>;
  invigilation: SourceResult<InvigilationBook>;
  serviceAccountEmail: string | null;
}

/**
 * An error a user will read, in both languages — the server caches results and serves them to Thai and
 * English screens alike. `message` stays the Thai text for server logs.
 */
export class SourceError extends Error {
  constructor(readonly text: Bi) {
    super(text.th);
    this.name = "SourceError";
  }
}

function isBi(value: unknown): value is Bi {
  return typeof value === "object" && value !== null && typeof (value as Bi).th === "string" && typeof (value as Bi).en === "string";
}

/** What to show for anything thrown while reading a source; errors from libraries are shown as they are. */
export function errorText(error: unknown): Bi {
  if (error instanceof SourceError) return error.text;
  if (isBi(error)) return error;
  const message = error instanceof Error ? error.message : String(error);
  return { th: message, en: message };
}
