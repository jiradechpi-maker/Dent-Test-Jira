/** Spreadsheet-agnostic view of one worksheet: values, fills and merged ranges (1-based rows/columns). */

export type CellValue = string | number | boolean | Date | null;

export interface GridCell {
  value: CellValue;
  /** Background as "RRGGBB" (upper-case), or null when the cell has no solid fill. */
  fill: string | null;
}

export interface MergeRange {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface Grid {
  name: string;
  hidden: boolean;
  rowCount: number;
  columnCount: number;
  cells: Map<string, GridCell>;
  merges: MergeRange[];
}

const key = (row: number, col: number) => `${row}:${col}`;

export function createGrid(name: string, options: { hidden?: boolean } = {}): Grid {
  return { name, hidden: options.hidden ?? false, rowCount: 0, columnCount: 0, cells: new Map(), merges: [] };
}

export function setCell(grid: Grid, row: number, col: number, value: CellValue, fill: string | null = null): void {
  grid.cells.set(key(row, col), { value, fill });
  grid.rowCount = Math.max(grid.rowCount, row);
  grid.columnCount = Math.max(grid.columnCount, col);
}

export function addMerge(grid: Grid, range: string | MergeRange): void {
  grid.merges.push(typeof range === "string" ? parseRange(range) : range);
}

export function getCell(grid: Grid, row: number, col: number): GridCell | undefined {
  return grid.cells.get(key(row, col));
}

/** The merged range whose top-left cell is (row, col), if any. */
export function mergeAt(grid: Grid, row: number, col: number): MergeRange | undefined {
  return mergeIndex(grid).get(key(row, col));
}

/** Value of a cell, resolving cells hidden inside a merged range to the range's top-left value. */
export function valueAt(grid: Grid, row: number, col: number): CellValue {
  const own = getCell(grid, row, col)?.value ?? null;
  if (own !== null && own !== "") return own;
  const owner = mergeOwner(grid).get(key(row, col));
  return owner ? (getCell(grid, owner.top, owner.left)?.value ?? null) : own;
}

export function textAt(grid: Grid, row: number, col: number): string {
  return cellText(valueAt(grid, row, col));
}

export function cellText(value: CellValue): string {
  if (value === null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

const mergeCache = new WeakMap<Grid, { index: Map<string, MergeRange>; owner: Map<string, MergeRange>; size: number }>();

function buildMergeCache(grid: Grid) {
  const cached = mergeCache.get(grid);
  if (cached && cached.size === grid.merges.length) return cached;
  const index = new Map<string, MergeRange>();
  const owner = new Map<string, MergeRange>();
  for (const range of grid.merges) {
    index.set(key(range.top, range.left), range);
    for (let r = range.top; r <= range.bottom; r++) {
      for (let c = range.left; c <= range.right; c++) {
        if (r !== range.top || c !== range.left) owner.set(key(r, c), range);
      }
    }
  }
  const next = { index, owner, size: grid.merges.length };
  mergeCache.set(grid, next);
  return next;
}

function mergeIndex(grid: Grid) {
  return buildMergeCache(grid).index;
}

function mergeOwner(grid: Grid) {
  return buildMergeCache(grid).owner;
}

/** "A" → 1, "AA" → 27. */
export function columnNumber(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

/** 1 → "A", 27 → "AA". */
export function columnLetters(col: number): string {
  let s = "";
  let n = col;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function cellRef(row: number, col: number): string {
  return `${columnLetters(col)}${row}`;
}

/** "B3:D7" → {top:3,left:2,bottom:7,right:4}. */
export function parseRange(range: string): MergeRange {
  const match = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/i.exec(range.trim());
  if (!match) throw new RangeError(`Invalid range: ${range}`);
  const left = columnNumber(match[1]!);
  const top = Number(match[2]);
  const right = match[3] ? columnNumber(match[3]) : left;
  const bottom = match[4] ? Number(match[4]) : top;
  return { top: Math.min(top, bottom), left: Math.min(left, right), bottom: Math.max(top, bottom), right: Math.max(left, right) };
}
