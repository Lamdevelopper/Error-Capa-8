import type { Astronaut, CategoryId, IconName, MetricDef } from './types'

export const CREW: Astronaut[] = [
  { id: 'triangle', name: 'Tlaloc', role: 'Comandante' },
  { id: 'square', name: 'Itzel', role: 'Ingeniería' },
  { id: 'circle', name: 'Yaretzi', role: 'Ciencia' },
  { id: 'star', name: 'Citlali', role: 'Médico de a bordo' },
]

export const CATEGORIES: { id: CategoryId; label: string; short: string; icon: IconName }[] = [
  { id: 'sleep', label: 'Sueño / energía', short: 'Sueño', icon: 'moon' },
  { id: 'general', label: 'Salud general', short: 'Salud', icon: 'plus' },
  { id: 'mental', label: 'Estado mental', short: 'Mente', icon: 'brain' },
]

/** 1 tick de la simulación = 10 min de misión */
export const TICK_MINUTES = 10

/**
 * Catálogo basado en tipos-de-valores-a-medir.csv.
 * Rangos orientativos para la demo — afinarlos con el equipo / literatura.
 */
export const METRICS: MetricDef[] = [
  {
    id: 'sleep', label: 'Horas de sueño', unit: 'h', icon: 'bed', chart: 'hypno',
    categories: ['sleep', 'mental'], sensor: 'Acelerómetro 3 ejes + ECG (actigrafía)',
    decimals: 1, ok: [6.5, 9.5], warn: [5.5, 10.5], base: 7.4, noise: 0.25,
    what: 'Horas de sueño estimadas de la última noche y su arquitectura (despierto, ligero, profundo, REM).',
    why: 'Ciclos de luz de 90 min en órbita, ruido y carga de trabajo fragmentan el sueño. La deuda de sueño reduce atención y aumenta errores.',
    actions: {
      ok: ['Mantener horario regular de sueño.'],
      warn: ['Adelantar 30 min la hora de dormir.', 'Evitar pantallas y luz azul 1 h antes.', 'Revisar ruido y temperatura del saco.'],
      alert: ['Programar bloque de recuperación de sueño hoy.', 'Reasignar tareas críticas del siguiente turno.', 'Avisar a cirujano de vuelo si persiste 3 noches.'],
    },
    hrp: 'Riesgo HRP: pérdida de sueño y desincronización circadiana',
  },
  {
    id: 'circ', label: 'Desfase circadiano', unit: 'h', icon: 'clock', chart: 'circadian',
    categories: ['sleep', 'mental'], sensor: 'Temperatura cutánea + actigrafía',
    decimals: 1, ok: [-1, 1], warn: [-2, 2], base: 0, noise: 0.12,
    what: 'Reloj biológico de 24 h: cuándo duerme y cuándo llega su temperatura mínima, comparado con el horario de la misión.',
    why: 'Con 16 amaneceres al día en órbita, turnos cambiantes y luz artificial, el reloj interno se desplaza; un desfase de más de 2 h equivale a jet lag permanente.',
    actions: {
      ok: ['Mantener horario de luz y comidas.'],
      warn: ['Luz brillante al despertar, luz tenue 2 h antes de dormir.', 'Comidas a la misma hora.'],
      alert: ['Plan de reajuste de luz con tierra.', 'Evitar cambios de turno esta semana.', 'Valorar melatonina según protocolo.'],
    },
    hrp: 'Riesgo HRP: pérdida de sueño y desincronización circadiana',
  },
  {
    id: 'hrv', label: 'Variabilidad cardiaca', unit: 'ms', icon: 'wave', chart: 'bars',
    categories: ['sleep', 'mental'], sensor: 'PPG arterial / ECG (RMSSD)',
    decimals: 0, ok: [40, 120], warn: [28, 150], base: 54, noise: 3,
    what: 'Variación en milisegundos entre latidos (HRV). Indica cuánto se recupera el sistema nervioso autónomo.',
    why: 'Una HRV baja y sostenida es una de las primeras señales de fatiga autonómica y estrés, antes de que la persona lo note.',
    actions: {
      ok: ['Sin acciones. Seguir rutina.'],
      warn: ['5 min de respiración lenta (6 resp/min).', 'Reducir intensidad del ejercicio de hoy.'],
      alert: ['Descanso activo: sin ejercicio intenso hoy.', 'Check-in de 10 min con un compañero.', 'Revisar junto con cortisol (índice AFI).'],
    },
    hrp: 'Riesgo HRP: condiciones conductuales adversas',
  },
  {
    id: 'cortisol', label: 'Cortisol (sudor)', unit: 'ng/mL', icon: 'flask', chart: 'area',
    categories: ['mental'], sensor: 'Aptasensor electroquímico en sudor',
    decimals: 1, ok: [2, 10], warn: [1, 14], base: 5.5, noise: 0.8,
    what: 'Hormona del estrés medida en sudor sin agujas. Sube con estrés agudo o crónico.',
    why: 'Aislamiento, confinamiento y carga de trabajo elevan el cortisol, que además deprime el sistema inmune.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Pausa de 15 min sin tareas.', 'Llamada privada con familia si está disponible.'],
      alert: ['Reducir carga del turno.', 'Conversación con psicólogo de soporte en tierra.', 'Vigilar sueño de esta noche.'],
    },
    hrp: 'Riesgo HRP: condiciones conductuales adversas · alteración inmune',
  },
  {
    id: 'afi', label: 'Índice de fatiga (AFI)', unit: '%', icon: 'bolt', chart: 'gauge',
    categories: ['mental'], sensor: 'Algoritmo: cortisol + HRV baja',
    decimals: 0, ok: [0, 60], warn: [0, 80], scale: [0, 100], base: 20, noise: 3,
    what: 'Autonomic Fatigue Index: combina cortisol alto y HRV baja en un porcentaje de 0 a 100.',
    why: 'Resume el riesgo de burnout en un solo número fácil de leer a distancia.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Revisar distribución de tareas del día.', 'Priorizar sueño esta noche.'],
      alert: ['Día de carga reducida.', 'Check-in con cirujano de vuelo.', 'Evitar EVA y tareas críticas hasta normalizar.'],
    },
    hrp: 'Riesgo HRP: conductual · desempeño',
  },
  {
    id: 'hr', label: 'Frecuencia cardiaca', unit: 'lpm', icon: 'heart', chart: 'bars',
    categories: ['general', 'mental'], sensor: 'ECG de 3 puntos',
    decimals: 0, ok: [50, 90], warn: [42, 105], base: 66, noise: 3,
    what: 'Latidos por minuto en reposo.',
    why: 'En microgravedad los fluidos se desplazan hacia la cabeza y el corazón se desacondiciona; la FC en reposo cambia con fatiga, fiebre o estrés.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Hidratarse y repetir medición en reposo en 30 min.'],
      alert: ['Detener actividad física.', 'Repetir medición sentado/fijo.', 'Contactar cirujano de vuelo si persiste.'],
    },
    hrp: 'Riesgo HRP: adaptaciones cardiovasculares',
  },
  {
    id: 'bp', label: 'Presión arterial', unit: 'mmHg', icon: 'drop', chart: 'dual',
    categories: ['general'], sensor: 'Estimada a partir de ECG + PPG',
    decimals: 0, ok: [95, 130], warn: [85, 145], base: 117, noise: 3,
    what: 'Presión sistólica / diastólica estimada sin brazalete (tiempo de tránsito de pulso).',
    why: 'El desplazamiento de fluidos y la pérdida de volumen plasmático alteran la presión; es clave para el regreso a gravedad.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Reducir sodio en la siguiente comida.', 'Confirmar con brazalete manual.'],
      alert: ['Confirmar con brazalete manual ahora.', 'Reposo y nueva medición en 15 min.', 'Informar a cirujano de vuelo.'],
    },
    hrp: 'Riesgo HRP: adaptaciones cardiovasculares',
  },
  {
    id: 'spo2', label: 'Oxígeno en sangre', unit: '%', icon: 'o2', chart: 'gauge',
    categories: ['general'], sensor: 'PPG frente y bandas textiles',
    decimals: 0, ok: [95, 100], warn: [92, 100], scale: [85, 100], base: 97.5, noise: 0.6,
    what: 'Saturación de oxígeno (SpO₂).',
    why: 'Fallos del soporte vital, CO₂ alto o hipoxia en hábitats de baja presión reducen la saturación.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Revisar lectura de CO₂ del módulo.', 'Respirar profundo y repetir medición.'],
      alert: ['Revisar soporte vital del módulo.', 'Oxígeno suplementario según protocolo.', 'Contactar tierra.'],
    },
    hrp: 'Riesgo HRP: hipoxia · ambiente cerrado hostil',
  },
  {
    id: 'resp', label: 'Respiración', unit: 'rpm', icon: 'lungs', chart: 'area',
    categories: ['sleep'], sensor: 'PPG frente y bandas textiles',
    decimals: 0, ok: [12, 20], warn: [9, 24], base: 15, noise: 0.8,
    what: 'Respiraciones por minuto, también durante el sueño.',
    why: 'Una respiración alterada al dormir indica sueño de mala calidad, CO₂ alto o enfermedad.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Revisar ventilación cerca del saco de dormir.'],
      alert: ['Verificar CO₂ en la zona de descanso.', 'Medición en reposo y consulta con tierra.'],
    },
    hrp: 'Riesgo HRP: ambiente cerrado hostil · sueño',
  },
  {
    id: 'temp', label: 'Temperatura', unit: '°C', icon: 'thermo', chart: 'area',
    categories: ['sleep', 'general'], sensor: 'Sensor cutáneo',
    decimals: 1, ok: [36.1, 37.4], warn: [35.6, 38.0], base: 36.7, noise: 0.08,
    what: 'Temperatura corporal; su ritmo diario marca el reloj circadiano.',
    why: 'En el espacio la temperatura central tiende a subir y la fiebre puede indicar infección (sistema inmune alterado).',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Hidratarse y repetir en 1 h.'],
      alert: ['Aislar si hay síntomas.', 'Antipirético según kit médico.', 'Informar a cirujano de vuelo.'],
    },
    hrp: 'Riesgo HRP: respuesta inmune · interacción huésped-microorganismo',
  },
  {
    id: 'move', label: 'Ejercicio', unit: 'min', icon: 'run', chart: 'gauge',
    categories: ['sleep'], sensor: 'Acelerómetro 3 ejes',
    decimals: 0, ok: [90, 200], warn: [60, 240], scale: [0, 180], base: 118, noise: 6,
    what: 'Minutos de ejercicio del día (cinta, bici, ARED).',
    why: 'Sin ~2 h diarias de ejercicio se pierde masa ósea y muscular y se desacondiciona el corazón.',
    actions: {
      ok: ['Sesión completa. ¡Bien!'],
      warn: ['Completar sesión de resistencia pendiente.'],
      alert: ['Reprogramar el bloque de ejercicio hoy.', 'Revisar si hay dolor o lesión que lo impida.'],
    },
    hrp: 'Riesgo HRP: aptitud cardiorrespiratoria y musculoesquelética',
  },
  {
    id: 'osteo', label: 'Osteocalcina', unit: 'ng/mL', icon: 'bone', chart: 'area',
    categories: ['general'], sensor: 'Espectroscopia en sudor / orina (vs NTx)',
    decimals: 1, ok: [16, 40], warn: [13, 45], base: 22, noise: 0.4,
    what: 'Marcador de formación ósea. Se compara con NTx (resorción) para ver si el hueso se está perdiendo.',
    why: 'En microgravedad se pierde ~1–1.5 % de densidad ósea al mes en cadera y columna.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Priorizar ejercicio de resistencia (ARED).', 'Revisar ingesta de vitamina D y calcio.'],
      alert: ['Aumentar carga de ARED según protocolo.', 'Revisión nutricional con tierra.'],
    },
    hrp: 'Riesgo HRP: cambios óseos',
  },
  {
    id: 'rad', label: 'Radiación', unit: 'mSv/d', icon: 'rad', chart: 'segments',
    categories: ['general'], sensor: 'Dosímetro personal (método por confirmar)',
    decimals: 2, ok: [0, 0.8], warn: [0, 1.5], base: 0.55, noise: 0.06,
    what: 'Dosis diaria de radiación recibida.',
    why: 'Fuera del campo magnético terrestre los rayos cósmicos y las tormentas solares aumentan el riesgo de cáncer y daño al sistema nervioso.',
    actions: {
      ok: ['Sin acciones.'],
      warn: ['Pasar más tiempo en módulos blindados.'],
      alert: ['Ir al refugio de tormenta solar.', 'Suspender EVA.'],
    },
    hrp: 'Riesgo HRP: radiación espacial',
  },
]

export const METRIC_BY_ID: Record<string, MetricDef> = Object.fromEntries(METRICS.map(m => [m.id, m]))
