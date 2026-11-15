import type { Evidence, EvidenceId } from './types'

/**
 * Evidence registry for the UI's "Why this matters?" panels.
 *
 * These links are NASA context, not clinical validation of this prototype.
 * Keep this file aligned with documentacion/NASA-EVIDENCE.md.
 */
export const EVIDENCE: Record<EvidenceId, Evidence> = {
  'nasa-five-hazards': {
    id: 'nasa-five-hazards',
    title: 'NASA Human Research Program — The five hazards of human spaceflight',
    shortTitle: 'NASA HRP · Five hazards',
    url: 'https://www.nasa.gov/hrp/hazards/',
    claim:
      'NASA identifies space radiation, isolation and confinement, distance from Earth, gravity fields, and hostile closed environments as the five hazards of human spaceflight.',
    limitation:
      'A hazard is not a diagnosis. This page explains mission context; it does not validate any threshold or model used by this prototype.',
    scope: 'NASA research · mission context',
  },
  'nasa-sleep-risk': {
    id: 'nasa-sleep-risk',
    title: 'NASA Human Research Program — Human spaceflight risks',
    shortTitle: 'NASA HRP · Risks',
    url: 'https://www.nasa.gov/hrp/risks/',
    claim:
      'Insufficient sleep and irregular schedules are relevant risks for health and performance during spaceflight.',
    limitation:
      'NASA describes the risk. It does not define the personal thresholds, alerts, or recommendations shown in this demo.',
    scope: 'NASA research · risk context',
  },
  'nasa-isolation': {
    id: 'nasa-isolation',
    title: 'NASA HRP — Isolation and confinement',
    shortTitle: 'NASA HRP · Isolation',
    url: 'https://www.nasa.gov/hrp/hazard-isolation-and-confinement/',
    claim:
      'Isolation and confinement can be associated with sleep loss, circadian disruption, and stress.',
    limitation:
      'This does not diagnose a behavioral health condition. Self-report and context are required before any interpretation.',
    scope: 'NASA research · behavioral health context',
  },
  'nasa-standard-measures': {
    id: 'nasa-standard-measures',
    title: 'NASA Standard Measures',
    shortTitle: 'NASA · Standard Measures',
    url: 'https://www.nasa.gov/reference/standard-measures/',
    claim:
      'NASA studies multiple health domains with standardized measures, including sleep, questionnaires, and wrist-worn sensors.',
    limitation:
      'A commercial wearable is not automatically equivalent to a NASA measurement protocol or a medical instrument.',
    scope: 'NASA research · measurement context',
  },
  'nasa-hrr': {
    id: 'nasa-hrr',
    title: 'NASA Human Research Roadmap',
    shortTitle: 'NASA · Human Research Roadmap',
    url: 'https://humanresearchroadmap.nasa.gov/architecture/',
    claim:
      'NASA maintains a hierarchy of human health and performance risks with linked evidence.',
    limitation:
      'The roadmap organizes research. It does not provide a universal clinical threshold for an individual astronaut.',
    scope: 'NASA research · evidence architecture',
  },
  'nasa-cardiovascular': {
    id: 'nasa-cardiovascular',
    title: 'NASA Human Research Program — Cardiovascular adaptations',
    shortTitle: 'NASA HRP · Cardiovascular',
    url: 'https://www.nasa.gov/hrp/risks/',
    claim:
      'Microgravity changes circulation and cardiovascular function; cardiovascular adaptation is a documented spaceflight risk area.',
    limitation:
      'A trend in a demo metric is not a cardiovascular diagnosis. Clinical interpretation requires mission medical review.',
    scope: 'NASA research · cardiovascular context',
  },
  'nasa-bone': {
    id: 'nasa-bone',
    title: 'NASA Human Research Program — Bone and musculoskeletal risk',
    shortTitle: 'NASA HRP · Bone',
    url: 'https://www.nasa.gov/hrp/risks/',
    claim:
      'Without gravity, bone tissue can deteriorate and fragility can increase during long-duration spaceflight.',
    limitation:
      'Bone turnover markers are not a stand-alone diagnosis. This prototype shows a synthetic trend for demonstration only.',
    scope: 'NASA research · bone context',
  },
  'nasa-radiation': {
    id: 'nasa-radiation',
    title: 'NASA Human Research Program — Space radiation',
    shortTitle: 'NASA HRP · Radiation',
    url: 'https://www.nasa.gov/hrp/hazards/',
    claim:
      'Space radiation is one of the five hazards of human spaceflight and is studied for long-term health effects.',
    limitation:
      'A cumulative dose display is not a personalized cancer risk estimate. Mission dosimetry and medical review are required.',
    scope: 'NASA research · radiation context',
  },
  'nasa-nutrition': {
    id: 'nasa-nutrition',
    title: 'NASA Human Research Program — Nutrition and health risks',
    shortTitle: 'NASA HRP · Nutrition',
    url: 'https://www.nasa.gov/hrp/risks/',
    claim:
      'Adequate nutrition is relevant to health and performance on long-duration missions.',
    limitation:
      'This prototype does not calculate nutritional requirements or prescribe diets.',
    scope: 'NASA research · nutrition context',
  },
}

export const evidenceFor = (id: EvidenceId): Evidence => EVIDENCE[id]
