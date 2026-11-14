# AGENTS.md — contrato de trabajo para agentes de código

## Contexto no negociable

Proyecto **Error en Capa 8**. NASA Space Apps challenge: software de monitoreo de salud para astronautas. PC + Samsung Galaxy Watch. **El pitch es una demo funcional**. El jurado debe presenciar una historia completa de detección, evaluación, evidencia NASA, acción y continuidad offline.

**Orden de autoridad:** instrucciones del usuario > `AGENTS.md` > `PLAN.md` > documentación de `docs/`. Si hay contradicción, registrar la decisión; no reinventar alcance.

## Antes de empezar una tarea

1. Leer `README.md`, `PLAN.md`, `docs/PRODUCT.md`, `docs/SAFETY.md` y los documentos afectados.
2. Identificar la fase activa y el criterio de aceptación; no construir features fuera de fase.
3. Distinguir **hechos verificados**, **hipótesis**, **datos sintéticos** y **decisiones de producto**.
4. Proponer el cambio mínimo para entregar una parte demostrable end-to-end.
5. Si una dependencia externa está bloqueada (Samsung SDK/JEV/NASA data), usar un adaptador `mock` transparente y registrar el bloqueo. **No falsear integraciones.**

## Convenciones de arquitectura

- Stack base: React/Vite/TS + Tailwind/Recharts; FastAPI/SQLite; Kotlin/Compose Wear OS. **No crear infraestructura adicional por iniciativa propia.**
- Un único backend local coordina reglas, ingestion, persistencia y la API. No exponer API keys al frontend/reloj.
- Contratos definidos en `docs/SCHEMAS.md`; validar `metric`, `unit`, `captured_at`, `source_kind`, `quality`, `synthetic` en el backend.
- UI visible puede cambiar de forma radical; preservar siempre funciones y accesibilidad. Tokens editables en `docs/DESIGN-TEMPLATE.md`.
- Priorizar fixtures reproducibles (seed estable) y pruebas por comportamiento, no screenshots frágiles.
- Cada feature nueva debe describir estado `loading`, `empty`, `error`, `offline`, `denied permission` y `stale data` donde apliquen.

## Seguridad médica: prohibiciones

- **No diagnosticar, prescribir, cambiar medicación ni generar instrucciones de emergencia basadas en un modelo.**
- **No inventar umbrales clínicos** o interpretaciones de un biomarcador NASA. Si no existe una regla revisada, estado `needs_review` o `insufficient_data`.
- **No convertir la probabilidad JEV en probabilidad de enfermedad ni en un score clínico.**
- Nunca hacer que JEV (o una LLM) pase por encima de reglas de seguridad, consentimiento o escalamiento.
- No exponer datos de salud a JEV/servicios cloud sin aprobación explícita y política de privacidad; usar fixtures ficticias para la demo.
- Toda acción sensible requiere humano o protocolo aprobado. Véase `docs/SAFETY.md`.

## NASA / integridad de evidencia

Cada claim en la app debe poder rastrearse a: `source_title`, `url`, `accessed_on`, `scope`, `supports_claim`, `limitations`; ver `docs/NASA-EVIDENCE.md`.

- Diferenciar **NASA research** (contexto y riesgos), **NASA dataset** (observaciones científicas publicadas), **device data** (mediciones del prototipo) y **synthetic demo** (inventado para probar flujo).
- No llamar *NASA-powered health diagnosis* a un gráfico local con texto de NASA.
- No fabricar valores, gráficas, porcentajes o cohortes a partir de un estudio sin descargar y verificar sus archivos.
- Si se importa un dataset, registrar identificador, licencia, versión/fecha, columnas y pasos de transformación.

## Jev: regla operacional

JEV solo es un **adaptador opcional** para clasificación/ruteo de UX no crítico. Cada pregunta tiene opciones cerradas y `fallback` local. Sin conexión, error HTTP, salida inválida o respuesta incierta: ruta segura por defecto. No se envían datos identificables de salud a servicios externos. Documentar decisiones y casos de prueba en `docs/JEV-DECISIONS.md`.

## Forma de trabajar

- Cambios pequeños, construibles y explicables. Evitar refactors masivos sin justificación.
- Añadir tests de reglas y schema cada vez que se modifica una decisión.
- Después de cada tarea: ejecutar pruebas disponibles y documentar las no ejecutadas; actualizar `PLAN.md` y `docs/DECISIONS.md` si cambió alcance o stack.
- No marcar como completado sin criterio de aceptación demostrado.
- Proporcionar en el PR: resumen, pantallas/flujos afectados, datos reales o sintéticos, pruebas realizadas, riesgos y captura de demo si aplica.

## Prioridades si hay presión de tiempo

1. Demo reproducible offline con datos sintéticos honestos.
2. Experiencia completa watch → PC → evidence → action.
3. Fuentes NASA vinculadas y auditables.
4. Sensor real Samsung (si existe el dispositivo y los permisos).
5. JEV diferenciador no crítico y su degradación elegante.
6. Pulido visual y extensión de casos de uso.

## Checklist para cerrar una tarea

- [ ] Completa un criterio de aceptación explícito.
- [ ] No rompe el recorrido de demo con red y sin red.
- [ ] Los datos sintéticos están rotulados.
- [ ] La fuente científica está enlazada cuando hay claim de salud espacial.
- [ ] Tiene estado de error, permisos, desconexión y dato antiguo según aplique.
- [ ] Los tests relevantes pasan o se anotan limitaciones.
- [ ] No se han subido secretos ni datos personales.
