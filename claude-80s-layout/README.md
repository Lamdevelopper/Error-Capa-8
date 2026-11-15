# claude-80s-layout

Versión de la tableta del escuadrón que sigue el **layout de `Iluikali.pptx`** y la historia del **pitch** (`Spaceapps_ .md`), con la estética 80's de `iluikali-80s` en clave sobria. Es apoyo preventivo y no sustituye a un médico.

```bash
npm install
npm run dev        # http://localhost:5192/
npm run build
```

## Recorrido (las láminas de la presentación)

1. **Escuadrón** `#/`: 2×2 con los 4 integrantes (AST-01..04, configurable en `CREW_KEYS`, `src/core/logic/crew.ts`). Cada tarjeta lleva:
   - avatar redondo con su figura, nombre y rol;
   - la **racha**;
   - el nivel con una sola línea de qué pasa;
   - la fila **Sueño / Salud / Mente** en el borde exterior (dos toques hasta cualquier dato).
2. **Sección** `#/a/circle/sleep`: rail vertical con ← volver y las tres secciones; la activa se resalta y las otras se atenúan. 6 widgets por sección:
   - **Sueño**: horas de sueño, calidad REM*, ritmo circadiano (tira de 24 h), temperatura cutánea, oxigenación nocturna* y **próximo descanso** (acción).
   - **Salud**: osteocalcina vs NTx, SpO₂, frecuencia cardiaca y respiración (*sin sensor conectado · tiempo real*), presión arterial y radiación ambiental.
   - **Mente**: HRV, cortisol, índice de fatiga AFI*, carga cognitiva*, hidratación* y **acción de calendario** (acción con botón «Hecho»).

   \* estimado a partir de otros biomarcadores (`src/core/logic/tiles.ts`).
3. **Detalle** `#/a/circle/mental/cortisol`:
   - la métrica con una gráfica limpia (Hoy/Semana);
   - **Qué es** y **Soluciones**;
   - **SOS**, que hay que mantener 1,5 s y confirmar, y **Marcar revisión**.

## Niveles: escala de intensidad (no semáforo)

Usa un solo tono cálido cuya intensidad sube con la gravedad (rampa validada como ordinal con el validador de `dataviz`):

| Nivel | Tono | Señal |
|---|---|---|
| Estable | tinta tenue | sin palabra grande |
| Observar | `#6f6450` | anillo hueco |
| Atención | `#a8843f` | punto lleno |
| Prioritario | `#e0a83a` | borde más grueso |
| Crítico | `#e5574d` coral | única excepción de tono (P4 del motor JEV); el SOS usa el mismo coral |

Con los 4 integrantes actuales, el coral no aparece en pantalla y los tonos ámbar ocupan menos del 3 %, según la medición sobre las capturas.

## Racha

Se calcula **solo con los datos** (`src/core/logic/streak.ts`): días consecutivos, hacia atrás desde hoy, en que ninguna métrica de Sueño ni de Mente estuvo en alerta frente a su base personal (mediana del día). Se muestra también el récord de la semana y la **racha del escuadrón** (días en que los 4 cumplieron).

## Heurísticas de Nielsen

1. Visibilidad: nivel, racha y última lectura siempre a la vista.
2. Mundo real: lenguaje humano e iconos luna, cruz y cerebro.
3. Control: ← volver fijo; Esc o H llevan al inicio; «Hecho» y revisión se pueden deshacer.
4. Consistencia: misma anatomía en los 18 widgets.
5. Prevención: SOS por mantener + confirmar.
6. Reconocimiento: sección activa resaltada y avatar en cada pantalla.
7. Flexibilidad: dos toques a cualquier dato; rutas directas; tecla M para cambiar de escenario.
8. Minimalismo: widgets sin gráficas (salvo el ritmo circadiano) y una línea por tarjeta.
9. Recuperación: errores de archivo con causa y solución.
10. Ayuda: «Qué es» y «Soluciones» en cada detalle.

## Datos

Usa los mismos datos y las mismas formas de carga que `iluikali-80s`: manifest, `?data=`, `?api=` o arrastrar un CSV/JSON. La tecla **M** alterna entre la rama con mitigación y la rama sin mitigar.

La entrada `individual.html` se conserva de la versión anterior y no está rediseñada con este layout.
