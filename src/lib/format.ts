const ACRONYMS: Record<string, string> = {
  dsa: "DSA", dbms: "DBMS", lld: "LLD", hld: "HLD", oops: "OOPs", oop: "OOP", os: "OS", cn: "CN",
  sql: "SQL", dp: "DP", ai: "AI", ml: "ML",
};

/** Display label for a subject slug: "dsa" → "DSA", "computer-networks" → "Computer Networks". */
export function formatSubject(subject: string): string {
  const key = subject.trim().toLowerCase();
  if (ACRONYMS[key]) return ACRONYMS[key];
  return key
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => ACRONYMS[w] ?? w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
