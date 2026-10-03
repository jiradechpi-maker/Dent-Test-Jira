import { describe, expect, it } from "vitest";
import { diffSnapshots, examSnapshot, teachingSnapshot, type Snapshot } from "./diff";
import type { ExamEntry } from "./invigilation";
import type { TeachingSession } from "./teaching";

const base: TeachingSession = {
  id: "F8",
  date: "2026-10-21",
  start: "09:00",
  end: "11:00",
  title: "Final Examination: Pediatric Dentistry",
  instructors: [],
  course: null,
  color: null,
  kind: "exam",
  group: null,
  movedFrom: null,
  week: 1,
  semester: 1,
};

const exam: ExamEntry = {
  id: "ต.ค. 69!5",
  sheet: "ต.ค. 69",
  row: 5,
  date: "2026-10-21",
  start: "09:00",
  end: "12:00",
  hours: 3,
  code: "DT401",
  title: "Pediatric Dentistry",
  remark: null,
  postponed: false,
  year: 4,
  submitBy: null,
  paperReceived: null,
  rooms: [],
  invigilators: [],
  done: null,
};

describe("diffSnapshots", () => {
  it("reports moved, added and removed sessions", () => {
    const before = teachingSnapshot([base, { ...base, id: "F9", title: "Research 3" }], "t0");
    const after = teachingSnapshot([{ ...base, id: "H40", date: "2026-11-05", start: "10:00", end: "12:00" }, { ...base, id: "N1", title: "Lab 9" }], "t1");
    const changes = diffSnapshots(before, after);
    expect(changes.map((change) => [change.kind, change.label.th])).toEqual([
      ["changed", "Final Examination: Pediatric Dentistry"],
      ["added", "Lab 9"],
      ["removed", "Research 3"],
    ]);
    expect(changes[0]).toMatchObject({
      before: { th: "2026-10-21 09:00–11:00", en: "Wed 21 Oct 2026, 09:00–11:00" },
      after: { th: "2026-11-05 10:00–12:00", en: "Thu 5 Nov 2026, 10:00–12:00" },
    });
  });

  it("is empty when only cell positions changed", () => {
    const a = teachingSnapshot([base], "t0");
    const b = teachingSnapshot([{ ...base, id: "Z99" }], "t1");
    expect(diffSnapshots(a, b)).toEqual([]);
  });

  it("stores exams without UI words and adds them per language when showing a change", () => {
    const before = examSnapshot([exam], "t0");
    expect(Object.values(before.items)[0]).toEqual({ label: "Pediatric Dentistry", year: 4, value: "2026-10-21 09:00–12:00 · — · —", date: "2026-10-21" });

    const after = examSnapshot([{ ...exam, rooms: ["DT01"] }], "t1");
    const [change] = diffSnapshots(before, after);
    expect(change).toMatchObject({
      kind: "changed",
      label: { th: "Pediatric Dentistry (ปี 4)", en: "Pediatric Dentistry (Year 4)" },
      before: { th: "2026-10-21 09:00–12:00 · ยังไม่มีห้อง · ยังไม่มีกรรมการ", en: "Wed 21 Oct 2026, 09:00–12:00 · No room yet · No invigilators yet" },
      after: { th: "2026-10-21 09:00–12:00 · DT01 · ยังไม่มีกรรมการ", en: "Wed 21 Oct 2026, 09:00–12:00 · DT01 · No invigilators yet" },
    });
  });

  it("reads baselines saved with Thai placeholders without reporting false changes", () => {
    const legacy: Snapshot = {
      takenAt: "t0",
      items: {
        "e:DT401|pediatric dentistry": { label: "Pediatric Dentistry (ปี 4)", value: "ยังไม่มีวัน · ยังไม่มีห้อง · ยังไม่มีกรรมการ", date: null },
        "e:|removed exam": { label: "Removed exam (ปี 3)", value: "ยังไม่มีวัน · ยังไม่มีห้อง · ยังไม่มีกรรมการ", date: null },
      },
    };
    const now = examSnapshot([{ ...exam, date: null, start: null, end: null }], "t1");
    expect(diffSnapshots(legacy, now)).toEqual([
      {
        key: "e:|removed exam",
        kind: "removed",
        label: { th: "Removed exam (ปี 3)", en: "Removed exam (Year 3)" },
        before: { th: "ยังไม่มีวัน · ยังไม่มีห้อง · ยังไม่มีกรรมการ", en: "No date yet · No room yet · No invigilators yet" },
        after: null,
        date: null,
      },
    ]);
  });
});
