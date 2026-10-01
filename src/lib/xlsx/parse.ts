import * as XLSX from "xlsx";

export interface RawRow {
  values: string[];
  links: (string | undefined)[];
}

export interface ParsedSheet {
  name: string;
  headers: string[];
  rows: RawRow[];
}

export interface ParsedWorkbook {
  sheets: ParsedSheet[];
}

const cellText = (cell: XLSX.CellObject | undefined): string =>
  cell == null || cell.v == null ? "" : String(cell.w ?? cell.v).trim();

function parseSheet(name: string, ws: XLSX.WorkSheet): ParsedSheet {
  if (!ws["!ref"]) return { name, headers: [], rows: [] };
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const grid: RawRow[] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: RawRow = { values: [], links: [] };
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined;
      row.values.push(cellText(cell));
      row.links.push(cell?.l?.Target || undefined);
    }
    grid.push(row);
  }

  const nonEmpty = (row: RawRow) => row.values.filter(Boolean).length;
  let headerIdx = grid.findIndex((row) => nonEmpty(row) >= 3);
  if (headerIdx === -1) headerIdx = grid.findIndex((row) => nonEmpty(row) > 0);
  if (headerIdx === -1) return { name, headers: [], rows: [] };

  return {
    name,
    headers: grid[headerIdx].values,
    rows: grid.slice(headerIdx + 1).filter((row) => nonEmpty(row) > 0),
  };
}

export function parseWorkbook(data: ArrayBuffer): ParsedWorkbook {
  const wb = XLSX.read(data, { type: "array", cellDates: false });
  return { sheets: wb.SheetNames.map((n) => parseSheet(n, wb.Sheets[n])) };
}
