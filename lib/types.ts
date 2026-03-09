export interface ModelPrice {
  provider: string
  model: string
  displayName: string
  inputPricePer1M: number  // Price per 1M tokens (standard format)
  outputPricePer1M: number
  cachedInputPricePer1M?: number
  contextWindow?: number
  maxOutputTokens?: number
  isPopular?: boolean
  isFlagship?: boolean
  isReasoning?: boolean
  supportsVision?: boolean
  supportsFunctionCalling?: boolean
}

export interface TokenCount {
  provider: string
  displayName: string
  tokens: number
  isLoading?: boolean
  isEstimate?: boolean
}

export interface CostEstimate {
  provider: string
  model: string
  displayName: string
  inputTokens: number
  outputTokens: number
  costPerRequest: number
  dailyCost: number
  monthlyCost: number
  inputPricePer1M: number
  outputPricePer1M: number
  isPopular?: boolean
  isFlagship?: boolean
  isReasoning?: boolean
}

export interface UsageProjection {
  outputTokensPerRequest: number
  requestsPerDay: number
  monthlyActiveDays: number
}

export interface TokenInputMode {
  type: 'text' | 'number'
  value: string | number
}

export type SortField = 'model' | 'provider' | 'inputPricePer1M' | 'outputPricePer1M' | 'costPerRequest' | 'monthlyCost'
export type SortDirection = 'asc' | 'desc'

// LiteLLM API response types
export interface LiteLLMModelData {
  input_cost_per_token?: number
  output_cost_per_token?: number
  max_input_tokens?: number
  max_output_tokens?: number
  max_tokens?: number
  litellm_provider?: string
  mode?: string
  supports_vision?: boolean
  supports_function_calling?: boolean
  supports_reasoning?: boolean
  cache_read_input_token_cost?: number
}

export interface LiteLLMPricingResponse {
  [modelId: string]: LiteLLMModelData
}
