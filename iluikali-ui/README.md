# iluikali-ui — frontend de la pantalla central

Pantalla compartida donde toda la tripulación ve el estado de todos. Prevención de burnout, **no sustituye a un médico**.

```bash
npm install
npm run dev        # http://localhost:5180
npm run build
```

## Navegación (presentación, diapositivas 4–7)
1. **Home** `#/` — 4 cuadrantes (▲ ■ ● ★). Chips: Sueño / Salud / Mente en verde/amarillo/rojo. El cuadrante se tiñe con el peor estado.
2. **Astronauta** `#/a/star` — al pulsar la forma se abre directamente en la **peor categoría**. Barra lateral con las 3 categorías, 6 widgets ordenados por gravedad, minimapa de tripulación y "señales a revisar".
3. **Detalle** `#/a/star/mental/cortisol` — gráfico grande + tendencia de 6 h, "¿qué es?", análisis IA (probabilidad, tendencia, σ vs. línea base), "qué hacer" y SOS (mantener pulsado 1,5 s + confirmación).

Kiosko: vuelve al Home tras 60 s sin interacción. Teclas de demo: **D** adelanta 3 h · **R** reinicia · **P** pausa · **H/Esc** inicio. `?t=90` arranca en un momento dado.

## Datos
- `src/data/catalog.ts` — métricas de `tipos-de-valores-a-medir.csv` (+ horas de sueño, ritmo circadiano, AFI), rangos, textos y acciones. **Rangos orientativos: revisar con el equipo.**
- `src/data/mockSource.ts` — simulación determinista por astronauta. ★ Citlali reproduce `public/data/astra.csv` (copia de `ASTRA_Bioprocessed_Data.csv`): cortisol, HRV, osteocalcina, AFI.
- `src/data/types.ts` — `DataSource` es el contrato. Para conectar backend/WebSocket, implementar otro `DataSource` y cambiarlo en `src/logic/crew.ts`.
- `src/logic/insight.ts` — modelo local (tendencia lineal → proyección a 3 h → probabilidad logística). JEV / System One entra solo por `DataSource.insight()`.

## Estado
Métrica: promedio de las últimas 3 lecturas contra rango estable / observación (fuera = rojo). Categoría = peor de sus métricas; astronauta = peor categoría.

## Diseño
80's tech (paleta NASA crema/azul/rojo, franja arcoíris pixelada — solo decorativa) + Apple HIG: jerarquía clara, botones ≥ 88 px, retícula de 8 pt, fuente redondeada del sistema, hoja modal para confirmar el SOS, `prefers-reduced-motion`.
El estado vive en el **borde y el fondo** del widget y de su gráfico.
