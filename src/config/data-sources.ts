import { bi, type Bi } from "@/lib/i18n/locale";

/** Google Drive files the app reads (read-only). File IDs come from the share links; override with env vars. */

export type SourceKey = "teaching" | "invigilation";

export interface DataSource {
  key: SourceKey;
  label: Bi;
  envVar: string;
  defaultFileId: string;
  /** Cohort whose teaching schedule this is (teaching sources only). */
  year?: number;
}

export const DATA_SOURCES: Record<SourceKey, DataSource> = {
  teaching: {
    key: "teaching",
    label: bi("ตารางสอนชั้นปี 4", "Year 4 timetable"),
    envVar: "SCHEDULE_YEAR4_FILE_ID",
    defaultFileId: "1r8ojFET63TsAgr63eVNjXJGPR2OB5g1y",
    year: 4,
  },
  invigilation: {
    key: "invigilation",
    label: bi("ตารางบันทึกเวลาคุมสอบ", "Invigilation log"),
    envVar: "INVIGILATION_FILE_ID",
    defaultFileId: "1mT9PLjUChPW6_CPDFdMQ7gmWw7dM9arnUkqGlQ06rzU",
  },
};

/** Year of the cohort the signed-in staff member manages — the only year shown as "mine" for now. */
export const MY_YEAR = 4;
