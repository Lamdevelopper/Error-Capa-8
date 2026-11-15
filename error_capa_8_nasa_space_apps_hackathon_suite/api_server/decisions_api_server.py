from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
import json
from pathlib import Path

app = FastAPI(
    title="Error-Capa-8: NASA Astronaut System 1 JEV Decisions API",
    version="3.0.0-SPACE-APPS",
    description="Motor de inferencia heurística O(1) con líneas base personalizadas (Tierra 1g vs Órbita ug) y proyecciones Optimista/Pesimista."
)

DATA_FILE = Path(__file__).parent.parent / "decisions_api_payloads_dual_420.json"
if not DATA_FILE.exists():
    DATA_FILE = Path("decisions_api_payloads_dual_420.json")

with open(DATA_FILE, "r", encoding="utf-8") as f:
    DATASET = json.load(f)


class TelemetryInput(BaseModel):
    astronaut_id: str = Field(..., example="AST-04")
    period_code: str = Field(..., example="P4_CORE_OPS_EVA")
    rad_mSv_4h: float = Field(..., example=0.485)
    melatonin_pg_mL: float = Field(..., example=6.5)
    cortisol_ug_dL: float = Field(..., example=30.8)
    hrv_rmssd_ms: int = Field(..., example=17)
    egg_cpm: float = Field(..., example=5.42)
    sweat_mL_4h: int = Field(..., example=210)
    sweat_na_mmol_L: int = Field(..., example=68)
    skin_temp_C: float = Field(..., example=35.85)
    bp_sys_mmHg: int = Field(..., example=138)
    bp_dia_mmHg: int = Field(..., example=88)
    spo2_pct: float = Field(..., example=94.1)
    osteocalcin_ng_mL: float = Field(21.2, example=21.2)
    ntx_nmol_bce: float = Field(62.5, example=62.5)


@app.get("/api/v1/baselines")
def get_all_baselines():
    """Retorna los niveles basales en Tierra (1g) y en Órbita (ug) de los 5 astronautas."""
    return DATASET["astronaut_baselines"]


@app.get("/api/v1/baselines/{astronaut_id}")
def get_astronaut_baseline(astronaut_id: str):
    baselines = DATASET["astronaut_baselines"]
    if astronaut_id not in baselines:
        raise HTTPException(status_code=404, detail="Astronaut ID not found")
    return baselines[astronaut_id]


@app.get("/api/v1/telemetry/{astronaut_id}")
def get_astronaut_telemetry(
    astronaut_id: str,
    scenario: str = Query("OPTIMISTIC_MITIGATED", enum=["OPTIMISTIC_MITIGATED", "PESSIMISTIC_UNMITIGATED"]),
    day: int | None = Query(None, ge=1, le=7)
):
    """Filtra la telemetría de 7 días por astronauta, escenario (Optimista vs Pesimista) y día opcional."""
    records = [
        r for r in DATASET["records"]
        if r["astronaut_id"] == astronaut_id and r["scenario_mode"] == scenario
        and (day is None or r["day"] == day)
    ]
    if not records:
        raise HTTPException(status_code=404, detail="No records found")
    return {"count": len(records), "records": records}
