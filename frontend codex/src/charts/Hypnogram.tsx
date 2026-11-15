/** Hipnograma. Etapas: 0 despierto, 1 REM, 2 ligero, 3 profundo. Un valor por bloque. */
export function Hypnogram({
  stages,
  labels = ["23", "07"],
}: {
  stages: number[];
  labels?: string[];
}) {
  const W = 500,
    H = 190,
    rowH = 30;
  const step = W / stages.length;
  const color = ["var(--ink)", "var(--sky)", "var(--lavender)", "#5d4fa8"];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={`Synthetic sleep stages from ${labels[0]} to ${labels[1]}; each block represents six minutes`}>
      {[0, 1, 2, 3].map((row) => (
        <line key={row} x1="0" x2={W} y1={23 + row * (rowH + 6)} y2={23 + row * (rowH + 6)} stroke="var(--ink-dim)" strokeWidth="1" opacity="0.2" />
      ))}
      {/* Connect transitions without adding or changing time samples. */}
      {stages.slice(1).map((stage, i) => stage !== stages[i] && (
        <line key={i} x1={(i + 1) * step} x2={(i + 1) * step} y1={23 + stages[i] * (rowH + 6)} y2={23 + stage * (rowH + 6)} stroke="var(--ink-dim)" strokeWidth="2" opacity="0.5" />
      ))}
      {stages.map((s, i) => (
        <rect
          key={i}
          x={i * step}
          y={8 + s * (rowH + 6)}
          width={step + 0.5}
          height={rowH}
          fill={color[s]}
          rx="3"
        />
      ))}
      <line
        x1="0"
        x2={W}
        y1={H - 30}
        y2={H - 30}
        stroke="var(--ink-dim)"
        strokeWidth="1.5"
      />
      <text x="0" y={H - 4} fill="var(--ink)" fontSize="20">
        {labels[0]}
      </text>
      <text x={W} y={H - 4} fill="var(--ink)" fontSize="20" textAnchor="end">
        {labels[1]}
      </text>
    </svg>
  );
}
