# Matriz de medición y evaluación (EDITABLE)

> **PENDIENTE:** el equipo aún no ha compartido su matriz original. Las filas siguientes son **hipótesis de planificación**, NO la matriz final, NI valores/umbrales validados. Al recibir la matriz real, integrar sin borrar procedencia y supuestos.

## Campos que debe tener cada fila

- `metric_id`, nombre y unidad exacta; definición (ej. HR instantánea ≠ HR en reposo).
- Fuente: `wearable | health_connect | manual | external_device | nasa_dataset | synthetic`.
- Compatibilidad/modelo/permiso, método de captura, frecuencia y rango esperado *si validado*.
- Calidad/confundidores: movimiento, ajuste del sensor, artefactos, periodos sin datos, cambio de reloj.
- Baseline individual: condición de cálculo, mínimo de observaciones, periodo, fecha y tipo.
- Riesgo NASA relacionado, con URL, y lo que NO se puede inferir.
- Detección/alerta (regla concreta y **revisión clínica pendiente**).
- Siguiente paso seguro, UX donde se ve, prioridad y estado de implementación.

## Inventario inicial (ninguna regla clínica está aprobada)

| ID | Indicador | Unidad | Captura candidata | Para qué en UX | NASA hazard / riesgo | Estado |
|---|---|---|---|---|---|---|
| M01 | Frecuencia cardiaca puntual | bpm | Wear OS Health Services, permiso | Tendencia y contexto | Cambios fisiológicos / gravedad | Propuesta; comprobar hardware |
| M02 | Duración del sueño | min por noche | Manual o teléfono Samsung Health/Health Connect | Escenario principal | Aislamiento, horario irregular | Propuesta; integración pendiente |
| M03 | Calidad subjetiva sueño | escala ordinal definida | Check-in | Contrastar sensación y duración | Sueño / desempeño | Propuesta |
| M04 | Nivel percibido de fatiga | opciones ordinales | Check-in | Contextualizar patrón | Sueño / carga de trabajo | Propuesta |
| M05 | Estado de ánimo | opciones y privacidad | Check-in opcional | Bienestar conductual | Aislamiento | Propuesta, evitar inferencia clínica |
| M06 | SpO₂ puntual | % | Galaxy Watch compatible / equipo | Futuro, si sensor disponible | Entorno / fisiología | Validar sensor y contexto |
| M07 | Temperatura cutánea | °C | Galaxy Watch compatible | Futuro, tendencia no fiebre | Entorno cerrado | No equivale a temperatura corporal central |
| M08 | Presión arterial | mmHg | Dispositivo externo / manual | Evaluación futura | Cardiovascular | Requiere protocolo/equipo |
| M09 | Glucosa | mg/dL o mmol/L (convertir explícitamente) | Glucómetro externo / manual | Futuro | Nutrición/metabolismo | No asumir sensor del reloj |
| M10 | Radiación acumulada | unidad según dosímetro | Equipo espacial especializado | Futuro | Radiación | El reloj no mide radiación ionizante |

### Distinguir 'en tiempo real' y 'retrospectivo'

- `heart_rate_now`: lectura reciente con timestamp exacto; no extrapolar como HR en reposo.
- `sleep_duration`: dato calculado tras una sesión, posiblemente sincronizado con retraso desde el teléfono; no es streaming en vivo.
- `mood/fatigue`: respuestas del usuario; no medición objetiva.
- `nasa_dataset`: archivo de investigación pública; **no un sensor de astronauta en misión actual**.
- `synthetic`: generado para probar UI/reglas, rotulado como tal.

## Ejemplo de fila completamente especificada (no clínica)

| Campo | Valor |
|---|---|
| metric_id | `sleep_duration_min` |
| Definición | total de minutos dormidos por periodo según fuente |
| Unidad | min |
| Fuente MVP | synthetic fixture / entrada manual |
| Baseline demo | promedio ilustrativo de 7 h 30 min, sintético |
| Observación demo | tres noches ficticias de aprox. 5 h 45 min |
| Trigger | fixture manual `trend_review`, **no umbral médico validado** |
| Texto UX | `Sleep trend changed. Review your recent rest.` |
| Evidencia | NASA HRP: riesgo de sueño insuficiente y horarios irregulares |
| Acción autorizada | realizar check-in de descanso, documentar, revisar rutina; informar crew medical officer según protocolo de misión |
| Limitación | no identificar trastorno del sueño ni causa específica |

## Cuando recibamos la matriz del equipo

1. Copiar filas **sin perder columnas originales** a una sección `Team matrix v1`.
2. Mapear a IDs, unidades y disponibilidad de sensores.
3. Clasificar cada fila como `MVP live / MVP manual / demo synthetic / later / unsupported`.
4. Verificar cualquier threshold contra fuente específica y revisión apropiada; si no, dejar `TBD, do not use for alert`.
5. Elegir 2–4 señales que realmente aporten al escenario central.
6. Conectar todas las cards reales de UI a este inventario y su tipo de procedencia.

## Gaps conocidos

- No existe aún baseline clínica validada para un individuo en vuelo; usar `personal baseline` solo como comparación descriptiva ilustrativa.
- Sensores de smartwatch comercial pueden degradar su rendimiento por actividad, posición, movimiento o integración.
- Asociación con peligro espacial ≠ capacidad para diagnosticarlo.
- Acceso/permiso Samsung, canal de sync y disponibilidad del teléfono son riesgos del plan.
