# NASA Space Apps Hackathon Kit — Proyecto `Error-Capa-8` (System 1 JEV Decisions API)

## 1. El Problema ("Error Capa 8" en Medicina Espacial)
En misiones orbitales (ISS) y de espacio profundo (Artemis / Marte), el retraso de comunicación y la sobrecarga cognitiva hacen peligroso depender exclusivamente de análisis manuales en Tierra (*System 2*). Además, evaluar a un astronauta con **promedios poblacionales estáticos** falla en el espacio por dos razones documentadas por la NASA:
1. **Cada astronauta tiene su propia línea base (*Intra-Individual Baseline*):** Una variabilidad cardíaca (HRV RMSSD) de `48 ms` es normal para un especialista de 45 años en vigilia, pero representa una caída autonómica del `-27%` para un piloto atleta de 31 años.
2. **La hora circadiana cambia el significado clínico:** Un cortisol de `19 µg/dL` a las `08:00 UTC` (`P3_AWAKENING_CAR`) es una respuesta fisiológica normal de despertar (*Cortisol Awakening Response*), mientras que `19 µg/dL` a las `00:00 UTC` (`P1_SLEEP_ONSET`) con melatonina `<20 pg/mL` diagnostica disrupción circadiana aguda.

## 2. Nuestra Solución: Motor System 1 JEV + Decisions API en 4 Etapas
Construimos un estimador heurístico rápido $O(1)$ (**Joint Energy-Vitality Estimator - JEV**) que cruza la medición actual contra la **Línea Base Orbital Personalizada ($\mu g$)** y la **Línea Base Pre-Vuelo en Tierra ($1g$)** de cada tripulante en 6 ventanas circadianas de 4 horas:
* **`0_personal_baseline_reference`**: Niveles basales propios del astronauta para esa ventana horaria.
* **`1_measurement`**: 12 biomarcadores simultáneos (Radiación, Melatonina, Cortisol, HRV RMSSD, EGG gástrico, Sudor, $	ext{Na}^+$ en sudor, Temperatura cutánea, PA Sistólica/Diastólica/MAP, $SpO_2$, Osteocalcina y NTx).
* **`2_interpretation`**: Sub-índices **Energético ($E_{JEV}$)**, **Físico ($P_{JEV}$)** y **Metabólico ($M_{JEV}$)**, índice global **$	ext{JEV}_{	ext{Global}}$** y **Deltas porcentuales ($\Delta\%$)** respecto a su propio basal.
* **`3_investigation`**: Mecanismo fisiológico primario, cociente de resorción ósea ($	ext{NTx}/	ext{Osteocalcina}$) y **Proyección Dual a 24h (Optimista vs. Pesimista)**.
* **`4_action`**: Prioridad (`P0_NONE` a `P4_CRITICAL`), código de decisión determinista (`decision_code`) y subsistema objetivo de la nave/traje (`api_action_target`).

## 3. Defensa ante Jueces: ¿Por qué Gemelos Digitales Parametrizados?
Si un juez pregunta: *"¿Son datos crudos de un astronauta real con nombre y apellido?"*, la respuesta técnica exacta es:
> *"Por la **Privacy Act of 1974** y normas de confidencialidad médica de la NASA, las series de tiempo multiparamétricas crudas identificables no son públicas. Nuestro cohorte de 5 astronautas consiste en **Gemelos Digitales Parametrizados** sobre los rangos estadísticos reales de **NASA OSDR (GeneLab / ALSDA)**, **NASA Twins Study**, **NASA DSO 484** (mesores/acrofases de cortisol y melatonina), **DLR/NASA Double Sensor** (Space Fever) y **CSA BioMonitor (Astroskin)**."*
