export interface ModelCapabilities {
  supportsVision?: boolean
  supportsFunctionCalling?: boolean
  supportsStreaming?: boolean
  supportsJSON?: boolean
  isReasoning?: boolean
  isCoding?: boolean
  isMultimodal?: boolean
}

export interface ModelPrice extends ModelCapabilities {
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
  description?: string
}

export interface TokenCount {
  provider: string
  displayName: string
  tokens: number
  isLoading?: boolean
  isEstimate?: boolean
}

export interface CostEstimate extends ModelCapabilities {
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
  contextWindow?: number
  maxOutputTokens?: number
  isPopular?: boolean
  isFlagship?: boolean
  description?: string
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

export type SortField = 'model' | 'provider' | 'inputPricePer1M' | 'outputPricePer1M' | 'costPerRequest' | 'monthlyCost' | 'contextWindow'
export type SortDirection = 'asc' | 'desc'

export type CapabilityFilter = 
  | 'supportsVision'
  | 'supportsFunctionCalling'
  | 'supportsStreaming'
  | 'supportsJSON'
  | 'isReasoning'
  | 'isCoding'
  | 'isMultimodal'

export interface ContextWindowFilter {
  min?: number
  max?: number
  label: string
}

export const CONTEXT_WINDOW_FILTERS: ContextWindowFilter[] = [
  { label: 'All Sizes' },
  { min: 0, max: 32000, label: '< 32K' },
  { min: 32000, max: 128000, label: '32K - 128K' },
  { min: 128000, max: 256000, label: '128K - 256K' },
  { min: 256000, max: 1000000, label: '256K - 1M' },
  { min: 1000000, label: '> 1M' },
]

export const CAPABILITY_LABELS: Record<CapabilityFilter, { label: string; description: string }> = {
  supportsVision: { label: 'Vision', description: 'Can analyze images and visual content' },
  supportsFunctionCalling: { label: 'Functions', description: 'Supports function/tool calling' },
  supportsStreaming: { label: 'Streaming', description: 'Supports streaming responses' },
  supportsJSON: { label: 'JSON Mode', description: 'Native JSON output mode' },
  isReasoning: { label: 'Reasoning', description: 'Enhanced reasoning capabilities (Chain of Thought)' },
  isCoding: { label: 'Coding', description: 'Optimized for code generation' },
  isMultimodal: { label: 'Multimodal', description: 'Supports multiple input/output modalities' },
}

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
