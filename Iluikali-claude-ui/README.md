# Iluikali — pantalla central (rediseño estilo Apple)

Pantalla compartida a pantalla completa, pensada para iPad, donde la tripulación ve el estado de todos. Es apoyo preventivo y no sustituye a un médico. Esta carpeta parte de `iluikali-ui/` y aplica el plan de [PLAN.md](PLAN.md); el original queda intacto.

```bash
npm install
npm run dev      # http://localhost:5180
npm run build
```

En iPad: Safari → Compartir → **Añadir a pantalla de inicio**. El `manifest.webmanifest` abre la app a pantalla completa, sin la interfaz de Safari. En escritorio, el botón de expandir del rail usa la API Fullscreen.

## Recorrido

1. **Inicio** `#/`: cuatro módulos idénticos (▲ ■ ● ★). Todo el módulo, figura y fondo, abre al tripulante en la categoría que más atención pedía al tocar. Los botones Sueño / Salud / Mente abren su categoría directamente.
2. **Tripulante** `#/a/star/mental`: si algo falla, una tarjeta «Qué está pasando» (causa, indicadores tocables y qué hacer); debajo, los widgets de la categoría en orden fijo.
3. **Detalle** `#/a/star/mental/cortisol`: valor y desviación frente a su propia base, **Qué hacer** primero, gráfica **Hoy / Semana** (`?range=week` la abre en semana), análisis y contacto con tierra (mantener 1,5 s y confirmar).

El rail izquierdo está siempre visible: inicio, las figuras con su estado, pantalla completa, hora de la última lectura y rama del dataset. Cambiar de figura conserva la categoría que se está viendo.

## Datos

Usa el dataset real del equipo (motor System 1 JEV): 5 tripulantes, 7 días de lecturas horarias, rama **sin mitigar** y **con mitigación**, y líneas base personales. "Ahora" es la última lectura (día 7, 23:00 UTC); no hay reloj que avance. **M** cambia de rama.

### Cargar datos

Por orden de prioridad:

1. **API del equipo**: `?api=http://localhost:8000` (`backend/.../api_server/decisions_api_server.py`).
2. **Otro archivo**: `?data=ruta.csv` (o `.json`) y, opcionalmente, `&baselines=ruta.csv&scenario=OPTIMISTIC_MITIGATED`.
3. **Por defecto**: `public/data/manifest.json` → `crew-hourly.csv` + `baselines.csv`. Para cambiar los datos del demo, reemplaza esos archivos o edita el manifest.
4. **Arrastrar y soltar** uno o varios CSV/JSON sobre la ventana. Lecturas y baselines se reconocen solos.

Columnas mínimas: `astronaut_id` y `timestamp_utc`. El resto se usa si está (nombres del dataset JEV: `hrv_rmssd_ms`, `cortisol_ug_dL`, `melatonin_pg_mL`, `skin_temp_C`, `bp_sys_mmHg`, `spo2_pct`, `sweat_na_mmol_L`, `rad_mSv_4h`, `egg_cpm`, `ntx_nmol_bce`, `osteocalcin_ng_mL`, `jev_*`, `decision_*`, `primary_driver`, `clinical_protocol`…). Sin `period_code` se deduce de la hora; sin baselines se infieren del primer día. También vale el JSON anidado de la API (`1_measurement`, `4_action`…).

### Cómo se calcula el estado

- z = (valor − esperado) / σ contra la **línea base orbital personal** y la ventana del día (el cortisol de las 08:00 no se juzga como el de las 00:00). Verde |z| < 1,5 · amarillo < 2,5 · rojo ≥ 2,5, sobre la media de las 3 últimas lecturas. Los σ (`src/data/catalog.ts`) se calibraron con la rama mitigada.
- Categoría = peor de sus métricas; tripulante = peor de sus categorías y de la prioridad JEV (P3/P4 rojo, P1/P2 amarillo). P4 se muestra como **Crítico**.
- La causa del motor JEV solo manda en el titular si alguna de sus métricas la respalda; si no, el titular sale de las métricas fuera de rango.
- **Sueño** y **ritmo circadiano** son estimados (etiqueta «Estimado»): la calidad de cada noche sale de HRV, melatonina, temperatura y cortisol de la ventana de sueño; el hipnograma (ciclos de ~90 min, N3 al inicio, REM creciente) se genera con semilla fija por noche, así que nunca cambia. El desfase circadiano compara el pico de melatonina medido con el de su base.

## Qué hace cada sección del código

| Archivo | Responsabilidad |
|---|---|
| `src/styles.css` | Tokens (capas, texto, estados, radios, curva de resorte) y todo el layout. Fuente única de color. |
| `src/components/Rail.tsx` | Navegación lateral fija, pantalla completa y reloj de misión. |
| `src/components/parts.tsx` | Piezas compartidas: `Widget`, `CategoryButton`, `Segmented`, `ScreenHeader`, `StatusLabel`, `ChartBox` (mide su contenedor) y `SosButton`. |
| `src/components/Chart.tsx` | Series (área, doble línea, barras), arco de nivel, hipnograma y reloj circadiano, dibujados al tamaño real en px. |
| `src/components/Icon.tsx` | Familia única de íconos de contorno (24×24, trazo 1.75). |
| `src/components/Shape.tsx` | Figuras con tamaño óptico igualado y trazo que no escala. |
| `src/logic/route.ts` | Ruta en el hash + View Transitions (la figura viaja del módulo a la cabecera). |
| `src/screens/*` | Inicio, Tripulante y Detalle. |
| `src/data/catalog.ts` | Métricas: columna, valor esperado personal, σ, dirección mala, textos y acciones. |
| `src/data/sources/` | Lectores CSV/JSON tolerantes, elección de fuente (URL, manifest, API, arrastrar). |
| `src/logic/crew.ts` | Estado de cada tripulante a partir del dataset y la rama elegida. |
| `src/logic/derive.ts` | Derivadas deterministas: noches de sueño, hipnograma y desfase circadiano. |
| `src/logic/explain.ts` | Diagnóstico en lenguaje humano: causa, indicadores y qué hacer. |
| `src/logic/{store,status,insight}.ts` | Carga, reglas de estado y estimación de tendencia (punto de entrada de la IA). |

## Reglas visuales

- Lo estable se calla: superficie neutra y un punto verde. Lo que pide atención gana peso sin moverse de sitio: anillo y tinte suaves en *Atención*, más intensos y con pulso lento en *Crítico*, y una línea con la causa y la acción.
- El azul solo marca selección y foco.
- En las gráficas, la serie va en tono neutro; el color de estado se reserva para el último punto y las lecturas fuera de rango. La banda verde tenue es el rango normal de esa persona a esa hora.
- La respuesta al toque es inmediata (`:active`) y se libera con curva de resorte. No hay animaciones en bucle. Se respetan `prefers-reduced-motion`, `prefers-reduced-transparency` y `prefers-contrast`.

Teclas: **M** cambia de rama (sin mitigar / con mitigación) · **H/Esc** inicio. Kiosko: vuelve al inicio tras 60 s sin interacción.

## Límites

- El dataset no trae FC, respiración, ejercicio ni fases de sueño medidas: FC/respiración/ejercicio se retiraron y el sueño es estimado.
- Los σ y umbrales son de demo; afinarlos con valores clínicos.
- Verificación: `npm run build`, capturas en Chrome a 1920×1080, 1600×900 y 1180×820 (inicio, tripulante, detalle, vista semana, ambas ramas) y carga de CSV horario, CSV individual sin baselines y JSON de la API sin `NaN`. Falta la prueba en un iPad real.
