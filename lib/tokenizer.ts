// Real tokenizer using js-tiktoken for accurate OpenAI token counting
// Falls back to estimation for other providers

import { encodingForModel, type TiktokenModel } from 'js-tiktoken'

export interface TokenizerResult {
  tokens: number
  isEstimate: boolean
  isLoading?: boolean
}

// Cache for tokenizer instances
const tokenizerCache: Map<string, ReturnType<typeof encodingForModel>> = new Map()

// Get or create a tiktoken encoder
function getEncoder(model: string) {
  if (tokenizerCache.has(model)) {
    return tokenizerCache.get(model)!
  }
  
  try {
    const encoder = encodingForModel(model as TiktokenModel)
    tokenizerCache.set(model, encoder)
    return encoder
  } catch {
    // Fallback to gpt-4o encoding for unknown models
    if (!tokenizerCache.has('gpt-4o')) {
      const encoder = encodingForModel('gpt-4o')
      tokenizerCache.set('gpt-4o', encoder)
    }
    return tokenizerCache.get('gpt-4o')!
  }
}

// Quick estimation (used for instant feedback)
export function estimateTokens(text: string): number {
  if (!text) return 0
  // More accurate estimation: ~4 chars per token for English
  // Accounting for whitespace and punctuation
  const words = text.split(/\s+/).filter(Boolean)
  const avgTokensPerWord = 1.3
  return Math.ceil(words.length * avgTokensPerWord)
}

// Real token counting using tiktoken (OpenAI models)
export function countTokensReal(text: string, model: string = 'gpt-4o'): number {
  if (!text) return 0
  
  try {
    const encoder = getEncoder(model)
    const tokens = encoder.encode(text)
    return tokens.length
  } catch (error) {
    console.warn('Tiktoken encoding failed, using estimation:', error)
    return estimateTokens(text)
  }
}

// Provider-specific multipliers for estimation
// These adjust the base estimation for different tokenizers
const providerMultipliers: Record<string, number> = {
  'openai': 1.0,
  'anthropic': 0.95, // Claude tends to have slightly fewer tokens
  'google': 1.05, // Gemini tends to have slightly more tokens
  'mistral': 1.0,
  'aws bedrock': 1.0,
  'deepseek': 1.0,
  'qwen': 1.02,
  'meta': 1.0,
  'groq': 1.0,
}

// Count tokens with provider-specific adjustments
export function countTokens(
  text: string, 
  provider: string = 'openai',
  useRealCount: boolean = true
): TokenizerResult {
  if (!text) {
    return { tokens: 0, isEstimate: false }
  }
  
  const providerLower = provider.toLowerCase()
  
  // For OpenAI, use real tiktoken counting
  if (providerLower === 'openai' && useRealCount) {
    try {
      const tokens = countTokensReal(text, 'gpt-4o')
      return { tokens, isEstimate: false }
    } catch {
      // Fall through to estimation
    }
  }
  
  // For other providers, use adjusted estimation
  const baseEstimate = estimateTokens(text)
  const multiplier = providerMultipliers[providerLower] || 1.0
  
  // If OpenAI real count is available, use it as base
  let adjustedTokens: number
  if (useRealCount) {
    try {
      const realCount = countTokensReal(text, 'gpt-4o')
      adjustedTokens = Math.round(realCount * multiplier)
      return { tokens: adjustedTokens, isEstimate: providerLower !== 'openai' }
    } catch {
      // Fall through to estimation
    }
  }
  
  adjustedTokens = Math.round(baseEstimate * multiplier)
  return { tokens: adjustedTokens, isEstimate: true }
}

// Async version for heavier workloads (can be used with web workers in future)
export async function countTokensAsync(
  text: string,
  provider: string = 'openai'
): Promise<TokenizerResult> {
  // For now, just wrap the sync version
  // In the future, this could offload to a web worker
  return new Promise((resolve) => {
    // Use setTimeout to not block the main thread for very long texts
    setTimeout(() => {
      resolve(countTokens(text, provider))
    }, 0)
  })
}

// Batch count for multiple texts
export function countTokensBatch(
  texts: string[],
  provider: string = 'openai'
): TokenizerResult[] {
  return texts.map(text => countTokens(text, provider))
}
