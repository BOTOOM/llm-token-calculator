import { fallbackModelPrices } from '@/lib/model-prices'
import type { ModelPrice, LiteLLMPricingResponse, LiteLLMModelData } from '@/lib/types'

const LITELLM_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'

export const PRICE_CACHE_MAX_AGE = 3600 // seconds

// Module-level in-process cache shared across all API routes within the same serverless instance
let cachedPrices: ModelPrice[] | null = null
let cacheTime = 0

// ─── Provider allowlist ───────────────────────────────────────────────────────
// We surface models from every company that publishes its own models directly
// under a canonical `litellm_provider` key. We still skip pure resale/infra
// platforms (azure/*, bedrock regional mirrors, vertex_ai mirrors, openrouter,
// fireworks_ai, together_ai, deepinfra, ...) because they only re-host models
// already captured under their originating company above, and including them
// too would just triple/quadruple the same underlying model.
const providerMap: Record<string, string> = {
  openai: 'OpenAI',
  'text-completion-openai': 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google',
  palm: 'Google',
  xai: 'xAI',
  mistral: 'Mistral',
  codestral: 'Mistral',
  deepseek: 'DeepSeek',
  groq: 'Groq',
  perplexity: 'Perplexity',
  cohere: 'Cohere',
  cohere_chat: 'Cohere',
  amazon_nova: 'Amazon',
  meta: 'Meta',
  ai21: 'AI21 Labs',
  moonshot: 'Moonshot AI',
  minimax: 'MiniMax',
  zai: 'Zhipu AI',
  snowflake: 'Snowflake',
  tencent: 'Tencent',
  watsonx: 'IBM',
  qwen_ai_platform: 'Alibaba',
  dashscope: 'Alibaba',
  inception: 'Inception Labs',
  'text-completion-inception': 'Inception Labs',
  morph: 'Morph',
  v0: 'Vercel',
  cerebras: 'Cerebras',
  nlp_cloud: 'NLP Cloud',
  cognition: 'Cognition',
  databricks: 'Databricks',
  friendliai: 'FriendliAI',
}

// ─── Noise blocklist ───────────────────────────────────────────────────────────
// Non-chat endpoints that should never show up in a pricing comparison. Real
// model families (Gemma, GigaChat, etc.) are intentionally NOT excluded here —
// only actual non-text API modes and internal test/placeholder codenames are.
const EXCLUDED_TERMS = [
  'dall-e', 'image', 'embedding', 'moderation', 'tts', 'whisper', 'realtime',
  'audio', 'transcribe', 'deep-research', 'search-api', 'search-preview',
  'computer-use', 'codex',
]

// Anchored internal/placeholder test codenames (matched against the cleaned
// id) that are not real publicly-billable models.
const EXCLUDED_PATTERNS = [
  /daybreak/, /rosalind/, /astra/, /fable/, /mythos/, /vibe-cli/,
  /robotics/, /nightly/,
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function resolveProvider(data: LiteLLMModelData): string {
  const key = (data.litellm_provider ?? '').toLowerCase()
  return providerMap[key] ?? ''
}

// Normalize a raw LiteLLM model id into a clean, canonical, human-friendly id.
function cleanModelId(modelId: string): string {
  let s = modelId
  // Strip a leading "provider/" slug (xai/, openai/, amazon-nova/, ...)
  s = s.replace(/^[a-z0-9_-]+\//i, '')
  // Strip dotted region / vendor prefixes (us., eu., apac., amazon., ...)
  s = s.replace(/^(us|eu|apac|au|jp|global|sa|ca|me)\./i, '')
  s = s.replace(/^amazon\./i, '')
  // Strip bedrock-style version + inference suffixes
  s = s.replace(/-v\d+(:\d+)?$/i, '')
  s = s.replace(/:\d+$/, '')
  // Strip trailing marketing / tooling suffixes
  s = s.replace(/-customtools$/i, '')
  s = s.replace(/@default$/i, '')
  s = s.replace(/-latest$/i, '')
  s = s.replace(/-preview$/i, '')
  // Strip date-stamped variants (keep the canonical rolling name)
  s = s.replace(/[-@]20\d{6}$/, '')            // -20250514
  s = s.replace(/[-@]\d{4}-\d{2}-\d{2}$/, '')  // -2025-05-14
  s = s.replace(/-\d{2}-\d{4}$/, '')           // -08-2024
  s = s.replace(/-\d{2}-\d{2}$/, '')           // -06-17
  s = s.replace(/-preview$/i, '')              // trailing preview exposed after date strip
  s = s.replace(/-\d{4}$/, '')                 // -2405 / -2508 / -0125 (MMYY/YYMM)
  return s
}

function buildDisplayName(cleanId: string): string {
  return cleanId
    .split(/[-_]/)
    .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
    .replace(/\bGpt\b/g, 'GPT')
    .replace(/\bLlama\b/g, 'Llama')
    .replace(/\bDeepseek\b/g, 'DeepSeek')
    .replace(/\bQwq\b/g, 'QwQ')
    .replace(/^O(\d)/, 'o$1')
    .replace(/\bAi\b/g, 'AI')
}

function shouldInclude(cleanId: string, data: LiteLLMModelData): boolean {
  if (!resolveProvider(data)) return false
  if (data.mode && !['chat', 'completion'].includes(data.mode)) return false
  if (!data.input_cost_per_token && !data.output_cost_per_token) return false

  const id = cleanId.toLowerCase()
  // Reject anything that failed to normalize into a clean canonical id
  if (id.includes('/') || id.includes(':') || id.includes('@')) return false
  if (/(^|-)beta(-|$)|-thinking$/.test(id)) return false
  if (/[-.]20\d{6}|\d{4}-\d{2}-\d{2}/.test(id)) return false
  // Drop leftover date-snapshot segments (e.g. -0309, -0125, -2508)
  if (/-\d{3,4}(-|$)/.test(id)) return false
  // Drop explicit reasoning/non-reasoning split variants; the base model stays
  if (/-non-reasoning$|-reasoning$/.test(id)) return false
  if (EXCLUDED_TERMS.some(t => id.includes(t))) return false
  if (EXCLUDED_PATTERNS.some(p => p.test(id))) return false

  return true
}

function isReasoningModel(id: string, data: LiteLLMModelData): boolean {
  return Boolean(
    data.supports_reasoning ||
      /^o\d/.test(id) ||
      /reasoner|reasoning|-r1|-r\d|thinking|magistral|qwq|sonar-reasoning|grok-4/.test(id),
  )
}

function isCodingModel(id: string): boolean {
  return /codestral|coder|devstral|code(-|$)|codellama/.test(id)
}

const FLAGSHIP_PATTERNS = [
  /^gpt-5(\.\d+)?$/, /^gpt-5(\.\d+)?-pro$/, /^o3$/, /^o3-pro$/,
  /^claude-opus/, /^claude-.*sonnet.*$/, /^grok-4/, /^gemini-3.*pro/,
  /^gemini-2\.5-pro/, /^mistral-large/, /^deepseek-(r1|v4-pro|reasoner)/,
  /^nova-pro/, /^command-a/, /^command-r-plus/,
]

const POPULAR_PATTERNS = [
  /^gpt-5-mini$/, /^gpt-4o-mini$/, /^gpt-4\.1-mini$/,
  /^claude-.*haiku/, /^claude-sonnet-4/, /^gemini-2\.5-flash$/,
  /^gemini-3.*flash/, /^deepseek-chat$/, /^grok-3-mini/, /^mistral-small/,
  /^nova-lite/,
]

function parseModel(modelId: string, data: LiteLLMModelData): ModelPrice | null {
  const cleanId = cleanModelId(modelId)
  if (!shouldInclude(cleanId, data)) return null

  const inputPricePer1M = (data.input_cost_per_token ?? 0) * 1_000_000
  const outputPricePer1M = (data.output_cost_per_token ?? 0) * 1_000_000
  if (inputPricePer1M === 0 && outputPricePer1M === 0) return null

  const lowerId = cleanId.toLowerCase()
  const reasoning = isReasoningModel(lowerId, data)

  return {
    provider: resolveProvider(data),
    model: cleanId,
    displayName: buildDisplayName(cleanId),
    inputPricePer1M,
    outputPricePer1M,
    cachedInputPricePer1M: data.cache_read_input_token_cost
      ? data.cache_read_input_token_cost * 1_000_000
      : undefined,
    contextWindow: data.max_input_tokens ?? data.max_tokens,
    maxOutputTokens: data.max_output_tokens,
    supportsVision: data.supports_vision,
    supportsFunctionCalling: data.supports_function_calling,
    supportsStreaming: data.mode === 'chat' || data.mode === undefined,
    supportsJSON: Boolean(data.supports_response_schema),
    isMultimodal: data.supports_vision,
    isReasoning: reasoning,
    isCoding: isCodingModel(lowerId),
    isPopular: POPULAR_PATTERNS.some(p => p.test(lowerId)),
    isFlagship: FLAGSHIP_PATTERNS.some(p => p.test(lowerId)),
  }
}

// Prefer the entry that carries richer metadata when the same canonical id
// appears more than once (e.g. a plain vs. a context-window-bearing variant).
function score(m: ModelPrice): number {
  let s = 0
  if (m.contextWindow) s += 2
  if (m.maxOutputTokens) s += 1
  if (m.supportsVision !== undefined) s += 1
  return s
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
    const byKey = new Map<string, ModelPrice>()

    for (const [id, d] of Object.entries(data)) {
      if (id === 'sample_spec') continue
      const parsed = parseModel(id, d as LiteLLMModelData)
      if (!parsed) continue
      const key = `${parsed.provider}:${parsed.model}`
      const existing = byKey.get(key)
      if (!existing || score(parsed) > score(existing)) {
        byKey.set(key, parsed)
      }
    }

    const models = [...byKey.values()].sort((a, b) =>
      a.provider !== b.provider
        ? a.provider.localeCompare(b.provider)
        : a.displayName.localeCompare(b.displayName),
    )

    // Guard against an unexpectedly empty/broken upstream payload
    if (models.length < 20) throw new Error('Upstream returned too few models')

    cachedPrices = models
    cacheTime = now
    return { models, source: 'LiteLLM' }
  } catch {
    return { models: fallbackModelPrices, source: 'fallback' }
  }
}
