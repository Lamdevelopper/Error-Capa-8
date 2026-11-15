# PLAN.md — plan de trabajo ejecutable

## Frontend increment · 2026-11-14

The current user-approved crew-screen brief is implemented under `Website/`: four symbolic crew identities, three categories, metric trends, guided check-in, local synthetic journal and a simulated ground-link state. This delivers the frontend portion of F1/F4 only. Backend, watch, sensor and AI integration tasks below remain pending. See `Website/README.md` and `DECISIONS.md` for scope and verification.


**Objetivo:** crear una demo operativa de monitoreo y evaluación preventiva, científicamente trazable, con interfaz PC y reloj Samsung. **Demo-first.**  
**Estado inicial:** planificación. No asumir que hay aplicación, datasets descargados, reloj disponible ni acceso a APIs externas.  
**Regla:** cada fase termina con una demo verificable y una decisión go/no-go.

## Backlog por fases (en orden)

### F0 · Alinear producto, matriz, datos — P0

- [ ] Incorporar la matriz real del equipo (aún no proporcionada) en `docs/MEASUREMENT-MATRIX.md`.
- [ ] Confirmar reloj Samsung exacto, versión Wear OS, PC de demo, conectividad y disponibilidad de Android auxiliar.
- [ ] Elegir UNA historia principal (propuesta: privación de sueño/fatiga + cambios en FC). Anotar mediciones sintéticas explícitas.
- [ ] Mapear cada medición a fuente, unidad, frecuencia, origen, calidad y evidencia NASA.
- [ ] Definir tono e identidad con `docs/DESIGN-TEMPLATE.md` (sin bloquear el UX).
- [ ] Seleccionar un dataset real NASA (si se usará en demo) y verificar archivos, licencia, variables y aptitud; **OSD-575 es candidato biomédico, no datos de sueño en tiempo real**.

**Salida / DoD:** matriz v1, historia v1 con 6 pasos, wireframe de 4 pantallas, fuentes verificadas, especificación de fixtures.

### F1 · Vertical slice PC simulada — P0

- [ ] Inicializar React/Vite/TS; Tailwind; rutas simples sin dependencia extra si no es necesaria.
- [ ] Inicializar FastAPI/SQLite; modelos de `docs/SCHEMAS.md`; endpoint `/health`.
- [ ] Cargar un fixture sintético reproducible con baseline + tres noches de sueño + evento.
- [ ] Overview muestra un cambio de tendencia con atribución de origen **Synthetic demo**.
- [ ] Pantalla de assessment pregunta datos de bienestar, explica evidencia, ofrece siguiente paso predefinido y guarda evento.
- [ ] Desconectar Internet: el flujo sigue con backend local. Si el API local falla, UI muestra fallo y no inventa estado.

**Salida / DoD:** demo reproducible de inicio a fin PC; registro consultable; no diagnósticos; prueba automatizada del caso principal.

### F2 · Wearable y estados de sistema — P0/P1

- [ ] Crear app Wear OS con 3 pantallas: Status, Check-in, Notification/Action.
- [ ] Simulador Wear OS empuja un evento estructurado hacia la API PC en LAN (o se simula en backend si no hay red).
- [ ] Intentar sensor real de HR vía Wear OS Health Services con permiso; si falla, documentar motivo, no ocultarlo.
- [ ] Medir latencia funcional de sync y comportamiento offline; mostrar dato antiguo con `captured_at`.
- [ ] Evaluar (no imponer) puente Android/Health Connect para sueño; depende de permisos/sync y hardware.

**Salida / DoD:** al menos 1 acción de reloj desencadena cambio observable en PC; no se pierde la demo si el reloj falla (modo simulador).

### F3 · NASA evidence + JEV demostrable — P0/P1

- [ ] Poner un enlace NASA pertinente por cada riesgo/afirmación visible.
- [ ] Incorporar un registro de evidencia en pantalla: claim, documento, lo que sí/no justifica.
- [ ] Demostrar uso **real** de datos NASA únicamente si se descargaron, limpiaron y validaron; si no, limitar el claim a literatura NASA.
- [ ] Añadir adaptador JEV *feature-flagged*, solo decisiones no médicas (clasificación de intención de check-in o selección de cuestionario).
- [ ] Definir fixtures de evaluación y comparar decisiones esperadas vs JEV; probar sin Internet.

**Salida / DoD:** al tocar `Why this matters?` se ve fuente auténtica; JEV cambia algo visible y seguro; fallback local pasa pruebas.

### F4 · UX/pitch/reliability — P0

- [ ] Refactor visual con diseño propio, sin perder claridad ni tamaños táctiles.
- [ ] Ensayar demo cronometrada en el equipo final (principal y backup grabado si permitido).
- [ ] Probar pérdida de conexión, permisos negados, dato viejo, JEV lento y API desconectada.
- [ ] Congelar features 1 día antes del pitch; solo fixes con pruebas.
- [ ] Completar guion y evidencias del deck de 3 min en `docs/DEMO-PITCH.md`.

**Salida / DoD:** pitch de producto coherente, sin saltos a pantallas muertas; afirmaciones defendibles en Q&A.

## Priorización por impacto

| Ítem | Prioridad | Por qué | Dependencia |
|---|---|---|---|
| End-to-end sleep scenario | P0 | Es la demo/pitch | F0 |
| Fuente NASA visible y rastreable | P0 | Diferenciación de concurso | F0 |
| Etiquetas de provenance | P0 | Honestidad y credibilidad | F1 |
| UI PC utilizable | P0 | Narrativa central | F1 |
| Ruta offline sin nube | P0 | Contexto espacio profundo | F1 |
| Wearable: interacción real | P1 | Diferenciador físico | F2 |
| JEV: 1 flujo low-risk funcional | P1 | Demostración técnica | F3 |
| Import real NASA dataset | P1 | Plus científico; requiere validación | F0+F3 |
| Sync de sueño Samsung | P2 | Requiere Android y permisos | F2 |
| Hardware propio, avatar 3D, 5 enfermedades | P3 | Distrae de demo | posterior |

## Roles de equipo (llenar)

| Frente | Owner | Backup | Entregable | Estado |
|---|---|---|---|---|
| Product/pitch | TBD | TBD | Storyboard, deck, ensayo | TODO |
| UX/UI | TBD | TBD | Screens y design tokens | TODO |
| PC/frontend | TBD | TBD | Dashboard + assessment | TODO |
| Backend/reglas | TBD | TBD | API, persistencia, fallback | TODO |
| Watch | TBD | TBD | Wear OS + pruebas | TODO |
| NASA/research | TBD | TBD | Evidence records, dataset audit | TODO |
| QA | TBD | TBD | Test cases y demo backup | TODO |

## Métricas de éxito (medibles en el hackathon)

- Una demo de 3 min sin interrupciones en el hardware de presentación.
- 100% de mediciones mostradas con origen identificado y fecha.
- 100% de claims NASA visibles con referencia verificable y limitación documentada.
- 0 recomendaciones clínicas generadas libremente o umbrales inventados.
- Escenario principal pasa online y offline local; un fallback de JEV y un fallo de sensor probados.
- Jurado puede contestar al final: **¿qué cambió?, ¿por qué importa?, ¿qué hago?**

## Bloqueos abiertos

1. Matriz de mediciones real del equipo: **pendiente**.
2. Modelo exacto de Galaxy Watch / teléfono Android: **pendiente**.
3. JEV: verificar acceso, cuota, privacidad y endpoint en el entorno real.
4. Dataset NASA real incorporable al caso central: **pendiente de análisis**.
5. ¿Qué fuentes/aprobaciones médicas pueden sustentar las recomendaciones? **pendiente**.
