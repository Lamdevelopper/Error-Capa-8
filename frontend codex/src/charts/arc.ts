/** Arco SVG de 270° (de 135° a 405°) dibujado en sentido horario. */
export function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  from: number,
  to: number,
) {
  const [x1, y1] = polar(cx, cy, r, from),
    [x2, y2] = polar(cx, cy, r, to);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}
