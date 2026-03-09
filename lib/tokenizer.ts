// Tokenizer abstraction layer for different model providers
// Uses a simple approximation that works well for most models

export interface Tokenizer {
  encode: (text: string) => number[]
  count: (text: string) => number
}

// Simple tokenizer that approximates token count
// Most LLMs use ~4 characters per token on average for English text
// This is a reasonable approximation that avoids heavy dependencies
function createSimpleTokenizer(charsPerToken: number = 4): Tokenizer {
  return {
    encode: (text: string) => {
      const tokenCount = Math.ceil(text.length / charsPerToken)
      return Array.from({ length: tokenCount }, (_, i) => i)
    },
    count: (text: string) => {
      if (!text) return 0
      // More accurate estimation considering whitespace and punctuation
      const words = text.split(/\s+/).filter(Boolean)
      const avgTokensPerWord = 1.3 // Most words are 1-2 tokens
      return Math.ceil(words.length * avgTokensPerWord)
    },
  }
}

// Provider-specific tokenizer configurations
// Different models may have slightly different tokenization
const tokenizerConfigs: Record<string, { charsPerToken: number }> = {
  'openai': { charsPerToken: 4 },
  'google': { charsPerToken: 4.2 },
  'mistral': { charsPerToken: 4 },
  'anthropic': { charsPerToken: 3.8 },
}

class TokenizerRegistry {
  private tokenizers: Map<string, Tokenizer> = new Map()

  getTokenizer(provider: string, _model?: string): Tokenizer {
    const key = provider.toLowerCase()
    
    if (!this.tokenizers.has(key)) {
      const config = tokenizerConfigs[key] || { charsPerToken: 4 }
      this.tokenizers.set(key, createSimpleTokenizer(config.charsPerToken))
    }
    
    return this.tokenizers.get(key)!
  }

  countTokens(text: string, provider: string, model?: string): number {
    const tokenizer = this.getTokenizer(provider, model)
    return tokenizer.count(text)
  }
}

export const tokenizerRegistry = new TokenizerRegistry()

// Helper function for easy token counting
export function countTokens(text: string, provider: string = 'openai'): number {
  return tokenizerRegistry.countTokens(text, provider)
}
