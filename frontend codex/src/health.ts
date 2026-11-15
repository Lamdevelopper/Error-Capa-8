import type { CategoryId, Metric, Status } from "./data.ts";

const priority: Record<Status, number> = {
  alert: 3,
  warn: 2,
  unknown: 1,
  ok: 0,
};
export function worstStatus(statuses: Status[]): Status {
  return statuses.length
    ? statuses.reduce((worst, status) =>
        priority[status] > priority[worst] ? status : worst,
      )
    : "unknown";
}
export function sortMetrics(metrics: Metric[]): Metric[] {
  return [...metrics].sort((a, b) => priority[b.status] - priority[a.status]);
}
export function categoryStatus(
  metrics: Metric[],
  category: CategoryId,
): Status {
  return worstStatus(
    metrics
      .filter((metric) => metric.categories.includes(category))
      .map((metric) => metric.status),
  );
}
export function crewStatus(metrics: Metric[]): Status {
  return worstStatus(metrics.map((metric) => metric.status));
}
