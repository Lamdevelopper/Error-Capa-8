# Iluikali 80's tech

Pantalla de salud de la tripulación, con estética de instrumento de los 80. Es apoyo preventivo y no sustituye a un médico. Hay dos versiones en el mismo proyecto:

| Versión | Entrada | Para quién |
|---|---|---|
| **Colectiva** | `index.html` | La tableta común de la nave: todos ven el estado de todos. No hay "usuario". |
| **Individual** | `individual.html` | El dispositivo personal de un astronauta. Solo ve sus datos, en segunda persona, con un check-in que contrasta lo que siente con lo que dicen sus biomarcadores. |

```bash
npm install
npm run dev        # http://localhost:5190/  y  /individual.html
npm run build      # genera las dos páginas en dist/
```

## Colectiva

- **Inicio** `#/`: cinco tarjetas fijas (3 + 2). Cada una muestra:
  - el estado grande, con nombre y rol;
  - la frase de qué falla y qué hacer;
  - tres chips de categoría con la sparkline de su métrica más grave.
  
  Arriba, quién necesita atención, ordenado por gravedad. Si alguien marcó una revisión aparece «Revisado HH:MM».
- **Tripulante** `#/a/circle/sleep`:
  - Sueño / Salud / Mente;
  - el banner **Qué está pasando** (causa, indicadores tocables y qué hacer);
  - hasta seis widgets en orden fijo.
- **Detalle** `#/a/circle/sleep/sleep`:
  - **Sesión / Historial** (`?range=week` lo abre en historial);
  - la franja de datos clave;
  - el panel **Registro**, con origen, periodo, estado, base personal y rama;
  - **Qué hacer**, **Marcar revisión** y **Solicitar apoyo** (mantener 1,5 s y confirmar).
- El rail lateral muestra el inicio, las figuras con su estado, la carga de datos y la hora de la última lectura junto con la rama del dataset. Tras 60 s sin uso vuelve al inicio.

## Individual

- **¿Quién eres?** la primera vez; queda recordado en el dispositivo. `individual.html?astro=AST-03` fija a la persona (modo kiosko) y oculta el botón de cambiar.
- **Hoy**: una frase humana sobre el estado («Tu cuerpo pide descanso hoy»), **tu siguiente acción**, el porqué y tres tarjetas de categoría.
- **Check-in**: energía, ánimo y cómo dormiste, de 1 a 5. Se compara con los biomarcadores. Ejemplo: «Te sientes con energía, pero tu variabilidad cardiaca está −69 % frente a tu base. Tómalo con calma hoy.» Si los indicadores están bien y la persona se siente mal, se valida lo que siente. Las respuestas se quedan en el dispositivo.
- **Tus indicadores** `#/c/general`: se desliza entre categorías con un gesto corto, porque basta con el impulso. El detalle es el mismo que en la colectiva, con textos en segunda persona.

## Datos

Usa el dataset real del motor System 1 JEV (`public/data/`). "Ahora" es la última lectura; los datos no avanzan solos. La tecla **M** cambia entre la rama sin mitigar y la rama con mitigación. Formas de cargar datos:

1. `?api=http://localhost:8000` → API FastAPI del equipo.
2. `?data=archivo.csv` (o `.json`) y, si se quiere, `&baselines=…&scenario=…`.
3. `public/data/manifest.json` (por defecto: `crew-hourly.csv` + `baselines.csv`).
4. El botón de carga del rail, o arrastrar uno o varios CSV/JSON a la ventana. Lecturas y líneas base se reconocen solas. Si el archivo es inválido, una hoja explica qué columnas faltan.

Las columnas mínimas son `astronaut_id` y `timestamp_utc`. El estado se calcula con z frente a la línea base orbital personal y la ventana del día. El sueño y el ritmo circadiano son estimados y deterministas: la misma noche se dibuja siempre igual. Todo esto vive en `src/core/`, copiado de `Iluikali-claude-ui/`; su README tiene el detalle de la lógica.

Las revisiones y los check-ins no son datos clínicos de la fuente. Se guardan en `localStorage` (`iluikali-80s`), y `local.export()` los devuelve como JSON.

## Código

| Carpeta | Contenido |
|---|---|
| `src/core/` | Datos, catálogo, fuentes, estado, diagnóstico, derivadas, rutas y estado local (`local.ts`). |
| `src/ui/tokens.css` | Paleta, tipografía mixta (Space Mono + Outfit), marcos achaflanados, estado con peso y curvas de movimiento. |
| `src/ui/primitives.tsx` | `Frame`, `Signature`, `Badge`, `Segmented`, `HoldButton`, `Sheet`, `useSize`. |
| `src/ui/charts.tsx` | Línea escalonada, barras finas, arco LED, hipnograma por fases, semana de sueño, desfase diario y dial día/noche con sol y luna. |
| `src/ui/blocks.tsx` | `Widget`, `DxBanner`, `MetricDetail`, hojas de carga, error y apoyo, y overlays de datos. Usan `voice: 'crew' \| 'self'`. |
| `src/collective/`, `src/individual/` | Pantallas de cada versión. `individual/compare.ts` contiene el contraste entre check-in y biomarcadores. |

## Decisiones de diseño

- Lo estable se calla: el borde es crema tenue. Lo que pide atención gana borde de color, tinte y una frase. Lo **crítico** (prioridad P4) lleva un borde más grueso y un pulso lento solo en el punto. Las tarjetas no cambian de sitio.
- Movimiento:
  - curvas ease-out fuertes;
  - respuesta al presionar con `scale(.97)`;
  - entradas escalonadas no uniformes, una sola vez;
  - las gráficas se trazan solo al montarse y cambian por fundido al pasar de Sesión a Historial;
  - mantener para apoyo: el relleno avanza lento y se suelta rápido;
  - la figura viaja a la cabecera con View Transitions.
  
  Con `prefers-reduced-motion` todo queda en fundidos y sin pulso.
- De las imágenes de `docs/diseno-ui/` se descartaron: el avatar de usuario único, la etiqueta «DEMO» en todas partes, las cifras inventadas y las métricas que no están en el dataset.

## Verificación

- `npm run build` sin errores en ambas entradas.
- Capturas con Playwright a 1920×1080, 1180×820 y 820×1180 de: inicio en ambas ramas, tripulante, detalle de sueño, circadiano, cortisol semanal, hojas de apoyo y error, revisión marcada, «¿Quién eres?», Hoy con un check-in contradictorio, categorías y reduced-motion.
- Gesto de deslizar comprobado (izquierda → Mente, derecha → Salud). Sin `NaN` ni `undefined` en el DOM.
- Falta probarlo en un iPad real.
