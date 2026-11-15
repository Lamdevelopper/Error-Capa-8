# iluikali.health — Frontend (NASA Space Apps 2026, equipo Error en Capa 8)

Léelo completo antes de escribir código. Responde en español.

## Qué es
Pantalla CENTRAL compartida donde toda la tripulación ve el estado de salud de todos. NO reemplaza a un médico: es prevención y detección temprana de burnout/deterioro (un astronauta casi siempre responde "estoy bien" aunque no lo esté). Reto: https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/ — riesgos HRP: https://www.nasa.gov/hrp/risks/
Backend/IA (JEV o System One) aún en desarrollo: el frontend solo consume una interfaz `DataSource`; hoy usa datos simulados.
Repo del equipo: https://github.com/Lamdevelopper/Error-Capa-8 (carpeta `Website/` puede tener trabajo previo; revísala antes de crear nada; `ASTRA_Bioprocessed_Data.csv`, `documentacion/`, `information-flux.md`).

## Navegación (3 pantallas, ver docs/assets/presentacion.pdf)
1. **Home**: 4 cuadrantes (▲ ■ ● ★) = 4 astronautas (configurable 1–6). Cada uno con 3 chips de categoría (Sueño/energía, Salud general, Estado mental) con estado verde/amarillo/rojo. Click en la forma → pantalla 2.
2. **Astronauta**: barra lateral (← volver + las 3 categorías con su color) y hasta 6 widgets de métricas ordenados por gravedad (rojo, amarillo, verde). Click en un widget → pantalla 3.
3. **Detalle**: widget grande + análisis de IA (probabilidad, tendencia, acción recomendada) + botón SOS (mantener pulsado 1.5 s con confirmación). ← vuelve.

## Look & feel: tech de los 80 (ver docs/assets/widgets-referencia.png, moodboard y póster "Flow")
- Widgets = tarjetas azul marino, esquinas muy redondeadas (~28px), franja diagonal arcoíris en la esquina superior izquierda que se deshace en píxeles cuadrados (póster "Flow"), icono arriba a la izquierda, número grande + unidad pequeña en mayúsculas, gráfico abajo.
- Paleta (aprox. a ojo; sacar hex exactos de la imagen): paper #efe3d0 (fondo crema con grano), card #1f2342, ink #f3e6cf, franja #d9503f/#f08a3c/#f5b642, lavanda #8f7fd0, cielo #8fb8e8.
- Tipografía: sans geométrica redondeada gruesa (Outfit/Poppins SemiBold), no monoespaciada.
- Seis tipos de gráfico (componentes reutilizables): `RangeBars` (FC/HRV), `Hypnogram` (sueño), `ArcDial` (circadiano/temperatura), `SegmentBar` (radiación acumulada), `AreaCurve` (cortisol, osteocalcina/NTx), `ArcGauge` (movimiento/energía). Todos dentro de `WidgetFrame`.
- **Estado**: la franja es SOLO decoración y nunca cambia. El estado vive en el borde (6px verde/amarillo/rojo) y en el tinte del fondo cuando no es estable. El color es el canal principal: la tripulación no tiene daltonismo, así que NO se necesita rayado ni patrones. Solo un icono pequeño opcional de estado (● ▲ ✕) por legibilidad a 2–3 m. Verde/rojo más saturados que la franja.

## Métricas (docs/assets/tipos-de-valores-a-medir.csv)
ECG 3 puntos→FC; PPG frente/bandas→SpO2 y respiración; piel→temperatura; ECG+PPG→presión arterial (estimada); acelerómetro 3 ejes→movimiento; sudor/orina espectroscopia→osteocalcina vs NTx (hueso) y cortisol; "radiación" (método poco claro en el CSV, confirmar); PPG arterial→HRV.
Reparto propuesto (revisar con el equipo; una métrica puede estar en varias categorías):
- Sueño/energía: HRV, movimiento, temperatura, respiración/SpO2
- Salud general: FC, presión arterial, SpO2, osteocalcina/NTx, radiación
- Estado mental: cortisol, HRV

## Stack y arquitectura
Vite + React + TypeScript, SVG propio para gráficos, Zustand, Framer Motion solo para transiciones. Escenario fijo 1920×1080 escalado con `transform: scale()`. Navegación por estado + hash routes (`#/astro/triangle/general/hr`) para saltar durante el demo. Sin accesibilidad para daltonismo (la tripulación no lo tiene). Modo kiosko: sin scroll, regreso al Home tras 60 s de inactividad, alertas discretas (rojo pulsa suave, sin sonido por defecto), pie fijo "Apoyo preventivo, no sustituye a un médico".

```
src/ stage/ screens/ components/ data/ logic/ theme/
```
```ts
type Status = 'ok' | 'warn' | 'alert';
type Metric = { id; label; unit; categories: Category[]; series: {t:number; v:number}[]; status: Status; baseline: {mu:number; sigma:number} };
type Insight = { metricId; probability: number; trend: 'up'|'down'|'flat'; text: string; action: string };
interface DataSource { crew(): Astronaut[]; metrics(astroId): Metric[]; insight(astroId, metricId): Promise<Insight>; }
```
Implementaciones: `mockSource` (simulación continua) ahora; `csvSource`/API/WebSocket después. La IA entra solo por `insight()`.

## Lógica de estado
z = (x − μ)/σ contra la línea base propia (primeros días). Verde |z|<1.5; amarillo 1.5≤|z|<2.5; rojo |z|≥2.5 (afinar con valores clínicos). Histéresis: cambia solo si persiste N lecturas. Categoría = peor de sus métricas; astronauta = peor de sus categorías.

## Orden de trabajo
1. Tokens de diseño, `Stage`, `WidgetFrame` + 6 gráficos con página de prueba (cada uno en verde/amarillo/rojo) — validar el look primero.
2. Home con 4 cuadrantes y chips.
3. Pantalla Astronauta y Detalle + SOS.
4. `mockSource` + modo demo (tecla que fuerza al ★ a rojo en Cortisol, flujo completo en 30 s).
5. Conectar CSV e IA.
6. Pulido: píxeles animados, transiciones, accesibilidad.

## Pendientes
- Confirmar contenido y stack de `Website/` en el repo.
- Hex exactos de la paleta; imagen de referencia en mejor resolución.
- Revisar reparto de métricas por categoría y método de medición de radiación.
- Hidratación aparece en la imagen de referencia pero no en el CSV (opcional).

## Archivos a copiar a docs/assets/
presentacion.pdf (Agregar_un_título-1.pdf), widgets-referencia.png (imagen de los 6 widgets), moodboard 80s, boceto a mano, tipos-de-valores-a-medir.csv
