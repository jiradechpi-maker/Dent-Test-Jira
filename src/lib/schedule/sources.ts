import type { Grid } from "@/lib/sheets/grid";

/** The year-4 workbook also carries hidden drafts ("ปี 3 … Draft", an older "ปี 4"). Use the first visible year-4 tab. */
export function pickTeachingSheet(grids: Grid[], year = 4): Grid {
  const visible = grids.filter((grid) => !grid.hidden);
  const named = visible.find((grid) => new RegExp(`ปี\\s*${year}`).test(grid.name));
  const grid = named ?? visible[0] ?? grids[0];
  if (!grid) throw new Error("ไฟล์ไม่มีแผ่นงาน");
  return grid;
}
