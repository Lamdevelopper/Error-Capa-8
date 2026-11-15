/** Lector del CSV ASTRA (ASTRA_Bioprocessed_Data.csv → public/data/astra.csv). */
export interface AstraRow { t: number; cortisol: number; hrv: number; osteo: number; afi: number }

let rows: AstraRow[] = synth()

/** Respaldo si el CSV no carga: misma lógica que astra_bioprocessor.py, sin ruido. */
function synth(): AstraRow[] {
  return Array.from({ length: 100 }, (_, t) => {
    const k = t / 99
    const cortisol = 5 + 13 * k
    const hrv = 55 - 40 * k
    const osteo = 22 - 10.5 * k
    const afi = Math.min(100, Math.max(0, Math.round((100 - (hrv / 60) * 100) * 0.6 + (cortisol / 20) * 100 * 0.4)))
    return { t, cortisol, hrv, osteo, afi }
  })
}

export async function loadAstra(url = 'data/astra.csv'): Promise<boolean> {
  try {
    const res = await fetch(url)
    if (!res.ok) return false
    const [header, ...lines] = (await res.text()).trim().split(/\r?\n/)
    const cols = header.split(',')
    const idx = (name: string) => cols.indexOf(name)
    const parsed = lines.map(l => {
      const c = l.split(',')
      return {
        t: +c[idx('Time_min')],
        cortisol: +c[idx('Cortisol_ng_mL')],
        hrv: +c[idx('HRV_ms')],
        osteo: +c[idx('Osteocalcin_ng_mL')],
        afi: +c[idx('AFI_Score_Pct')],
      }
    }).filter(r => Number.isFinite(r.cortisol))
    if (parsed.length > 10) { rows = parsed; return true }
  } catch { /* usar respaldo */ }
  return false
}

export const astraAt = (i: number): AstraRow => rows[Math.max(0, Math.min(rows.length - 1, i))]
export const astraLength = () => rows.length
