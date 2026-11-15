/** Six-minute synthetic samples within 23:00–07:00; stage composition is illustrative. */
export function sleepStages(durationHours: number): number[] {
  const windowHours = 8,
    samplesPerHour = 10;
  if (
    !Number.isFinite(durationHours) ||
    durationHours < 0 ||
    durationHours > windowHours
  ) {
    throw new RangeError(
      "Sleep duration must fit within the eight-hour demo window.",
    );
  }
  const count = windowHours * samplesPerHour;
  const asleep = Math.round(durationHours * samplesPerHour);
  const sleepStart = Math.floor((count - asleep) / 2);
  const cycle = [2, 2, 3, 3, 2, 1];
  return Array.from({ length: count }, (_, index) =>
    index < sleepStart || index >= sleepStart + asleep
      ? 0
      : cycle[Math.floor((index - sleepStart) / 4) % cycle.length],
  );
}
