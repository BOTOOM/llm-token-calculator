import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getModelPrices } from './price-fetcher'

test('upstream failure falls back; responses and unknown providers are accepted without resale duplicates', async () => {
  const original = globalThis.fetch
  try {
    globalThis.fetch = async () => { throw new Error('offline') }
    const fallback = await getModelPrices()
    assert.equal(fallback.source, 'fallback')
    assert.ok(fallback.models.length > 0)
    globalThis.fetch = async () => Response.json({})
    assert.equal((await getModelPrices()).source, 'fallback')
    const entry = { litellm_provider: 'new_vendor', mode: 'responses', input_cost_per_token: 0.000001, output_cost_per_token: 0.000002 }
    const feed = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`family-${i + 1}`, entry]))
    Object.assign(feed, {
      'claude-opus-5-5': { ...entry, litellm_provider: 'anthropic' },
      'gpt-6.1-sol': { ...entry, litellm_provider: 'openai' },
      'gpt-6-astra': { ...entry, litellm_provider: 'openai' },
      'gpt-5.5-pro': { ...entry, litellm_provider: 'openai' },
      'azure/gpt-6.1-sol': { ...entry, litellm_provider: 'azure' },
      'openrouter/gpt-6.1-sol': { ...entry, litellm_provider: 'openrouter' },
      'not-text-1': { ...entry, mode: 'image_generation' },
    })
    globalThis.fetch = async (_url, init) => {
      assert.equal(init?.cache, 'no-store')
      return Response.json(feed)
    }
    const { models, source } = await getModelPrices()
    assert.equal(source, 'LiteLLM')
    assert.equal(models.length, 24)
    assert.ok(models.some(m => m.provider === 'New Vendor' && m.isLatest))
    assert.equal(models.find(m => m.model === 'claude-opus-5-5')?.displayName, 'Claude Opus 5.5')
    assert.equal(models.find(m => m.model === 'gpt-6.1-sol')?.displayName, 'GPT 6.1 Sol')
    assert.ok(models.some(m => m.model === 'gpt-6-astra'))
    assert.ok(models.some(m => m.model === 'gpt-5.5-pro'))
  } finally {
    globalThis.fetch = original
  }
})
