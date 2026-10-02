import { addMerge, createGrid, setCell, type CellValue, type Grid } from "@/lib/sheets/grid";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const HOURS = ["08.00-09.00", "09.00-10.00", "10.00-11.00", "11.00-12.00", "12.00-13.00", "13.00-14.00", "14.00-15.00", "15.00-16.00", "16.00-17.00"];

function header(grid: Grid, row: number) {
  setCell(grid, row, 3, "Date/ Time");
  HOURS.forEach((label, i) => {
    const col = 4 + i * 2;
    setCell(grid, row, col, label);
    addMerge(grid, { top: row, left: col, bottom: row, right: col + 1 });
  });
}

/** A miniature of the faculty's year-4 sheet: two weeks, a legend, merged sessions, clinic group rows, parked text. */
export function teachingGrid(): Grid {
  const g = createGrid("ปี 4 (2569)1");
  setCell(g, 2, 3, "Academic Schedule 4th Year (Semester 1/2026)", "FFFF00");
  setCell(g, 3, 3, "Week 1");
  header(g, 4);
  setCell(g, 5, 3, d("2026-06-01"));
  setCell(g, 5, 4, "Day off (Substitute for Visakha Bucha Day)", "A5A5A5");
  addMerge(g, "D5:U5");
  setCell(g, 6, 1, "Orthodontics \n2(1-3-3) ", "F4CCCC");
  setCell(g, 6, 3, d("2026-06-04"));
  setCell(g, 6, 6, "Introduction in Orthodontics (Nuannapa)", "FAD9D6");
  addMerge(g, "F6:G6");
  setCell(g, 6, 9, "Lecture 3: Examination and diagnosis (Aj.Piyanee)", "FAD9D6");
  addMerge(g, "I6:K6");
  setCell(g, 6, 14, "Lab 2: Orthodontic diagnosis (Kuson/ Nuannapa/Napat)", "FAD9D6");
  addMerge(g, "N6:S6");
  setCell(g, 6, 23, "Lab 7 parked outside the grid (Parichart)");
  setCell(g, 8, 3, "Week 2");
  header(g, 9);
  setCell(g, 10, 1, "Pediatric Dentistry\n3(2-3-5)", "8FD7DC");
  setCell(g, 10, 3, d("2026-06-08"));
  setCell(g, 10, 8, "Final Examination: Pediatric Dentistry (ย้ายมาจาก 21/10/26)", "8FD7DC");
  addMerge(g, "H10:K10");
  setCell(g, 11, 3, d("2026-06-09"));
  addMerge(g, "C11:C13");
  setCell(g, 11, 6, "CC1");
  setCell(g, 12, 6, "(Group 1) Diagnosis Clinic");
  addMerge(g, "F12:K12");
  setCell(g, 13, 6, "(Group 2) Restorative Clinic");
  addMerge(g, "F13:K13");
  return g;
}

function row(grid: Grid, r: number, values: CellValue[]) {
  values.forEach((value, i) => {
    if (value !== null) setCell(grid, r, i + 1, value);
  });
}

const MONTH_HEADER = ["Date", "Time", "Hours", "Code", "Course Title", "Student’s \nYear", "ส่งข้อสอบภายในวันที่", "Finished", "Exam Room", "Invigilator", "Finished"];

export function invigilationGrids(): Grid[] {
  const summary = createGrid("ตารางเวลาคุมสอบ 2569");
  row(summary, 1, ["ลำดับ", "กรรมการคุมสอบ", "วัน/ชั่วโมง คุมสอบ"]);
  row(summary, 2, [null, null, "Thu. 08-10-69", "Fri. 09-10-69", "ชั่วโมงรวมทั้งหมด"]);
  row(summary, 3, [null, null, "(9.00-11.00)", "13.00-15.00"]);
  row(summary, 4, [null, null, "Basic Cardiovascular (Midterm)", "Preventive Dentistry (Final)"]);
  row(summary, 5, [null, null, 2, 2]);
  row(summary, 6, [1, "Mors", "Mors", null]);
  row(summary, 7, [2, "Nurse", "Nurse", "Pim"]);
  row(summary, 8, [null, "Total"]);

  const october = createGrid("กรรมการคุมสอบเดือนตุลาคม 69");
  row(october, 1, ["ตารางกรรมการคุมสอบเดือนตุลาคม 2569"]);
  row(october, 2, MONTH_HEADER);
  row(october, 3, ["Thu. 08-10-69", "09.00-11.00", 2, 20626214, "Basic Cardiovascular (Midterm)", 2, "Thu. 01-10-69", true, "DT01\nDT03", "P'Moss/Nurse", false]);
  row(october, 4, ["Fri. 09-10-69", "13.00-15.00", 2, 20636303, "Preventive Dentistry (Final Exam) ***หาวันลงอยู่***", 3, null, false, "Conference \nroom 1 (401)", "Nurse/Pim", false]);
  row(october, 5, ["Wed. 21-10-69", "09.00-11.00", 2, 20636400, "Pediatric Dentistry (Final Exam)", 4, null, false, "Conference \nroom 1 (401)", "Time/Ball", false]);
  row(october, 6, ["Wed. 21-10-69", "09.00-11.00", 2, 20636504, "Community and Family Dentistry Exam", 5, null, false, "Conference \nroom 1 (401)", "Time/Ball", false]);
  row(october, 7, ["Mon. 26-10-69", "09.00-12.00", 3, 20636007, "Integrated Pathophysiology and Medicine (Exam)", 4, null, false, "Conference \nroom 1 (401)", "Earth", false]);
  row(october, 8, ["Mon. 26-10-69", "10.00-12.00", 2, 20636309, "Dental Biomaterials (Final Exam)", 3, null, false, "Conference \nroom 1 (401)", "Earth/Ploy", false]);
  row(october, 9, ["Wed. 28-10-69", "09.00-12.00", 3, 20636314, "Complete Denture (CD lab exam)", 3, null, false, "Common Lab", "Nortor/Nurse", false]);
  row(october, 10, [null, "13.00-16.00", 3, null, null, null, null, null, null, "Namtan2/Nurse", false]);
  for (const range of ["A9:A10", "D9:D10", "E9:E10", "F9:F10", "I9:I10"]) addMerge(october, range);
  row(october, 11, [null, "13.00-15.00", 2, 20626214, "Respiratory (Midterm) ***เลื่อน***", 2, null, false, null, null, false]);

  return [summary, october, createGrid("ตารางเวลาคุมสอบกันยายน 2569", { hidden: true })];
}
