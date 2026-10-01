import * as XLSX from "xlsx";

export const HEADERS = ["Name", "Url", "Subject", "Difficulty", "Companies", "Topics", "Sprint", "Day", "Prathis", "Eswaran"];

export const ROWS: (string | number)[][] = [
  ["Linear Search", "https://takeuforward.org/practice/dsa/linear-search", "dsa", "Basic", "Accenture | Adobe | Zoho", "Arrays", 1, 1, "Completed", "Completed"],
  ["Largest Element", "", "dsa", "Basic", "Adobe | Google |  Zoho ", "Arrays", 1, 1, "", "Completed"],
  ["Java Basics", "https://takeuforward.org/learning/dsa/java-basics", "oops", "", "", "", 1, 1, "", ""],
  ["Two Sum", "https://takeuforward.org/practice/dsa/two-sum", "DSA", "core", "Google | Amazon | Google", "Hashing | Arrays", 1, 3, "", ""],
  ["", "", "", "", "", "", "", "", "", ""],
  ["Final Coverage", "https://takeuforward.org/learning/core-subject/final", "dbms", "", "", "", "20", "136", "", ""],
];

/** Builds an xlsx ArrayBuffer. Row 2 ("Largest Element") has its link only as a hyperlink on the Name cell. */
export function buildWorkbook(opts: { leadingBlankRows?: number; headers?: string[] } = {}): ArrayBuffer {
  const blanks = Array.from({ length: opts.leadingBlankRows ?? 0 }, () => [] as string[]);
  const aoa = [...blanks, opts.headers ?? HEADERS, ...ROWS];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const nameCell = XLSX.utils.encode_cell({ r: blanks.length + 2, c: 0 });
  ws[nameCell].l = { Target: "https://takeuforward.org/practice/dsa/largest-element" };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DSA Prep Sheet");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["notes"]]), "Other");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}
