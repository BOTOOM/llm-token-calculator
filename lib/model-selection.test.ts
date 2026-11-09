import assert from 'node:assert/strict'
import { test } from 'node:test'
import { annotateModels, compareVersions, heroBadgeText, parseModelVersion, pickDefaults, rankProviders } from './model-selection'
import type { ModelPrice } from './types'

const model = (id: string, price = 1, provider = 'Example'): ModelPrice => ({
  model: id, displayName: id, provider, inputPricePer1M: price, outputPricePer1M: price,
})

test('versions use numeric tuples and preserve family and suffix', () => {
  assert.deepEqual(parseModelVersion('claude-opus-5-5'), { family: 'claude-opus', version: [5, 5], suffix: '' })
  assert.deepEqual(parseModelVersion('gpt-6.1-sol'), { family: 'gpt', version: [6, 1], suffix: 'sol' })
  assert.deepEqual(parseModelVersion('mistral-large-3-pro'), { family: 'mistral-large', version: [3], suffix: 'pro' })
  assert.deepEqual(parseModelVersion('gemini-3.8-flash'), { family: 'gemini', version: [3, 8], suffix: 'flash' })
  assert.equal(compareVersions(parseModelVersion('grok-4.20').version, [4, 9]) > 0, true)
  assert.deepEqual(parseModelVersion('unversioned').version, [])
})

test('parameter sizes are suffixes, not versions', () => {
  for (const size of ['14b', '8b', '70b', '1.5b', 'a3b', '235b-a22b', '8x7b']) {
    assert.deepEqual(parseModelVersion(`example-${size}`), { family: 'example', version: [], suffix: size })
    assert.deepEqual(parseModelVersion(`example-3-${size}`), { family: 'example', version: [3], suffix: size })
  }
  assert.deepEqual(parseModelVersion('ministral-14b'), { family: 'ministral', version: [], suffix: '14b' })
  assert.deepEqual(parseModelVersion('qwen3-235b-a22b'), { family: 'qwen', version: [3], suffix: '235b-a22b' })
  assert.deepEqual(parseModelVersion('llama-3.1-70b'), { family: 'llama', version: [3, 1], suffix: '70b' })
})

test('flags select the most expensive and cheapest latest models per provider and family', () => {
  const models = annotateModels([
    model('family-4', 100), model('family-5-pro', 10), model('family-5-mini', 1),
    model('other-1'), model('unversioned'), model('family-4', 2, 'Another'),
  ])
  assert.deepEqual(models.map(m => [m.isLatest, m.isFlagship, m.isPopular]), [
    [false, false, false], [true, true, false], [true, false, true],
    [true, true, false], [false, false, false], [true, true, false],
  ])
  assert.deepEqual(annotateModels([]), [])
})

test('defaults and badge prefer newest flagships from distinct providers by catalogue size', () => {
  const models = annotateModels([
    model('family-2', 3), model('family-3-mini', 1), model('family-3-pro', 5),
    model('family-9', 2, 'Another'), model('family-1', 2, 'Third'),
  ])
  assert.deepEqual(pickDefaults(models), ['Example:family-3-pro', 'Another:family-9', 'Third:family-1'])
  assert.equal(heroBadgeText(models), 'Now supporting family-3-pro, family-9, family-1 & more')
  assert.deepEqual(pickDefaults([]), [])
  assert.equal(heroBadgeText([]), 'Explore live model pricing')
  assert.deepEqual(pickDefaults([model('unversioned')]), ['Example:unversioned'])
})

test('mirror demand takes priority over catalogue size, with deterministic fallbacks', () => {
  const models = annotateModels([
    model('family-2'), model('family-3'), model('family-4'),
    { ...model('other-1', 1, 'Demanded'), mirrorCount: 5 },
    { ...model('third-1', 1, 'Third'), mirrorCount: 2 },
    { ...model('fourth-1', 1, 'Fourth'), mirrorCount: 2 },
  ])
  assert.deepEqual(rankProviders(models).map(m => m.provider), ['Demanded', 'Fourth', 'Third', 'Example'])
  assert.deepEqual(pickDefaults(models), ['Demanded:other-1', 'Fourth:fourth-1', 'Third:third-1'])
  assert.equal(heroBadgeText(models), 'Now supporting other-1, fourth-1, third-1 & more')
  assert.deepEqual(rankProviders([]), [])
})
