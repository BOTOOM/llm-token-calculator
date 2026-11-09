import assert from 'node:assert/strict'
import { test } from 'node:test'
import { annotateModels, compareVersions, heroBadgeText, parseModelVersion, pickDefaults, rankProviders } from './model-selection'
import type { ModelPrice } from './types'
import { fallbackModelPrices } from './model-prices'

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

test('v-prefixed versions share a family and restore the newest flagship', () => {
  assert.deepEqual(parseModelVersion('deepseek-v4-pro'), { family: 'deepseek', version: [4], suffix: 'pro' })
  assert.deepEqual(parseModelVersion('deepseek-v3.2'), { family: 'deepseek', version: [3, 2], suffix: '' })
  assert.deepEqual(parseModelVersion('deepseek-v'), { family: 'deepseek', version: [], suffix: 'v' })
  assert.deepEqual(parseModelVersion('deepseek-a22b'), { family: 'deepseek', version: [], suffix: 'a22b' })
  assert.deepEqual(parseModelVersion('deepseek-v4-a22b'), { family: 'deepseek', version: [4], suffix: 'a22b' })
  const models = annotateModels([model('deepseek-v3.2', 10), model('deepseek-v4-pro', 5), model('deepseek-v4-flash', 1)])
  assert.deepEqual(models.map(m => [m.isLatest, m.isFlagship, m.isPopular]), [
    [false, false, false], [true, true, false], [true, false, true],
  ])
})

test('flags select the most expensive and cheapest latest models per provider and family', () => {
  const models = annotateModels([
    model('family-4', 100), model('family-5-pro', 10), model('family-5-mini', 1),
    model('other-1'), model('unversioned'), model('family-4', 2, 'Another'),
  ])
  assert.deepEqual(models.map(m => [m.isLatest, m.isFlagship, m.isPopular]), [
    [false, false, false], [true, true, false], [true, false, true],
    [true, true, false], [true, true, false], [true, true, false],
  ])
  assert.deepEqual(annotateModels([]), [])
})

test('unversioned families use the price rule unless a real version exists', () => {
  const models = annotateModels([model('family-70b', 10), model('family-8b', 1)])
  assert.deepEqual(models.map(m => [m.isLatest, m.isFlagship, m.isPopular]), [
    [true, true, false], [true, false, true],
  ])
  const mixed = annotateModels([model('family', 100), model('family-70b', 10), model('family-0', 1)])
  assert.deepEqual(mixed.map(m => [m.isLatest, m.isFlagship, m.isPopular]), [
    [false, false, false], [false, false, false], [true, true, false],
  ])
})

test('fallback models retain unversioned flagships and usable presentation', () => {
  const models = annotateModels(fallbackModelPrices)
  for (const id of ['mistral-large', 'command-r-plus']) {
    assert.equal(models.find(m => m.model === id)?.isLatest, true)
    assert.equal(models.find(m => m.model === id)?.isFlagship, true)
  }
  assert.ok(pickDefaults(models).length > 0)
  assert.match(heroBadgeText(models), /^Now supporting /)
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
