import type { AstroId, CategoryId, Ctx, IconName, MetricDef } from './types'

/** Figuras en el orden del dataset (AST-01 → ▲, AST-02 → ■ …). Máximo 6. */
export const SHAPES: AstroId[] = ['triangle', 'square', 'circle', 'star', 'diamond', 'hexagon']

export const CATEGORIES: { id: CategoryId; label: string; short: string; icon: IconName }[] = [
  { id: 'sleep', label: 'Sueño / energía', short: 'Sueño', icon: 'moon' },
  { id: 'general', label: 'Salud general', short: 'Salud', icon: 'pulse' },
  { id: 'mental', label: 'Estado mental', short: 'Mente', icon: 'brain' },
]

// ---------- Ayudas para leer columnas ----------
const sleeping = (c: Ctx) => c.r.phase === 'SLEEP'
/** primera columna disponible entre varias candidatas */
const pick = (o: Record<string, number | null>, ...keys: string[]) => {
  for (const k of keys) { const x = o[k]; if (x !== null && x !== undefined) return x }
  return null
}
const col = (k: string) => (c: Ctx) => pick(c.r.v, k)
const base = (...keys: string[]) => (c: Ctx) => pick(c.b.v, ...keys.map(k => `orbital_ug_${k}`))

/** Ventana del día en horas UTC según el horario de misión del dataset. */
export const SCHEDULE = { sleepStart: 0, sleepEnd: 8 }

/**
 * Catálogo. El estado se calcula con z = (x − esperado) / σ contra la línea base orbital
 * personal de cada tripulante y la ventana del día (el cortisol de las 08:00 no se juzga como
 * el de las 00:00). Los σ salen de la dispersión de la rama mitigada del dataset: verde
 * significa "dentro de lo normal para esta persona".
 */
export const METRICS: MetricDef[] = [
  // ----- Sueño / energía -----
  {
    id: 'sleep', label: 'Sueño', unit: 'h', icon: 'bed', chart: 'hypno', categories: ['sleep', 'mental'],
    decimals: 1, estimated: true,
    value: () => null, expected: () => 7.5, sigma: () => 0.6, bad: 'low',
    low: 'Durmió poco', high: 'Sueño largo',
    what: 'Horas dormidas anoche y sus fases. Se estima a partir de melatonina, HRV y temperatura durante la ventana de sueño.',
    why: 'Con 16 amaneceres al día, ruido y turnos cambiantes, el sueño se fragmenta. La deuda de sueño reduce la atención y aumenta los errores.',
    actions: {
      ok: ['Mantener el horario de sueño.'],
      warn: ['Adelantar 30 min la hora de dormir.', 'Luz tenue y sin pantallas 1 h antes.'],
      alert: ['Ventana de sueño protegida esta noche.', 'Reasignar tareas críticas del siguiente turno.', 'Avisar al cirujano de vuelo si se repite 3 noches.'],
    },
  },
  {
    id: 'circ', label: 'Ritmo circadiano', unit: 'h', icon: 'clock', chart: 'circadian', categories: ['sleep', 'mental'],
    decimals: 1, estimated: true,
    value: () => null, expected: () => 0, sigma: () => 0.8, bad: 'both',
    low: 'Reloj adelantado', high: 'Reloj atrasado',
    what: 'Cuánto se ha desplazado su reloj biológico respecto al horario de la misión. Se calcula con la hora de su pico de melatonina.',
    why: 'Más de 2 h de desfase equivale a vivir con jet lag: peor sueño, peor ánimo y más errores.',
    actions: {
      ok: ['Mantener horarios de luz y comidas.'],
      warn: ['Luz azul brillante al despertar.', 'Luz roja y tenue 2 h antes de dormir.'],
      alert: ['Plan de luz dinámica con la iluminación del módulo.', 'Melatonina 3 mg según protocolo.', 'Evitar cambios de turno esta semana.'],
    },
  },
  {
    id: 'hrv', label: 'Variabilidad cardiaca', unit: 'ms', icon: 'wave', chart: 'bars', categories: ['sleep', 'mental'],
    decimals: 0,
    value: col('hrv_rmssd_ms'),
    expected: c => pick(c.r.v, 'orbital_base_hrv_ms') ?? base(sleeping(c) ? 'hrv_rmssd_sleep_ms' : 'hrv_rmssd_awake_ms', 'hrv_rmssd_ms')(c),
    sigma: e => Math.max(3, e * 0.1), bad: 'low',
    low: 'HRV baja', high: 'HRV alta',
    what: 'Variación entre latidos (RMSSD). Indica cuánto se está recuperando el sistema nervioso.',
    why: 'Una HRV baja sostenida es de las primeras señales de fatiga y estrés, antes de que la persona lo note.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['5 min de respiración lenta (6 por minuto).', 'Bajar la intensidad del ejercicio de hoy.'],
      alert: ['Descanso activo: nada de ejercicio intenso hoy.', 'Charla de 10 min con un compañero.', 'Revisar junto con el cortisol.'],
    },
  },
  {
    id: 'melatonin', label: 'Melatonina', unit: 'pg/mL', icon: 'moon', chart: 'area', categories: ['sleep'],
    decimals: 0,
    value: col('melatonin_pg_mL'),
    expected: c => pick(c.r.v, 'orbital_base_melatonin_pg_mL') ?? base(sleeping(c) ? 'melatonin_nadir_pg_mL' : 'melatonin_day_pg_mL')(c),
    sigma: e => Math.max(4, e * 0.22), bad: 'both',
    low: 'Melatonina baja', high: 'Melatonina fuera de hora',
    what: 'La hormona que le dice al cuerpo que es de noche. Debe subir al dormir y casi desaparecer de día.',
    why: 'Si sube de día o no sube de noche, el reloj interno está desalineado y el sueño pierde calidad.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Evitar luz azul por la noche.', 'Luz brillante por la mañana.'],
      alert: ['Ajustar la iluminación del módulo a su horario.', 'Valorar melatonina 3 mg con el cirujano de vuelo.'],
    },
  },
  {
    id: 'temp', label: 'Temperatura', unit: '°C', icon: 'thermo', chart: 'area', categories: ['sleep'],
    decimals: 1,
    value: col('skin_temp_C'),
    expected: c => base(sleeping(c) ? 'skin_temp_sleep_C' : 'skin_temp_awake_C', 'skin_temp_C')(c),
    sigma: () => 0.4, bad: 'both',
    low: 'Temperatura baja', high: 'Temperatura alta',
    what: 'Temperatura de la piel. Su subida y bajada diaria también marca el reloj biológico.',
    why: 'En órbita el cuerpo se calienta más (Space Fever); la fiebre puede indicar una infección.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Hidratarse y repetir la medición en 1 h.', 'Bajar la temperatura de cabina.'],
      alert: ['Enfriamiento activo y pausa de 15 min.', 'Informar al cirujano de vuelo.'],
    },
  },
  {
    id: 'energy', label: 'Energía', unit: '/100', icon: 'bolt', chart: 'gauge', categories: ['sleep', 'mental'],
    decimals: 0, scale: [0, 100],
    value: c => c.r.jev.energy, expected: () => 95, sigma: () => 8, bad: 'low',
    low: 'Energía baja', high: 'Energía alta',
    what: 'Índice de energía del motor JEV (0–100): resume sueño, ritmo y recuperación.',
    why: 'Resume en un número el riesgo de agotamiento, fácil de leer desde lejos.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Revisar el reparto de tareas del día.', 'Priorizar el sueño esta noche.'],
      alert: ['Día de carga reducida.', 'Check-in con el cirujano de vuelo.', 'Evitar EVA y tareas críticas.'],
    },
  },
  // ----- Salud general -----
  {
    id: 'bp', label: 'Presión arterial', unit: 'mmHg', icon: 'drop', chart: 'dual', categories: ['general'],
    decimals: 0,
    value: col('bp_sys_mmHg'), value2: col('bp_dia_mmHg'),
    expected: base('bp_sys_mmHg'), sigma: e => e * 0.07, bad: 'both',
    low: 'Presión baja', high: 'Presión alta',
    what: 'Presión sistólica / diastólica, estimada sin brazalete a partir de ECG y PPG.',
    why: 'Los líquidos se desplazan hacia la cabeza y se pierde volumen de sangre; la presión cambia y es clave para el regreso a la Tierra.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Confirmar con brazalete manual.', 'Menos sodio en la próxima comida.'],
      alert: ['Confirmar con brazalete ahora.', 'Reposo y nueva medición en 15 min.', 'Informar al cirujano de vuelo.'],
    },
  },
  {
    id: 'spo2', label: 'Oxígeno en sangre', unit: '%', icon: 'o2', chart: 'gauge', categories: ['general'],
    decimals: 1, scale: [85, 100],
    value: col('spo2_pct'), expected: base('spo2_pct'), sigma: () => 1, bad: 'low',
    low: 'Oxígeno bajo', high: 'Oxígeno alto',
    what: 'Saturación de oxígeno (SpO₂).',
    why: 'CO₂ alto, fallos de soporte vital o la radiación pueden bajar la saturación.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Revisar el CO₂ del módulo.', 'Respirar profundo y repetir la medición.'],
      alert: ['Revisar el soporte vital del módulo.', 'Oxígeno suplementario según protocolo.', 'Contactar con tierra.'],
    },
  },
  {
    id: 'hydration', label: 'Hidratación', unit: 'mmol/L Na⁺', icon: 'drop', chart: 'area', categories: ['general'],
    decimals: 0,
    value: col('sweat_na_mmol_L'), expected: base('sweat_na_mmol_L'), sigma: e => e * 0.2, bad: 'high',
    low: 'Sodio bajo', high: 'Deshidratación',
    what: 'Sodio en el sudor. Cuando sube, el cuerpo está perdiendo más agua de la que recibe.',
    why: 'En microgravedad se pierde volumen de plasma; la deshidratación causa mareo y fatiga.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Beber 500 mL de agua en la próxima hora.', 'Bajar la temperatura de cabina.'],
      alert: ['Sales de rehidratación oral (600 mL).', 'Suspender el ejercicio de resistencia hoy.'],
    },
  },
  {
    id: 'bone', label: 'Hueso', unit: 'NTx/OC', icon: 'bone', chart: 'area', categories: ['general'],
    decimals: 2,
    value: c => pick(c.r.v, 'bone_resorption_ratio_ntx_osteo') ?? ratio(pick(c.r.v, 'ntx_nmol_bce'), pick(c.r.v, 'osteocalcin_ng_mL')),
    expected: c => ratio(base('ntx_nmol_bce')(c), base('osteocalcin_ng_mL')(c)),
    sigma: e => e * 0.12, bad: 'high',
    low: 'Formación ósea alta', high: 'Pérdida ósea',
    what: 'Cociente entre NTx (hueso que se destruye) y osteocalcina (hueso que se forma). Si sube, se pierde hueso.',
    why: 'En microgravedad se pierde entre el 1 y el 1,5 % de densidad ósea al mes en cadera y columna.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Priorizar el ejercicio de resistencia (ARED).', 'Revisar calcio y vitamina D.'],
      alert: ['Aumentar la carga de ARED según protocolo.', 'Revisión nutricional con tierra.'],
    },
  },
  {
    id: 'rad', label: 'Radiación', unit: 'mSv/día', icon: 'rad', chart: 'bars', categories: ['general'],
    decimals: 2,
    value: c => times(pick(c.r.v, 'rad_mSv_4h'), 6), expected: c => times(base('rad_mSv_4h')(c), 6),
    sigma: e => e * 0.35, bad: 'high',
    low: 'Radiación baja', high: 'Radiación alta',
    what: 'Dosis de radiación recibida, expresada al ritmo de un día completo.',
    why: 'Las tormentas solares y los rayos cósmicos aumentan el riesgo de cáncer y de daño al sistema nervioso.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Pasar más tiempo en el módulo de servicio blindado.'],
      alert: ['Ir al refugio blindado ahora.', 'Suspender EVA.', 'Biodosimetría al terminar el evento.'],
    },
  },
  {
    id: 'egg', label: 'Ritmo gástrico', unit: 'cpm', icon: 'stomach', chart: 'area', categories: ['general'],
    decimals: 1,
    value: col('egg_cpm'), expected: base('egg_cpm'), sigma: e => e * 0.1, bad: 'both',
    low: 'Estómago lento', high: 'Estómago acelerado',
    what: 'Ondas eléctricas del estómago por minuto (electrogastrografía). Lo normal es unas 3.',
    why: 'Un estómago acelerado anticipa náusea por radiación o por mareo espacial.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Comidas pequeñas y frecuentes.'],
      alert: ['Antiemético según el kit médico.', 'Revisar la dosis de radiación de hoy.'],
    },
  },
  // ----- Estado mental -----
  {
    id: 'cortisol', label: 'Cortisol', unit: 'µg/dL', icon: 'flask', chart: 'area', categories: ['mental'],
    decimals: 1,
    value: col('cortisol_ug_dL'),
    expected: c => pick(c.r.v, 'orbital_base_cortisol_ug_dL')
      ?? base(c.r.period === 'P3_AWAKENING_CAR' ? 'cortisol_car_ug_dL' : 'cortisol_evening_ug_dL')(c),
    sigma: e => Math.max(1.2, e * 0.15), bad: 'high',
    low: 'Cortisol bajo', high: 'Estrés alto',
    what: 'La hormona del estrés, medida en sudor. Es normal que suba al despertar; fuera de esa hora indica estrés.',
    why: 'El aislamiento, el encierro y la carga de trabajo la elevan, y eso además debilita el sistema inmune.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Pausa de 15 min sin tareas.', 'Llamada privada con la familia si se puede.'],
      alert: ['Reducir la carga del turno.', 'Hablar con el psicólogo de soporte en tierra.', 'Cuidar el sueño de esta noche.'],
    },
  },
]

function ratio(a: number | null, b: number | null) { return a !== null && b ? a / b : null }
function times(a: number | null, k: number) { return a === null ? null : a * k }

export const METRIC_BY_ID: Record<string, MetricDef> = Object.fromEntries(METRICS.map(m => [m.id, m]))
