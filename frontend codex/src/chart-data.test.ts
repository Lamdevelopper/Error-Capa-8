import { test } from "node:test";
import assert from "node:assert/strict";
import { sleepStages } from "./chart-data.ts";

test("sleep stages agree with the displayed duration in an eight-hour synthetic window", () => {
  for (const hours of [0, 5.2, 6.4, 7.8, 8]) {
    const stages = sleepStages(hours);
    assert.equal(stages.length, 80);
    assert.equal(stages.filter((stage) => stage > 0).length / 10, hours);
    assert.ok(stages.every((stage) => stage >= 0 && stage <= 3));
  }
});

test("sleep chart rejects invalid durations instead of inventing a graph", () => {
  for (const hours of [-1, 9, NaN, Infinity])
    assert.throws(() => sleepStages(hours), RangeError);
});
