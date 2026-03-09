export interface ModelPrice {
  provider: string
  model: string
  displayName: string
  inputPricePer1k: number
  outputPricePer1k: number
  contextWindow?: number
  isPopular?: boolean
  isFlagship?: boolean
}

export interface TokenCount {
  provider: string
  model: string
  displayName: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
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
  inputPricePer1k: number
  outputPricePer1k: number
  isPopular?: boolean
  isFlagship?: boolean
}

export interface UsageProjection {
  outputTokensPerRequest: number
  requestsPerDay: number
  monthlyActiveDays: number
}

export type SortField = 'model' | 'provider' | 'inputPricePer1k' | 'outputPricePer1k' | 'costPerRequest' | 'monthlyCost'
export type SortDirection = 'asc' | 'desc'
