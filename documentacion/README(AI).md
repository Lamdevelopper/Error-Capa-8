# ERROR EN CAPA 8

**NASA Space Apps — Create Health Monitoring Software for Astronauts on Space Missions**  
**Estado:** kit de inicialización documental (no es un prototipo operativo).  
**Última revisión:** 2026-11-14 · **Idioma de trabajo:** español; interfaz y pitch en inglés.

## North Star

> **From health monitoring to health autonomy.**  
> Detectar cambios relevantes respecto a una línea base personal, explicarlos con evidencia de salud espacial y conducir al astronauta hacia una siguiente acción segura y verificable.

**El pitch es la demo.** El producto debe poder mostrar en una sola historia: `watch → observación → PC → evaluación guiada → evidencia NASA → siguiente paso → registro offline`.

### Problema / usuario

Las misiones prolongadas exponen a las tripulaciones a los cinco peligros estudiados por NASA: radiación, aislamiento/confinamiento, distancia de la Tierra, campos gravitacionales y ambientes hostiles/cerrados. Una tripulación necesita identificar, contextualizar y documentar cambios en su salud, incluso con conectividad limitada. La app está orientada a **autoevaluación informada y apoyo operacional**, no a emitir diagnósticos médicos autónomos.

### MVP: una historia impecable

- **Demo principal:** cambio de patrón de sueño/fatiga, con datos sintéticos claramente rotulados y una línea base individual.
- **Reloj:** mostrar estado, check-in breve, lectura de HR si el hardware/permiso lo permite; simulador siempre disponible.
- **PC:** overview, tendencia, evaluación, evidencia de NASA, siguiente paso no clínico y registro.
- **Motor:** reglas deterministas validadas primero; JEV como *opt-in* para decisiones de UX de bajo riesgo, nunca autoridad médica.
- **Offline-first:** si no hay red, las funciones críticas del prototipo siguen usando reglas y datos locales.
- **NASA Data:** evidencias y fuentes vinculadas a cada escenario; una integración de dataset NASA verificable es un hito, no una afirmación cumplida.

### Fuera del alcance inicial

Diagnóstico automatizado, prescripción farmacológica, triaje de emergencia autónomo, cálculo clínico universal, tratamiento sin revisión médica, monitorización en producción astronauta real, avatar 3D, gamificación elaborada, hardware propio y telemetría espacial real sin fuente.

## Stack propuesto, no cerrado

| Capa | Elección | Por qué |
|---|---|---|
| PC/web en laptop | **React + Vite + TypeScript** | Rápido de iterar y demostrar; sin empaquetado Electron inicial |
| Estilos | **Tailwind CSS** + tokens CSS | Un lenguaje visual editable, pocos estilos ad hoc |
| Charts | **Recharts** | Tendencias sin desarrollar un motor gráfico |
| API/local | **Python FastAPI** | API de datos, reglas y mocks en un solo proceso |
| Persistencia | **SQLite** | Cero infraestructura; suficiente para una demo local |
| Reloj | **Kotlin + Jetpack Compose for Wear OS** | App nativa Samsung Galaxy Watch compatible con Wear OS |
| Transporte | **HTTP/JSON en LAN** | Contrato simple reloj ↔ PC; cola local/reintentos en fases posteriores |
| JEV | **Adaptador opcional en FastAPI** | Tipado de decisiones no clínicas; nunca desde el browser |
| Test | **pytest + Vitest** | Pruebas mínimas de reglas, contratos y componentes |

**No introducir** microservicios, Kubernetes, cuenta cloud, auth multiusuario, event bus, embeddings/RAG, Electron ni nueva base de datos sin una necesidad demostrada. Si la comunicación directa reloj-PC falla, evaluar un puente Android; ver [`docs/WATCH-AND-DATA-ACCESS.md`](docs/WATCH-AND-DATA-ACCESS.md).

## Estructura propuesta del código (NO incluida en este ZIP)

```text
error-en-capa-8/
├── README.md, AGENTS.md, PLAN.md
├── docs/                             # esta documentación
├── apps/
│   ├── pc/                           # React/Vite
│   └── watch/                        # Android Studio / Wear OS
├── services/
│   └── api/                          # FastAPI + SQLite + reglas
├── fixtures/
│   └── synthetic/                    # datos ficticios etiquetados
└── tests/
```

## Orden de lectura / fuente de verdad

1. [`AGENTS.md`](AGENTS.md): instrucciones para agentes y contribuidores.
2. [`PLAN.md`](PLAN.md): milestones, prioridades y definición de terminado.
3. [`docs/PRODUCT.md`](docs/PRODUCT.md): alcance y criterios de éxito.
4. [`docs/MEASUREMENT-MATRIX.md`](docs/MEASUREMENT-MATRIX.md): mediciones y procedencia; **pendiente de incorporar la matriz real del equipo**.
5. [`docs/UX-FLOWS.md`](docs/UX-FLOWS.md) + [`docs/DESIGN-TEMPLATE.md`](docs/DESIGN-TEMPLATE.md): UX y plantilla UI a personalizar.
6. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) + [`docs/SCHEMAS.md`](docs/SCHEMAS.md): contratos técnicos.
7. [`docs/NASA-EVIDENCE.md`](docs/NASA-EVIDENCE.md), [`docs/JEV-DECISIONS.md`](docs/JEV-DECISIONS.md), [`docs/SAFETY.md`](docs/SAFETY.md): ciencia, decisiones y límites.
8. [`docs/DEMO-PITCH.md`](docs/DEMO-PITCH.md), [`docs/TEST-PLAN.md`](docs/TEST-PLAN.md), [`docs/WATCH-AND-DATA-ACCESS.md`](docs/WATCH-AND-DATA-ACCESS.md), [`docs/DECISIONS.md`](docs/DECISIONS.md), [`docs/REFERENCES.md`](docs/REFERENCES.md).

## Inicio sugerido para el equipo

1. Importar este ZIP al repositorio vacío. Leer AGENTS/PLAN antes de pedir código al agente.
2. Pegar la **matriz real** del equipo en `docs/MEASUREMENT-MATRIX.md` y resolver prioridades con evidencia.
3. Acordar un caso de demo: sueño/fatiga propuesto; cualquier cambio se registra en `docs/DECISIONS.md`.
4. Construir **vertical slice simulator-first**: una alerta ficticia recorre todas las pantallas, API, reglas y registro.
5. Incorporar **una** medición real del reloj y **una** pieza de evidencia/dataset NASA verificable antes de expandir.

## Regla de comunicación

Nunca afirmar que NASA validó nuestro algoritmo, que datos sintéticos son de astronautas, que un Galaxy Watch es dispositivo médico espacial o que JEV ha sido validado para diagnóstico. Las etiquetas `NASA source`, `demo synthetic`, `user entered` y `device measured` deben ser visibles cuando importen.
