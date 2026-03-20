import { NextResponse } from 'next/server'
import type { ModelPrice, LiteLLMPricingResponse, LiteLLMModelData } from '@/lib/types'

const LITELLM_PRICING_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'

// Cache duration in seconds (1 hour)
const CACHE_DURATION = 3600

// Provider display name mapping
const providerMap: Record<string, string> = {
  'openai': 'OpenAI',
  'anthropic': 'Anthropic',
  'vertex_ai': 'Google',
  'vertex_ai-language-models': 'Google',
  'gemini': 'Google',
  'bedrock': 'AWS Bedrock',
  'bedrock_converse': 'AWS Bedrock',
  'mistral': 'Mistral',
  'together_ai': 'Together AI',
  'groq': 'Groq',
  'deepseek': 'DeepSeek',
  'fireworks_ai': 'Fireworks',
  'cohere': 'Cohere',
  'ai21': 'AI21',
  'replicate': 'Replicate',
  'perplexity': 'Perplexity',
}

// Models we want to include (curated list)
const includedModelPatterns = [
  // OpenAI
  /^gpt-4/, /^gpt-5/, /^o1/, /^o3/, /^o4/,
  // Anthropic
  /^claude-3/, /^claude-4/, /^claude-sonnet/, /^claude-opus/,
  // Google
  /^gemini-2/, /^gemini-3/,
  // Mistral
  /^mistral-large/, /^mistral-small/, /^codestral/, /^ministral/,
  // DeepSeek
  /^deepseek/,
  // Meta
  /^llama-4/, /^llama-3\.3/, /^llama3/,
  // Qwen
  /^qwen/, /^qwq/,
]

function getDisplayName(modelId: string): string {
  const cleanId = modelId
    .replace(/^(openai\/|anthropic\/|vertex_ai\/|bedrock\/|groq\/)/, '')
    .replace(/-20\d{6}$/, '')
    .replace(/:0$/, '')
  
  return cleanId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/Gpt/g, 'GPT')
    .replace(/^O(\d)/, 'o$1')
    .replace(/Gemini/g, 'Gemini')
    .replace(/Claude/g, 'Claude')
}

function shouldIncludeModel(modelId: string, data: LiteLLMModelData): boolean {
  if (data.mode && !['chat', 'completion'].includes(data.mode)) return false
  if (!data.input_cost_per_token && !data.output_cost_per_token) return false
  
  const cleanId = modelId.replace(/^(openai\/|anthropic\/|vertex_ai\/|bedrock\/|groq\/)/, '').toLowerCase()
  
  // Skip image/embedding/moderation models
  if (cleanId.includes('dall-e') || cleanId.includes('image') || cleanId.includes('embedding')) return false
  if (cleanId.includes('moderation') || cleanId.includes('tts') || cleanId.includes('whisper')) return false
  
  // Check against patterns
  return includedModelPatterns.some(pattern => pattern.test(cleanId))
}

function parseModelData(modelId: string, data: LiteLLMModelData): ModelPrice | null {
  if (!shouldIncludeModel(modelId, data)) return null
  
  const providerKey = data.litellm_provider?.toLowerCase() || 'unknown'
  const provider = providerMap[providerKey] || providerKey.charAt(0).toUpperCase() + providerKey.slice(1)
  
  const inputPricePer1M = (data.input_cost_per_token || 0) * 1_000_000
  const outputPricePer1M = (data.output_cost_per_token || 0) * 1_000_000
  const cachedInputPricePer1M = data.cache_read_input_token_cost 
    ? data.cache_read_input_token_cost * 1_000_000 
    : undefined
  
  if (inputPricePer1M === 0 && outputPricePer1M === 0) return null
  
  const cleanId = modelId.replace(/^(openai\/|anthropic\/|vertex_ai\/|bedrock\/|groq\/)/, '')
  
  return {
    provider,
    model: cleanId,
    displayName: getDisplayName(modelId),
    inputPricePer1M,
    outputPricePer1M,
    cachedInputPricePer1M,
    contextWindow: data.max_input_tokens || data.max_tokens,
    maxOutputTokens: data.max_output_tokens,
    supportsVision: data.supports_vision,
    supportsFunctionCalling: data.supports_function_calling,
    isReasoning: data.supports_reasoning || modelId.includes('o1') || modelId.includes('o3') || modelId.includes('reasoning'),
    isPopular: ['gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-2.0-flash', 'deepseek-chat'].some(m => modelId.includes(m)),
    isFlagship: ['gpt-5', 'claude-4', 'o3', 'gemini-3'].some(m => modelId.includes(m)),
  }
}

export async function GET() {
  try {
    const response = await fetch(LITELLM_PRICING_URL, {
      next: { revalidate: CACHE_DURATION },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch pricing data')
    }
    
    const data: LiteLLMPricingResponse = await response.json()
    
    const models: ModelPrice[] = []
    
    for (const [modelId, modelData] of Object.entries(data)) {
      if (modelId === 'sample_spec') continue
      
      const parsed = parseModelData(modelId, modelData)
      if (parsed) {
        const exists = models.some(m => m.model === parsed.model && m.provider === parsed.provider)
        if (!exists) {
          models.push(parsed)
        }
      }
    }
    
    models.sort((a, b) => {
      if (a.provider !== b.provider) return a.provider.localeCompare(b.provider)
      return a.displayName.localeCompare(b.displayName)
    })
    
    return NextResponse.json({
      models,
      source: 'LiteLLM',
      cacheMaxAge: CACHE_DURATION,
      note: `Prices are cached for ${CACHE_DURATION / 60} minutes and sourced from LiteLLM's pricing database`,
    }, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
      }
    })
  } catch (error) {
    console.error('Error fetching model prices:', error)
    
    const { fallbackModelPrices } = await import('@/lib/model-prices')
    
    return NextResponse.json({
      models: fallbackModelPrices,
      source: 'fallback',
      cacheMaxAge: CACHE_DURATION,
      note: 'Using fallback pricing data. Live prices temporarily unavailable.',
    })
  }
}
