export type Status = "nominal" | "review" | "priority" | "unknown";
export type CategoryId = "recovery" | "vitals" | "adaptation";
export interface JournalEntry {
  id: string;
  crewId: string;
  action: string;
  at: string;
  note: string;
  synthetic: true;
}
export function categoryStatus(states: Status[]): Status {
  if (states.includes("priority")) return "priority";
  if (states.includes("review")) return "review";
  if (!states.length || states.includes("unknown")) return "unknown";
  return "nominal";
}
const rank: Record<Status, number> = {
  priority: 0,
  review: 1,
  unknown: 2,
  nominal: 3,
};
export function prioritizeCategories<T extends { status: Status }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => rank[a.status] - rank[b.status]);
}
export function readJournal(raw: string | null): JournalEntry[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(
      (entry): entry is JournalEntry =>
        entry &&
        typeof entry.id === "string" &&
        typeof entry.crewId === "string" &&
        typeof entry.action === "string" &&
        typeof entry.at === "string" &&
        Number.isFinite(Date.parse(entry.at)) &&
        typeof entry.note === "string" &&
        entry.synthetic === true,
    );
  } catch {
    return [];
  }
}
export function appendJournal(
  entries: JournalEntry[],
  entry: JournalEntry,
): JournalEntry[] {
  return entries.some((item) => item.id === entry.id)
    ? entries
    : [entry, ...entries];
}
export function mergeJournals(
  current: JournalEntry[],
  stored: JournalEntry[],
): JournalEntry[] {
  return [
    ...new Map(
      [...current, ...stored].map((entry) => [entry.id, entry]),
    ).values(),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
