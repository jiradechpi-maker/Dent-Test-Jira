import { describe, expect, it } from "vitest";
import { findExamClashes, findIncompleteExams } from "./checks";
import type { ExamEntry } from "./invigilation";
import { suggestInvigilators, suggestRooms, withSuggestions } from "./suggest";

function exam(partial: Partial<ExamEntry> & Pick<ExamEntry, "id">): ExamEntry {
  return {
    sheet: "t",
    row: 1,
    date: "2026-10-30",
    start: "09:00",
    end: "11:00",
    hours: 2,
    code: null,
    title: partial.id,
    remark: null,
    postponed: false,
    year: 3,
    submitBy: null,
    paperReceived: null,
    rooms: [],
    invigilators: [],
    done: null,
    ...partial,
  };
}

describe("suggestRooms", () => {
  it("offers 401 first for clinical years and the building-55 pair first for years 1–2", () => {
    expect(suggestRooms(exam({ id: "a", year: 4 }), [])[0]?.rooms).toEqual(["Conference room 1 (401)"]);
    expect(suggestRooms(exam({ id: "b", year: 2 }), [])[0]?.rooms).toEqual(["DT01", "DT03"]);
  });

  it("skips options with a room already taken at that time, keeping pairs together", () => {
    const busy = exam({ id: "busy", rooms: ["Lecture 1"], start: "10:00", end: "12:00" });
    const options = suggestRooms(exam({ id: "c", year: 4, rooms: [] }), [busy]).map((rule) => rule.id);
    expect(options).not.toContain("lecture13");
    expect(options[0]).toBe("conf401");
  });
});

describe("suggestInvigilators", () => {
  it("never suggests resigned staff or someone busy at the same time", () => {
    const busy = exam({ id: "busy", invigilators: ["Job"] });
    const people = suggestInvigilators(exam({ id: "x" }), [busy], [], 30);
    expect(people).not.toContain("Job");
    expect(people).not.toContain("Oil");
    expect(people).not.toContain("Jeab");
  });

  it("prefers building-55 staff for years 1–2 and the fewest hours otherwise", () => {
    const loads = [
      { name: "Bank", recorded: 1, planned: 0, total: 1, pending: [] },
      { name: "Time", recorded: 20, planned: 0, total: 20, pending: [] },
    ];
    expect(["Aom", "Pao", "Time"]).toContain(suggestInvigilators(exam({ id: "y", year: 1 }), [], loads, 1)[0]);
    const clinic = suggestInvigilators(exam({ id: "z", year: 4 }), [], loads, 19);
    // Clinic-building staff first (Bank, with 1 h, after those with 0 h), building-55 staff last.
    expect(clinic.slice(-3).sort()).toEqual(["Aom", "Pao", "Time"]);
    expect(clinic.at(-4)).toBe("Bank");
  });
});

describe("withSuggestions", () => {
  it("does not hand the same room or person to two open exams at the same time", () => {
    const entries = [exam({ id: "y4", year: 4 }), exam({ id: "y3", year: 3, start: "10:00", end: "12:00" })];
    const issues = withSuggestions(findIncompleteExams(entries, "2026-10-01"), entries, []);
    const [first, second] = issues.map((issue) => issue.suggestion ?? "");
    expect(first).toContain("401");
    expect(second).not.toMatch(/ห้องที่ว่าง: Conference/);
    const people = (text: string) => text.split("น้อยสุด: ")[1]?.split(", ") ?? [];
    expect(people(first!).filter((name) => people(second!).includes(name))).toEqual([]);
  });

  it("flags and replaces a resigned invigilator", () => {
    const entries = [exam({ id: "r", rooms: ["Conference room 1 (401)"], invigilators: ["Oil", "Bank"] })];
    const issues = withSuggestions(findIncompleteExams(entries, "2026-10-01"), entries, []);
    expect(issues[0]).toMatchObject({ kind: "resigned-invigilator" });
    expect(issues[0]?.suggestion).toMatch(/น้อยสุด: \w+$/);
  });

  it("tells which exam to move on a room clash", () => {
    const entries = [
      exam({ id: "a", rooms: ["Conference room 1 (401)"], invigilators: ["Bank", "Ko"] }),
      exam({ id: "b", title: "Biomaterials", rooms: ["Conference room 1 (401)"], invigilators: ["Pim", "Thai"], start: "10:00", end: "12:00" }),
    ];
    const clash = withSuggestions(findExamClashes(entries), entries, []).find((issue) => issue.kind === "room-clash");
    expect(clash?.suggestion).toMatch(/^ย้าย Biomaterials ไป: Lecture 1 \+ Lecture 3/);
  });
});
