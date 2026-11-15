import type { Metric, Status } from '../core/data/types'
import type { AstroState } from '../core/logic/crew'
import { fmtDelta } from '../core/logic/explain'
import type { CheckIn } from '../core/logic/local'

/**
 * Contraste entre lo que la persona siente y lo que dicen sus biomarcadores.
 * Es el corazón de la versión individual: un astronauta casi siempre responde «estoy bien».
 * Tono amable, nunca acusador; la percepción también cuenta.
 */
export interface Note { tone: Status; text: string }

const worstOf = (st: AstroState, ids: string[]): Metric | undefined =>
  st.metrics.filter(m => ids.includes(m.def.id) && m.status !== 'ok')
    .sort((a, b) => (b.status === 'alert' ? 1 : 0) - (a.status === 'alert' ? 1 : 0) || Math.abs(b.z) - Math.abs(a.z))[0]

const DIM = {
  energy: { ids: ['energy', 'hrv', 'sleep'], good: 'con energía', bad: 'sin energía' },
  mood: { ids: ['cortisol', 'hrv'], good: 'de buen ánimo', bad: 'con el ánimo bajo' },
  sleep: { ids: ['sleep', 'circ', 'melatonin'], good: 'descansado', bad: 'mal descansado' },
} as const

export function compare(c: CheckIn, st: AstroState): Note[] {
  const hidden: Note[] = [], felt: Note[] = []
  for (const k of ['energy', 'mood', 'sleep'] as const) {
    const v = c[k], d = DIM[k], m = worstOf(st, [...d.ids])
    if (v >= 4 && m) {
      const delta = fmtDelta(m)
      hidden.push({
        tone: m.status,
        text: `Te sientes ${d.good}, pero ${m.def.id === 'sleep' ? `dormiste ${String(m.value?.toFixed(1)).replace('.', ',')} h` : `tu ${m.def.label.toLowerCase()} está ${delta ? `${delta} frente a tu base` : 'fuera de tu base'}`}. Tenlo en cuenta hoy.`,
      })
    } else if (v <= 2 && !m) {
      felt.push({ tone: 'warn', text: `Tus indicadores de ${k === 'energy' ? 'energía' : k === 'mood' ? 'ánimo' : 'sueño'} están en tu base, pero te sientes ${d.bad}. Lo que sientes cuenta: coméntalo con alguien de confianza.` })
    }
  }
  const notes = [...hidden, ...felt].slice(0, 2)
  return notes.length ? notes : [{ tone: 'ok', text: 'Lo que sientes coincide con tus indicadores. Sigue así.' }]
}
