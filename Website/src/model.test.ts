import { describe, expect, it } from "vitest";
import {
  mergeJournals,
  categoryStatus,
  prioritizeCategories,
  readJournal,
  appendJournal,
} from "./model";
import { crew } from "./data";

describe("crew state presentation", () => {
  it("does not paint an entirely missing category green", () => {
    expect(categoryStatus(["unknown", "unknown"])).toBe("unknown");
  });
  it("preserves an attention signal when another measurement is missing", () => {
    expect(categoryStatus(["unknown", "review"])).toBe("review");
    expect(categoryStatus(["nominal", "priority"])).toBe("priority");
  });
  it("keeps incomplete categories from appearing fully nominal", () => {
    expect(categoryStatus(["nominal", "unknown"])).toBe("unknown");
  });
  it("prioritizes issues before nominal categories without mutating the overview order", () => {
    const categories = [
      { id: "vitals", status: "nominal" as const },
      { id: "recovery", status: "review" as const },
      { id: "adaptation", status: "unknown" as const },
    ];
    expect(prioritizeCategories(categories).map((x) => x.id)).toEqual([
      "recovery",
      "adaptation",
      "vitals",
    ]);
    expect(categories[0].id).toBe("vitals");
  });
});

describe("local demo action journal", () => {
  it("preserves a newer entry from another tab when saving from stale memory", () => {
    const saved = {
      id: "tab-a",
      crewId: "alex",
      action: "Check-in recorded",
      at: "2026-11-14T18:00:00Z",
      note: "Demo A",
      synthetic: true as const,
    };
    const next = {
      ...saved,
      id: "tab-b",
      at: "2026-11-14T18:01:00Z",
      note: "Demo B",
    };
    const merged = appendJournal(mergeJournals([], [saved]), next);
    expect(merged.map((entry) => entry.id)).toEqual(["tab-b", "tab-a"]);
    expect(mergeJournals([saved], [saved])).toHaveLength(1);
  });
  it("recovers from damaged storage and rejects malformed saved entries", () => {
    expect(readJournal("{bad")).toEqual([]);
    expect(readJournal('[{"id":"broken"}]')).toEqual([]);
  });
  it("records one action without clearing or duplicating an existing observation", () => {
    const entry = {
      id: "1",
      crewId: "alex",
      action: "Check-in completed",
      at: "2026-11-14T18:00:00Z",
      note: "Tired",
      synthetic: true as const,
    };
    expect(appendJournal([], entry)).toEqual([entry]);
    expect(appendJournal([entry], entry)).toHaveLength(1);
    expect(readJournal(JSON.stringify([entry]))).toEqual([entry]);
  });
});

describe("demo chart consistency", () => {
  it("does not place a missing sample inside the current week", () => {
    const missing = crew
      .find((p) => p.id === "noor")!
      .categories.flatMap((c) => c.metrics)
      .find((m) => m.id === "osteocalcin")!;
    expect(missing.history["7d"]).toEqual([]);
    expect(missing.history["30d"].at(-1)!.time).toBe("D076");
  });
  it("ends each non-empty chart at the displayed current reading", () => {
    for (const person of crew)
      for (const category of person.categories)
        for (const metric of category.metrics) {
          if (metric.value === "—") continue;
          for (const points of Object.values(metric.history)) {
            if (!points.length) continue;
            const precision =
              metric.id === "cortisol" ||
              metric.id === "temperature" ||
              metric.id === "sleep"
                ? 1
                : 0;
            expect(
              points.at(-1)!.value.toFixed(precision),
              `${person.id}/${metric.id}`,
            ).toBe(parseFloat(metric.value).toFixed(precision));
          }
        }
  });
});
