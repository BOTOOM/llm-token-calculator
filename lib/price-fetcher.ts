import { fallbackModelPrices } from '@/lib/model-prices'
import type { ModelPrice, LiteLLMPricingResponse, LiteLLMModelData } from '@/lib/types'

const LITELLM_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'

export const PRICE_CACHE_MAX_AGE = 3600 // seconds

// Module-level in-process cache shared across all API routes within the same serverless instance
let cachedPrices: ModelPrice[] | null = null
let cacheTime = 0

// ─── Provider display name mapping ────────────────────────────────────────────
const providerMap: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  vertex_ai: 'Google',
  'vertex_ai-language-models': 'Google',
  gemini: 'Google',
  bedrock: 'AWS Bedrock',
  bedrock_converse: 'AWS Bedrock',
  mistral: 'Mistral',
  together_ai: 'Together AI',
  groq: 'Groq',
  deepseek: 'DeepSeek',
  fireworks_ai: 'Fireworks',
  cohere: 'Cohere',
  ai21: 'AI21',
  replicate: 'Replicate',
  perplexity: 'Perplexity',
}

// ─── Curated model allowlist (regex patterns) ─────────────────────────────────
const INCLUDED_PATTERNS = [
  /^gpt-4/, /^gpt-5/, /^o1/, /^o3/, /^o4/,
  /^claude-3/, /^claude-4/, /^claude-sonnet/, /^claude-opus/,
  /^gemini-2/, /^gemini-3/,
  /^mistral-large/, /^mistral-small/, /^codestral/, /^ministral/,
  /^deepseek/,
  /^llama-4/, /^llama-3\.3/, /^llama3/,
  /^qwen/, /^qwq/,
  /^nova/, /^titan/,
]

const EXCLUDED_TERMS = [
  'dall-e', 'image', 'embedding', 'moderation', 'tts', 'whisper', 'realtime',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function resolveProvider(data: LiteLLMModelData): string {
  const key = (data.litellm_provider ?? '').toLowerCase()
  return providerMap[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

function cleanModelId(modelId: string): string {
  return modelId
    .replace(/^(openai\/|anthropic\/|vertex_ai\/|bedrock\/|groq\/)/, '')
    .replace(/-20\d{6}$/, '')
    .replace(/:0$/, '')
}

function buildDisplayName(modelId: string): string {
  return cleanModelId(modelId)
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/Gpt/g, 'GPT')
    .replace(/^O(\d)/, 'o$1')
}

function shouldInclude(modelId: string, data: LiteLLMModelData): boolean {
  if (data.mode && !['chat', 'completion'].includes(data.mode)) return false
  if (!data.input_cost_per_token && !data.output_cost_per_token) return false

  const id = cleanModelId(modelId).toLowerCase()
  if (EXCLUDED_TERMS.some(t => id.includes(t))) return false

  return INCLUDED_PATTERNS.some(p => p.test(id))
}

function parseModel(modelId: string, data: LiteLLMModelData): ModelPrice | null {
  if (!shouldInclude(modelId, data)) return null

  const inputPricePer1M = (data.input_cost_per_token ?? 0) * 1_000_000
  const outputPricePer1M = (data.output_cost_per_token ?? 0) * 1_000_000
  if (inputPricePer1M === 0 && outputPricePer1M === 0) return null

  const id = cleanModelId(modelId)

  return {
    provider: resolveProvider(data),
    model: id,
    displayName: buildDisplayName(modelId),
    inputPricePer1M,
    outputPricePer1M,
    cachedInputPricePer1M: data.cache_read_input_token_cost
      ? data.cache_read_input_token_cost * 1_000_000
      : undefined,
    contextWindow: data.max_input_tokens ?? data.max_tokens,
    maxOutputTokens: data.max_output_tokens,
    supportsVision: data.supports_vision,
    supportsFunctionCalling: data.supports_function_calling,
    isReasoning:
      data.supports_reasoning ||
      modelId.includes('o1') ||
      modelId.includes('o3') ||
      modelId.includes('reasoning'),
    isPopular: ['gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-2.0-flash', 'deepseek-chat'].some(
      m => modelId.includes(m),
    ),
    isFlagship: ['gpt-5', 'claude-4', 'o3', 'gemini-3'].some(m => modelId.includes(m)),
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function getModelPrices(): Promise<{ models: ModelPrice[]; source: string }> {
  const now = Date.now()

  if (cachedPrices && now - cacheTime < PRICE_CACHE_MAX_AGE * 1000) {
    return { models: cachedPrices, source: 'LiteLLM' }
  }

  try {
    const res = await fetch(LITELLM_URL, { next: { revalidate: PRICE_CACHE_MAX_AGE } })
    if (!res.ok) throw new Error(`Upstream ${res.status}`)

    const data: LiteLLMPricingResponse = await res.json()
    const seen = new Set<string>()
    const models: ModelPrice[] = []

    for (const [id, d] of Object.entries(data)) {
      if (id === 'sample_spec') continue
      const parsed = parseModel(id, d as LiteLLMModelData)
      if (!parsed) continue
      const key = `${parsed.provider}:${parsed.model}`
      if (seen.has(key)) continue
      seen.add(key)
      models.push(parsed)
    }

    models.sort((a, b) =>
      a.provider !== b.provider
        ? a.provider.localeCompare(b.provider)
        : a.displayName.localeCompare(b.displayName),
    )

    cachedPrices = models
    cacheTime = now
    return { models, source: 'LiteLLM' }
  } catch {
    return { models: fallbackModelPrices, source: 'fallback' }
  }
}
