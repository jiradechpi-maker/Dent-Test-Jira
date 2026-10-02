import ExcelJS from "exceljs";
import { addMerge, createGrid, setCell, type CellValue, type Grid } from "@/lib/sheets/grid";

/** Parse an .xlsx file into one Grid per worksheet (values, solid fills, merged ranges). */
export async function readWorkbook(data: ArrayBuffer | Uint8Array): Promise<Grid[]> {
  const workbook = new ExcelJS.Workbook();
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  await workbook.xlsx.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);

  return workbook.worksheets.map((sheet) => {
    const grid = createGrid(sheet.name, { hidden: sheet.state !== "visible" });
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        // Cells inside a merged range repeat the master's value in exceljs; keep only the master.
        if (cell.isMerged && cell.master.address !== cell.address) return;
        const value = normalizeValue(cell.value);
        const fill = solidFill(cell.fill);
        if (value === null && fill === null) return;
        setCell(grid, rowNumber, colNumber, value, fill);
      });
    });
    for (const range of sheet.model.merges ?? []) addMerge(grid, range);
    return grid;
  });
}

function normalizeValue(value: ExcelJS.CellValue): CellValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("formula" in value || "sharedFormula" in value) {
      const result = (value as ExcelJS.CellFormulaValue).result;
      if (result === undefined || result === null || typeof result === "object") {
        return result instanceof Date ? result : null;
      }
      return result;
    }
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("error" in value) return null;
  }
  return null;
}

function solidFill(fill: ExcelJS.Fill | undefined): string | null {
  if (!fill || fill.type !== "pattern" || fill.pattern !== "solid") return null;
  const argb = fill.fgColor?.argb;
  if (!argb || argb.length < 6) return null;
  const rgb = argb.slice(-6).toUpperCase();
  return rgb === "FFFFFF" ? null : rgb;
}
