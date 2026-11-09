import { fallbackModelPrices } from '@/lib/model-prices'
import { annotateModels, parseModelVersion } from '@/lib/model-selection'
import type { ModelPrice, LiteLLMPricingResponse, LiteLLMModelData } from '@/lib/types'

const LITELLM_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'

export const PRICE_CACHE_MAX_AGE = 3600 // seconds

// Module-level in-process cache shared across all API routes within the same serverless instance
let cachedPrices: ModelPrice[] | null = null
let cacheTime = 0

const providerNames: Record<string, string> = {
  openai: 'OpenAI',
  'text-completion-openai': 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google',
  palm: 'Google',
  xai: 'xAI',
  mistral: 'Mistral',
  codestral: 'Mistral',
  'text-completion-codestral': 'Mistral',
  deepseek: 'DeepSeek',
  groq: 'Groq',
  perplexity: 'Perplexity',
  cohere: 'Cohere',
  cohere_chat: 'Cohere',
  amazon_nova: 'Amazon',
  meta: 'Meta',
  meta_llama: 'Meta',
  ai21: 'AI21 Labs',
  moonshot: 'Moonshot AI',
  minimax: 'MiniMax',
  zai: 'Zhipu AI',
  snowflake: 'Snowflake',
  tencent: 'Tencent',
  qwen_ai_platform: 'Alibaba',
  dashscope: 'Alibaba',
  inception: 'Inception Labs',
  'text-completion-inception': 'Inception Labs',
  morph: 'Morph',
  v0: 'Vercel',
  cerebras: 'Cerebras',
  nlp_cloud: 'NLP Cloud',
  cognition: 'Cognition',
  friendliai: 'FriendliAI',
  bigmodel: 'Zhipu AI',
}

const RESALE_PROVIDERS = new Set([
  'openrouter', 'together_ai', 'deepinfra', 'groq', 'cerebras', 'friendliai',
  'fal_ai', 'novita', 'gmi', 'vercel_ai_gateway', 'empiriolabs', 'databricks',
  'kyma', 'aihubmix', 'nebius', 'qwencloud', 'github_copilot', 'oci',
  'cloudflare', 'replicate', 'baseten', 'inferenceapis', 'wandb', 'opencode_go',
  'ollama', 'lambda_ai', 'hyperbolic', 'nscale', 'llamagate', 'ovhcloud',
  'scaleway', 'aiand', 'aiml', 'gradient_ai', 'zerogpu', 'anyscale', 'sail',
  'libertai', 'tensormesh', 'clf_ai_gateway', 'wally', 'publicai', 'sambanova',
  'crusoe', 'sagemaker', 'pinstripes', 'lemonade', 'scx-ai', 'scaledown',
  'refuseless', 'abliteration', 'heroku', 'hostinger_router', 'nace', 'typesafe',
  'nvidia_nim', 'laya', 'openinfer', 'apiserpent', 'featherless_ai', 'darkbloom',
  'eu_jev', 'prism', 'chatgpt', 'microsoft_365_copilot',
])

function prettifyProvider(key: string): string {
  return key.split(/[-_]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function isResaleProvider(key: string): boolean {
  return /^(azure|vertex_ai|fireworks_ai)/.test(key) || RESALE_PROVIDERS.has(key)
}

// ─── Mixed-hosting platforms ─────────────────────────────────────────────────
// Bedrock and watsonx are umbrellas that re-host many companies' models
// (Anthropic, Meta, Mistral, Cohere, AI21, ...) which we already capture
// directly under their real company above — pulling those in again from here
// would just duplicate them under the wrong brand. But both platforms also
// carry each host's OWN first-party models, which appear nowhere else in the
// feed, so we parse the vendor segment out of the raw id and keep only those.
const BEDROCK_VENDOR_MAP: Record<string, string> = {
  amazon: 'Amazon', // Titan, Nova
  writer: 'Writer', // Palmyra
}
const WATSONX_VENDOR_MAP: Record<string, string> = {
  ibm: 'IBM', // Granite
  core42: 'Core42', // Jais
  sdaia: 'SDAIA', // Allam
}

// Resolve which company actually owns a model and the id fragment to clean.
// Returns null when the model belongs to a resale/infra platform we skip.
function resolveProviderAndId(rawId: string, data: LiteLLMModelData): { provider: string; workingId: string } | null {
  const key = (data.litellm_provider ?? '').toLowerCase()

  if (key === 'bedrock' || key === 'bedrock_converse' || key === 'bedrock_mantle') {
    let id = rawId.replace(/^bedrock\//i, '')
    id = id.replace(/^(us|eu|apac|au|jp|global|sa|ca|me)-gov-[a-z0-9-]+\//i, '')
    id = id.replace(/^(us|eu|apac|au|jp|global|sa|ca|me)\./i, '')
    id = id.replace(/^\d+-month-commitment\//i, '')
    const match = id.match(/^([a-z0-9]+)\.(.+)$/i)
    if (!match) return null
    const provider = BEDROCK_VENDOR_MAP[match[1].toLowerCase()]
    if (!provider) return null
    return { provider, workingId: match[2] }
  }

  if (key === 'watsonx') {
    const id = rawId.replace(/^watsonx\//i, '')
    const match = id.match(/^([a-z0-9]+)\/(.+)$/i)
    if (!match) return null
    const provider = WATSONX_VENDOR_MAP[match[1].toLowerCase()]
    if (!provider) return null
    return { provider, workingId: match[2] }
  }

  if (!key || key.includes('https://') || isResaleProvider(key)) return null
  return { provider: providerNames[key] ?? prettifyProvider(key), workingId: rawId }
}

// ─── Noise blocklist ───────────────────────────────────────────────────────────
// Non-chat endpoints that should never show up in a pricing comparison. Real
// model families (Gemma, GigaChat, etc.) are intentionally NOT excluded here —
// only actual non-text API modes are excluded.
const EXCLUDED_TERMS = [
  'dall-e', 'image', 'embedding', 'moderation', 'tts', 'whisper', 'realtime',
  'audio', 'transcribe', 'search-api',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    .replace(/\b\d+(?: \d+)+\b/g, version => version.replace(/ /g, '.'))
    .replace(/\bGpt\b/g, 'GPT')
    .replace(/\bLlama\b/g, 'Llama')
    .replace(/\bDeepseek\b/g, 'DeepSeek')
    .replace(/\bQwq\b/g, 'QwQ')
    .replace(/^O(\d)/, 'o$1')
    .replace(/\bAi\b/g, 'AI')
    .replace(/\b(?:a?\d+(?:\.\d+)?(?:x\d+(?:\.\d+)?)?b)\b/gi, size => size.replace(/b$/i, 'B'))
}

function addMirrorCounts(models: ModelPrice[], feed: LiteLLMPricingResponse): ModelPrice[] {
  const owners = new Map<string, Set<string>>()
  for (const model of models) {
    const { family } = parseModelVersion(model.model)
    for (const alias of [family, family.split('-')[0]]) {
      if (!alias) continue
      const providers = owners.get(alias) ?? new Set<string>()
      providers.add(model.provider)
      owners.set(alias, providers)
    }
  }
  const aliases = [...owners.entries()].map(([alias, providers]) => ({
    alias, providers,
    pattern: new RegExp(`^${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^a-z]|\\d)`, 'i'),
  })).sort((a, b) => b.alias.length - a.alias.length)
  const counts = new Map<string, number>()
  for (const [id, data] of Object.entries(feed)) {
    const key = (data.litellm_provider ?? '').toLowerCase()
    const mixedHost = /^(bedrock(?:_|$)|watsonx$)/.test(key)
    if (!isResaleProvider(key) && !mixedHost) continue
    if (mixedHost && resolveProviderAndId(id, data)) continue
    if (data.mode && !['chat', 'completion', 'responses'].includes(data.mode)) continue
    if (!data.input_cost_per_token && !data.output_cost_per_token) continue
    const modelId = id.split('/').pop()!.replace(/^(?:[a-z][a-z_-]*\.)+/i, '').replace(/_/g, '-')
    const match = aliases.find(({ pattern }) => pattern.test(modelId))
    if (!match || match.providers.size !== 1) continue
    const provider = [...match.providers][0]
    counts.set(provider, (counts.get(provider) ?? 0) + 1)
  }
  return models.map(model => ({ ...model, mirrorCount: counts.get(model.provider) ?? 0 }))
}

function shouldInclude(cleanId: string, data: LiteLLMModelData): boolean {
  if (data.mode && !['chat', 'completion', 'responses'].includes(data.mode)) return false
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

  return true
}

function isReasoningModel(id: string, data: LiteLLMModelData): boolean {
  return Boolean(
    data.supports_reasoning ||
      /^o\d/.test(id) ||
      /reasoner|reasoning|-r\d|thinking|magistral|qwq/.test(id),
  )
}

function isCodingModel(id: string): boolean {
  return /codestral|coder|devstral|code(-|$)|codellama/.test(id)
}

function parseModel(modelId: string, data: LiteLLMModelData): ModelPrice | null {
  const resolved = resolveProviderAndId(modelId, data)
  if (!resolved) return null
  const { provider, workingId } = resolved

  const cleanId = cleanModelId(workingId)
  if (!shouldInclude(cleanId, data)) return null

  const inputPricePer1M = (data.input_cost_per_token ?? 0) * 1_000_000
  const outputPricePer1M = (data.output_cost_per_token ?? 0) * 1_000_000
  if (inputPricePer1M === 0 && outputPricePer1M === 0) return null

  const lowerId = cleanId.toLowerCase()
  const reasoning = isReasoningModel(lowerId, data)

  return {
    provider,
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
    supportsStreaming: data.mode === 'chat' || data.mode === 'responses' || data.mode === undefined,
    supportsJSON: Boolean(data.supports_response_schema),
    isMultimodal: data.supports_vision,
    isReasoning: reasoning,
    isCoding: isCodingModel(lowerId),
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
    const res = await fetch(LITELLM_URL, { cache: 'no-store' })
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

    const models = annotateModels(addMirrorCounts([...byKey.values()], data)).sort((a, b) =>
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
    return { models: annotateModels(fallbackModelPrices), source: 'fallback' }
  }
}
