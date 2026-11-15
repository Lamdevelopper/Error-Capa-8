import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/components/chart-helpers.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { chartDomain, seriesPath, nearestPoint, timeLabel } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)

test('las escalas se basan en los datos y las barras incluyen cero', () => {
  assert.deepEqual(chartDomain([{ t: 0, v: 10 }, { t: 1, v: 20, v2: 5 }]), [3.5, 21.5])
  assert.deepEqual(chartDomain([{ t: 0, v: 10 }], true), [0, 11])
})
test('las líneas secundarias no inventan valores ni unen huecos', () => {
  const points = [{ t: 0, v: 10, v2: 4 }, { t: 1, v: 11 }, { t: 2, v: 12, v2: 6 }]
  assert.equal(seriesPath(points, 'v2', i => i, v => v), 'M0.0,4.0M2.0,6.0')
  assert.equal(nearestPoint(points, 1.6), 2)
  assert.equal(timeLabel(7, false), 'Paso 7')
})
