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
      'bedrock/us.vendor.claude-opus-5-5-v1:0': { ...entry, litellm_provider: 'bedrock' },
      'vertex_ai/claude-sonnet-5-5': { ...entry, litellm_provider: 'vertex_ai' },
      'together_ai/vendor/claude-opus-4-5': { ...entry, litellm_provider: 'together_ai' },
      'azure_ai/claude-opus-image': { ...entry, mode: 'image_generation', litellm_provider: 'azure_ai' },
      'azure_ai/unmatched-9': { ...entry, litellm_provider: 'azure_ai' },
      'fireworks_ai/claude-opus-free': { ...entry, input_cost_per_token: 0, output_cost_per_token: 0, litellm_provider: 'fireworks_ai' },
      'ministral-14b': { ...entry, litellm_provider: 'mistral' },
      'openai-gpt-5': { ...entry, litellm_provider: 'snowflake' },
      'azure/openai/gpt-6-sol': { ...entry, litellm_provider: 'azure' },
      'ministral-3-14b': { ...entry, litellm_provider: 'mistral' },
      'llama-3.1-70b': { ...entry, litellm_provider: 'meta' },
      'not-text-1': { ...entry, mode: 'image_generation' },
    })
    globalThis.fetch = async (_url, init) => {
      assert.equal(init?.cache, 'no-store')
      return Response.json(feed)
    }
    const { models, source } = await getModelPrices()
    assert.equal(source, 'LiteLLM')
    assert.equal(models.length, 28)
    assert.ok(models.some(m => m.provider === 'New Vendor' && m.isLatest))
    assert.equal(models.find(m => m.model === 'claude-opus-5-5')?.displayName, 'Claude Opus 5.5')
    assert.equal(models.find(m => m.model === 'gpt-6.1-sol')?.displayName, 'GPT 6.1 Sol')
    assert.ok(models.some(m => m.model === 'gpt-6-astra'))
    assert.ok(models.some(m => m.model === 'gpt-5.5-pro'))
    assert.equal(models.find(m => m.model === 'ministral-14b')?.displayName, 'Ministral 14B')
    assert.equal(models.find(m => m.model === 'ministral-14b')?.isLatest, false)
    assert.equal(models.find(m => m.model === 'ministral-3-14b')?.isLatest, true)
    assert.equal(models.find(m => m.model === 'llama-3.1-70b')?.displayName, 'Llama 3.1 70B')
    assert.ok(models.filter(m => m.provider === 'OpenAI').every(m => m.mirrorCount === 3))
    assert.ok(models.filter(m => m.provider === 'Anthropic').every(m => m.mirrorCount === 3))
    assert.ok(models.filter(m => m.provider === 'New Vendor').every(m => m.mirrorCount === 0))
    assert.ok(models.filter(m => m.provider === 'Snowflake').every(m => m.mirrorCount === 0))
  } finally {
    globalThis.fetch = original
  }
})
