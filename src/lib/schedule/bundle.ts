import type { SourceKey } from "@/config/data-sources";
import type { InvigilationBook } from "./invigilation";
import type { TeachingSchedule } from "./teaching";

export type SyncMode = "service-account" | "public" | "upload";

export interface SourceInfo {
  key: SourceKey;
  label: string;
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
  | { ok: false; key: SourceKey; label: string; url: string; error: string; setup: boolean };

export interface ScheduleBundle {
  teaching: SourceResult<TeachingSchedule>;
  invigilation: SourceResult<InvigilationBook>;
  serviceAccountEmail: string | null;
}
