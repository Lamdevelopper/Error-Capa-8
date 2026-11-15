import pandas as pd
import numpy as np

# ASTRA Bioprocessor: Preprocessed Telemetry & Early Warning System
# Calibrated with NASA OSDR (OSD-571 Plasma & OSD-575 Serum baselines)

np.random.seed(42)
time_minutes = np.arange(100)

# 1. Cortisol en sudor (ng/mL): Sube de 5.0 (normal) a 18.0 (estrés agudo)
cortisol = np.round(np.clip(np.linspace(5.0, 18.0, 100) + np.random.normal(0, 1.0, 100), 1.0, None), 2)

# 2. HRV (ms): Cae de 55.0 (estable) a 15.0 (fatiga autonómica)
hrv = np.round(np.clip(np.linspace(55.0, 15.0, 100) + np.random.normal(0, 3.0, 100), 5.0, None), 2)

# 3. Osteocalcina (ng/mL): Marcador óseo, baja en microgravedad (de 22.0 a 11.5)
osteocalcin = np.round(np.clip(np.linspace(22.0, 11.5, 100) + np.random.normal(0, 0.4, 100), 5.0, None), 2)

# Índice de Fatiga Autonómica (AFI %): 0 a 100%
afi = np.clip(np.round((100 - (hrv / 60 * 100)) * 0.6 + (cortisol / 20 * 100) * 0.4), 0, 100)

# Sistema de Aviso Previo (WARNING_FATIGUE) y Alerta Crítica (CRITICAL_ALERT)
conditions = [
    (afi >= 80) | (osteocalcin < 13.0),
    (afi >= 60) & (afi < 80)
]
choices = ['CRITICAL_ALERT', 'WARNING_FATIGUE']
status = np.select(conditions, choices, default='NOMINAL_GREEN')

df = pd.DataFrame({
    'Time_min': time_minutes,
    'Cortisol_ng_mL': cortisol,
    'HRV_ms': hrv,
    'Osteocalcin_ng_mL': osteocalcin,
    'AFI_Score_Pct': afi,
    'Watch_Alert_Status': status
})

df.to_csv("ASTRA_3Biomarkers_Telemetry.csv", index=False)
print("ASTRA Preprocessed Telemetry generated successfully.")
