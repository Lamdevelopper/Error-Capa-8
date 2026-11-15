import { test } from "node:test";
import assert from "node:assert/strict";
import { getMetrics } from "./data.ts";
import {
  worstStatus,
  sortMetrics,
  categoryStatus,
  crewStatus,
} from "./health.ts";

test("status precedence preserves unknown data", () => {
  assert.equal(worstStatus([]), "unknown");
  assert.equal(worstStatus(["ok", "unknown"]), "unknown");
  assert.equal(worstStatus(["unknown", "warn", "alert"]), "alert");
});

test("fatigue scenario identifies the star crew member and missing radiation", () => {
  const metrics = getMetrics("star", "fatigue");
  assert.equal(metrics.find((m) => m.id === "cortisol")?.status, "alert");
  assert.equal(metrics.find((m) => m.id === "hrv")?.status, "alert");
  assert.equal(metrics.find((m) => m.id === "sleep")?.status, "warn");
  assert.equal(metrics.find((m) => m.id === "radiation")?.value, null);
  assert.equal(metrics.find((m) => m.id === "radiation")?.status, "unknown");
  assert.equal(categoryStatus(metrics, "mental"), "alert");
  assert.equal(crewStatus(metrics), "alert");
});

test("sorting prioritizes attention and does not mutate inputs", () => {
  const metrics = getMetrics("triangle");
  const original = metrics.map((m) => m.id);
  const sorted = sortMetrics(metrics);
  assert.deepEqual(
    metrics.map((m) => m.id),
    original,
  );
  assert.equal(sorted[0].status, "unknown");
  assert.equal(categoryStatus([], "sleep"), "unknown");
});

test("fixtures are deterministic and scenarios differ", () => {
  assert.deepEqual(
    getMetrics("star", "fatigue"),
    getMetrics("star", "fatigue"),
  );
  assert.equal(
    getMetrics("star", "nominal").find((m) => m.id === "hrv")?.status,
    "ok",
  );
});

test("square sleep warning applies only in the fatigue scenario", () => {
  const fatigue = getMetrics("square", "fatigue");
  assert.equal(fatigue.find((m) => m.id === "sleep")?.value, 6.4);
  assert.equal(fatigue.find((m) => m.id === "sleep")?.status, "warn");
  assert.equal(fatigue.find((m) => m.id === "cortisol")?.status, "ok");
  assert.equal(fatigue.find((m) => m.id === "hrv")?.status, "ok");
  assert.equal(
    getMetrics("square", "nominal").find((m) => m.id === "sleep")?.status,
    "ok",
  );
});

test("crew and 24-point trends are deterministic and bounded", () => {
  assert.notEqual(
    getMetrics("triangle")[0].value,
    getMetrics("circle")[0].value,
  );
  const star = getMetrics("star");
  for (const metric of star)
    assert.equal(metric.series.length, metric.value === null ? 0 : 24);
  assert.ok(
    star.find((m) => m.id === "spo2")!.series.every((value) => value <= 100),
  );
  const hrv = star.find((m) => m.id === "hrv")!.series;
  const cortisol = star.find((m) => m.id === "cortisol")!.series;
  assert.ok(hrv[0] > hrv[23]);
  assert.ok(cortisol[0] < cortisol[23]);
});
