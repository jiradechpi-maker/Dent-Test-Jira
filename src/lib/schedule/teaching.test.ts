import { describe, expect, it } from "vitest";
import { teachingGrid } from "./test-fixtures";
import { classifySession, extractInstructors, parseTeachingSchedule } from "./teaching";

describe("parseTeachingSchedule", () => {
  const schedule = parseTeachingSchedule(teachingGrid());
  const byId = (id: string) => schedule.sessions.find((session) => session.id === id)!;

  it("reads the title and course legend", () => {
    expect(schedule.title).toBe("Academic Schedule 4th Year (Semester 1/2026)");
    expect(schedule.courses.map((course) => [course.name, course.credits])).toEqual([
      ["Orthodontics", "2(1-3-3)"],
      ["Pediatric Dentistry", "3(2-3-5)"],
    ]);
  });

  it("turns merged cells into time ranges using each week's header", () => {
    expect(byId("D5")).toMatchObject({ date: "2026-06-01", start: "08:00", end: "17:00", kind: "holiday" });
    expect(byId("F6")).toMatchObject({ date: "2026-06-04", start: "09:00", end: "10:00", week: 1, semester: 1 });
    expect(byId("I6")).toMatchObject({ start: "10:30", end: "12:00", kind: "lecture" });
    expect(byId("N6")).toMatchObject({ start: "13:00", end: "16:00", kind: "lab", instructors: ["Kuson", "Nuannapa", "Napat"] });
  });

  it("matches a session to its course by a near-identical legend colour", () => {
    expect(byId("F6").course).toBe("Orthodontics");
    expect(byId("H10").course).toBe("Pediatric Dentistry");
  });

  it("keeps the sheet's note that a session moved", () => {
    expect(byId("H10")).toMatchObject({ kind: "exam", movedFrom: "2026-10-21", week: 2 });
  });

  it("attaches clinic group rows to the date of the merged date cell above", () => {
    expect(byId("F12")).toMatchObject({ date: "2026-06-09", group: "Group 1", kind: "clinic", end: "12:00" });
    expect(byId("F13")).toMatchObject({ date: "2026-06-09", group: "Group 2" });
  });

  it("never guesses a slot for text outside the week's time columns", () => {
    expect(schedule.notes).toEqual([{ id: "W6", date: "2026-06-04", text: "Lab 7 parked outside the grid (Parichart)" }]);
    expect(schedule.sessions.some((session) => session.id === "W6")).toBe(false);
  });
});

describe("classifySession", () => {
  it("does not mistake clinical examination topics for exams", () => {
    expect(classifySession("History and orthodontic examination (Nuannapa)")).toBe("lecture");
    expect(classifySession("Periodontal Examination and charting")).toBe("lecture");
    expect(classifySession("Midterm exam Ortho")).toBe("exam");
    expect(classifySession("Exan Lab 3 upper premolar")).toBe("exam");
    expect(classifySession("สอบ NL")).toBe("exam");
    expect(classifySession("Research 12")).toBe("research");
  });
});

describe("extractInstructors", () => {
  it("strips titles and ignores non-name parentheses", () => {
    expect(extractInstructors("Lecture 1: Introduction (Aj.Parichart)")).toEqual(["Parichart"]);
    expect(extractInstructors("Endo II (Midterm)")).toEqual([]);
    expect(extractInstructors("Pediatric Dentistry (Lab) 3(2-3-5) (36hr)")).toEqual([]);
  });
});
