# NASA Data & Evidence Strategy — no confundir evidencia con telemetría

## Por qué importa para el concurso

El diferenciador no es poner un logo de NASA: es lograr que el usuario pueda inspeccionar **qué observó el producto, qué fuente avala la relevancia espacial de esa observación, qué inferencia es válida y qué paso sigue**. El jurado debe verlo en la demo.

## Cuatro capas que NO son equivalentes

| Capa | Ejemplo | Qué prueba | Qué NO prueba |
|---|---|---|---|
| A. NASA hazard/risk research | HRP: cinco peligros, sueño y rendimiento | El problema existe y NASA lo estudia | Un umbral clínico o diagnóstico individual |
| B. NASA Standard Measures | actividad, sueño, cuestionarios, pruebas | Qué tipos de mediciones se usan en investigación espacial | Que nuestra app usa sus datos ni que watch comercial sea equivalente |
| C. NASA OSDR dataset real | OSD-575 (biomarcadores séricos Inspiration4) | Datos de una investigación publicada con identificador/licencia | Telemetría de HR/sueño en vivo ni evaluación individual actual |
| D. Datos de la demo | Galaxy Watch / manual / sintético | Que el flujo funciona con datos de ese origen | Validez clínica o que sean datos de NASA |

## Registro inicial de evidencia (para el panel `Why this matters?`)

| ID | Fuente oficial | Claim defendible | Límite |
|---|---|---|---|
| `nasa-five-hazards` | https://www.nasa.gov/hrp/hazards/ | NASA identifica cinco categorías de peligros del vuelo espacial | No equivale a herramientas clínicas |
| `nasa-sleep-risk` | https://www.nasa.gov/hrp/risks/ | Sueño insuficiente y horarios irregulares son riesgos relevantes para la salud y desempeño | No define las reglas de umbral de esta demo |
| `nasa-isolation` | https://www.nasa.gov/hrp/hazard-isolation-and-confinement/ | Aislamiento/confinamiento puede relacionarse con pérdida de sueño, desajuste circadiano y estrés | No diagnostica trastornos |
| `nasa-standard-measures` | https://www.nasa.gov/reference/standard-measures/ | NASA estudia múltiples dominios de salud con medidas estandarizadas, incluidos sueño/cuestionarios y sensores en muñeca | Nuestro reloj no es instrumento de ese protocolo automáticamente |
| `nasa-hrr` | https://humanresearchroadmap.nasa.gov/architecture/ | NASA mantiene jerarquías de riesgos y bases de evidencia | Requiere comprobar riesgo/estudio específico para cada inferencia |
| `osdr-575` | https://osdr.nasa.gov/bio/repo/data/studies/OSD-575 | Estudio publicado de biomarcadores séricos pre/post Inspiration4, DOI `10.26030/mc5d-p710` | No contiene streaming sleep/HR del Galaxy Watch |

**Regla:** registrar URL + fecha de consulta + página/figura/tablas relevantes + frase corta propia del equipo. Para fuentes académicas externas, incluir DOI/autores. No copiar texto extenso de artículos ni inferir causalidad a partir de correlaciones.

## Un dataset concreto: OSD-575 (candidato, no integrado aún)

- Registro de NASA OSDR: `OSD-575`, SpaceX Inspiration4 Blood Serum Metabolic Panel and Immune/Cardiac Cytokine Arrays.
- Estudio de 3 días con muestras de sangre antes/después de la misión; datos de biomarcadores metabólicos/inmunes/cardiovasculares, no wearable continuo.
- DOI: `10.26030/mc5d-p710`. La página del estudio indica licencia CC0-1.0 y versión; **confirmar al descargar**.
- Puede servir para una visualización de investigación secundaria (“what NASA researchers measure”), **no** para inferir riesgo médico del usuario del watch.
- **No se incluye el dataset en este ZIP**. No decir «integrado» sin archivo, análisis, tests de unidades y registro de transformación.

## Protocolo de integración de NASA dataset

1. Elegir dataset ligado al caso de uso, no solo visualmente atractivo.
2. Guardar accession, DOI, licencia, versión, acceso, descriptores y diccionario de variables.
3. Descargar desde NASA OSDR; registrar archivo original y checksum, sin modificar raw.
4. Validar columnas, sujetos, fechas, unidades, n, faltantes y diseño experimental.
5. Crear notebook/script reproducible para normalizar columnas y agregados (sin inventar observaciones).
6. Definir una pregunta científica **modesta** que sí puede responderse con esos datos.
7. Mostrar provenance en la UI: `NASA dataset / sample cohort / retrospective / not personal assessment`.
8. Validar con alguien que entienda el dataset; si no, usar solo metadata, fuente y limitaciones.

## Plantilla para registrar afirmaciones nuevas

```md
### Evidence ID: [evidence-id]
- Statement shown in UI (English):
- Origin: NASA research | NASA OSDR | external peer-reviewed
- Primary URL / DOI:
- Access date / version:
- Exact scope/population/mission:
- Data elements or paragraphs supporting claim:
- What can be inferred:
- What cannot be inferred:
- Health expert review: Pending / Reviewed (by whom/when)
- Demo screen:
```

## Análisis de la demo principal de sueño

**Justificación de interés espacial:** NASA HRP identifica sueño insuficiente y horarios irregulares como riesgos; Standard Measures incluye información de actividad/sueño y cuestionarios.  
**Qué observa la app:** 3 valores sintéticos de duración y check-in, comparados con baseline sintética.  
**Inferencia permitida en el MVP:** “un patrón merece revisión”.  
**Inferencia NO permitida:** “el astronauta padece X”, “la NASA recomienda tratamiento Y en 345 min de sueño”, “este umbral predice eventos cardiovasculares”.

## Ruta de preguntas del jurado

- **«¿Dónde están los datos NASA?»** → panel con fuente, identificador y, si se integró efectivamente, visualización derivada reproducible.
- **«¿El reloj mide esto?»** → procedencia por métrica y documentación de permisos/disponibilidad.
- **«¿La NASA validó esta alerta?»** → no; es un prototipo de UX, reglas descriptivas y evidencia de riesgos, no un sistema médico validado.
- **«¿Qué funciona sin Tierra?»** → API local, pantallas, check-in, reglas curadas; JEV remoto es opcional.
