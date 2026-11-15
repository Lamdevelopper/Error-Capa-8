import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/data/readings.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)
const base = { astroId: 'triangle', metricId: 'hr', value: 70, capturedAt: '2026-11-14T12:30:00Z' }

test('inserta, ordena y actualiza eventos sin duplicarlos', () => {
  assert.equal(api.ingestReadings([base, { ...base, value: 80, capturedAt: '2026-11-14T13:30:00+01:00' }]), 2)
  assert.equal(api.readingsFor('triangle', 'hr').length, 1)
  assert.equal(api.readingsFor('triangle', 'hr')[0].value, 80)
  api.importReadings(JSON.stringify([{ ...base, recordId: 'sensor-1', capturedAt: '2026-11-14T13:00:00Z' }]))
  api.ingestReadings([{ ...base, value: null, recordId: 'sensor-1', capturedAt: '2026-11-14T14:00:00Z' }])
  assert.equal(api.readingsFor('triangle', 'hr').length, 2)
  assert.equal(api.readingsFor('triangle', 'hr').at(-1).value, null)
})

test('rechaza el lote entero y no notifica si hay errores', () => {
  const before = api.readingsVersion()
  assert.throws(() => api.ingestReadings([{ ...base, value: 90 }, { ...base, metricId: 'inventada' }]), /Lectura 2/)
  assert.equal(api.readingsVersion(), before)
  assert.equal(api.readingsFor('triangle', 'hr')[0].value, 80)
  assert.throws(() => api.importReadings('{'), /JSON válido/)
  assert.throws(() => api.ingestReadings([{ ...base, capturedAt: 'ayer' }]), /capturedAt/)
})

test('fuente mantiene sesiones estables y señala una lectura ausente', async () => {
  const combined = await build({ stdin: { contents: "export { mockSource } from './src/data/mockSource'; export { ingestReadings } from './src/data/readings'", resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', write: false })
  const { mockSource, ingestReadings } = await import(`data:text/javascript;base64,${Buffer.from(combined.outputFiles[0].contents).toString('base64')}`)
  const metric = (id, tick) => mockSource.metrics('circle', tick).find(m => m.def.id === id)
  for (const id of ['sleep', 'circ', 'cortisol', 'osteo', 'move']) assert.equal(metric(id, 30).value, metric(id, 100).value)
  ingestReadings([{ astroId: 'circle', metricId: 'spo2', value: null, capturedAt: '2026-11-14T12:30:00Z' }])
  assert.equal(metric('spo2', 30).availability, 'missing')
  assert.equal(metric('spo2', 30).status, 'unknown')
})

test('valida unidades y limita la identidad al astronauta y la métrica', () => {
  assert.throws(() => api.ingestReadings([{ ...base, unit: 'kg' }]), /unit debe ser lpm/)
  api.ingestReadings([
    { ...base, recordId: 'compartido', unit: 'lpm', synthetic: false },
    { ...base, astroId: 'square', recordId: 'compartido', unit: 'lpm' },
  ])
  assert.equal(api.readingsFor('square', 'hr').at(-1).synthetic, true)
  assert.equal(api.readingsFor('triangle', 'hr').find(r => r.recordId === 'compartido').synthetic, false)
})

test('el historial usa fechas y no conecta lecturas separadas por null', async () => {
  const combined = await build({ stdin: { contents: "export { mockSource } from './src/data/mockSource'; export { ingestReadings } from './src/data/readings'", resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', write: false })
  const { mockSource, ingestReadings } = await import(`data:text/javascript;base64,${Buffer.from(combined.outputFiles[0].contents).toString('base64')}`)
  const timestamp = '2026-11-14T14:00:00Z'
  ingestReadings([
    { ...base, capturedAt: '2026-11-14T12:00:00Z' },
    { ...base, value: null, capturedAt: '2026-11-14T13:00:00Z' },
    { ...base, value: 75, capturedAt: timestamp },
  ])
  const metric = mockSource.metrics('triangle', 30).find(m => m.def.id === 'hr')
  assert.deepEqual(metric.series, [{ t: Date.parse(timestamp), v: 75, v2: undefined }])
  assert.equal(metric.synthetic, true)
})

test('CSV importa todas las métricas y etapas, y conserva las comas citadas', async () => {
  const { readFile } = await import('node:fs/promises')
  const csv = await readFile('public/data/lecturas-ejemplo.csv', 'utf8')
  const json = await readFile('public/data/lecturas-ejemplo.json', 'utf8')
  const records = JSON.parse(json)
  assert.equal(new Set(records.filter(r => r.astroId === 'triangle').map(r => r.metricId)).size, 13)
  assert.equal(api.importMeasurements(csv, 'csv'), records.length)
  const sleep = api.readingsFor('triangle', 'sleep').at(-1)
  const asleep = sleep.sleepStages.filter(s => s.stage !== 'awake').reduce((sum, s) => sum + Date.parse(s.endAt) - Date.parse(s.startAt), 0) / 3_600_000
  assert.equal(asleep, sleep.value)
  assert.equal(sleep.periodStart, '2026-11-13T23:00:00Z')
  assert.equal(api.importMeasurements(json, 'json'), records.length)
})

test('rechaza fechas imposibles y sesiones inválidas sin modificar el lote', () => {
  const version = api.readingsVersion()
  for (const invalid of [
    { ...base, capturedAt: '2026-02-30T12:00:00Z' },
    { ...base, metricId: 'sleep', value: -1 },
    { ...base, metricId: 'sleep', value: 9, periodStart: '2026-11-13T23:00:00Z', periodEnd: '2026-11-14T07:00:00Z' },
    { ...base, metricId: 'sleep', periodStart: '2026-11-14T00:00:00Z' },
    { ...base, metricId: 'sleep', sleepStages: [{ stage: 'rem', startAt: '2026-11-14T02:00:00Z', endAt: '2026-11-14T01:00:00Z' }] },
    { ...base, metricId: 'sleep', periodStart: '2026-11-14T00:00:00Z', periodEnd: '2026-11-14T01:00:00Z', sleepStages: [{ stage: 'rem', startAt: '2026-11-14T00:30:00Z', endAt: '2026-11-14T02:00:00Z' }] },
  ]) assert.throws(() => api.ingestReadings([base, invalid]))
  assert.equal(api.readingsVersion(), version)
  assert.throws(() => api.importMeasurements('astroId,metricId,value,capturedAt\ntriangle,hr,xx,2026-11-14T12:00:00Z', 'csv'))
})

test('datos reales carecen de estado clínico y preservan segunda lectura ausente', async () => {
  const combined = await build({ stdin: { contents: "export { mockSource } from './src/data/mockSource'; export { ingestReadings } from './src/data/readings'", resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', write: false })
  const { mockSource, ingestReadings } = await import(`data:text/javascript;base64,${Buffer.from(combined.outputFiles[0].contents).toString('base64')}`)
  ingestReadings([{ ...base, metricId: 'bp', value: 120, synthetic: false }])
  const metric = mockSource.metrics('triangle', 30).find(m => m.def.id === 'bp')
  assert.equal(metric.status, 'unknown')
  assert.equal(metric.value2, undefined)
})
