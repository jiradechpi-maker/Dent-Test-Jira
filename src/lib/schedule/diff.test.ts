import { describe, expect, it } from "vitest";
import { diffSnapshots, teachingSnapshot } from "./diff";
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

describe("diffSnapshots", () => {
  it("reports moved, added and removed sessions", () => {
    const before = teachingSnapshot([base, { ...base, id: "F9", title: "Research 3" }], "t0");
    const after = teachingSnapshot([{ ...base, id: "H40", date: "2026-11-05", start: "10:00", end: "12:00" }, { ...base, id: "N1", title: "Lab 9" }], "t1");
    const changes = diffSnapshots(before, after);
    expect(changes.map((change) => [change.kind, change.label])).toEqual([
      ["changed", "Final Examination: Pediatric Dentistry"],
      ["added", "Lab 9"],
      ["removed", "Research 3"],
    ]);
    expect(changes[0]).toMatchObject({ before: "2026-10-21 09:00–11:00", after: "2026-11-05 10:00–12:00" });
  });

  it("is empty when only cell positions changed", () => {
    const a = teachingSnapshot([base], "t0");
    const b = teachingSnapshot([{ ...base, id: "Z99" }], "t1");
    expect(diffSnapshots(a, b)).toEqual([]);
  });
});
