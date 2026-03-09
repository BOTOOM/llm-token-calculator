import type { ModelPrice, CostEstimate, UsageProjection } from './types'
import { countTokens } from './tokenizer'

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  inputPricePer1M: number,
  outputPricePer1M: number
): number {
  return (inputTokens / 1_000_000) * inputPricePer1M + (outputTokens / 1_000_000) * outputPricePer1M
}

export function calculateCostEstimates(
  inputTokens: number,
  outputTokens: number,
  models: ModelPrice[],
  usage: UsageProjection
): CostEstimate[] {
  return models.map((model) => {
    const costPerRequest = calculateCost(
      inputTokens,
      outputTokens,
      model.inputPricePer1M,
      model.outputPricePer1M
    )
    
    const dailyRequests = usage.requestsPerDay
    const monthlyRequests = dailyRequests * usage.monthlyActiveDays
    
    return {
      provider: model.provider,
      model: model.model,
      displayName: model.displayName,
      inputTokens,
      outputTokens,
      costPerRequest,
      dailyCost: costPerRequest * dailyRequests,
      monthlyCost: costPerRequest * monthlyRequests,
      inputPricePer1M: model.inputPricePer1M,
      outputPricePer1M: model.outputPricePer1M,
      contextWindow: model.contextWindow,
      maxOutputTokens: model.maxOutputTokens,
      isPopular: model.isPopular,
      isFlagship: model.isFlagship,
      isReasoning: model.isReasoning,
      isCoding: model.isCoding,
      supportsVision: model.supportsVision,
      supportsFunctionCalling: model.supportsFunctionCalling,
      supportsStreaming: model.supportsStreaming,
      supportsJSON: model.supportsJSON,
      isMultimodal: model.isMultimodal,
      description: model.description,
    }
  })
}

export function findCheapestModel(estimates: CostEstimate[]): CostEstimate | null {
  if (estimates.length === 0) return null
  return estimates.reduce((cheapest, current) => 
    current.monthlyCost < cheapest.monthlyCost ? current : cheapest
  )
}

export function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`
  }
  if (value >= 1) {
    return `$${value.toFixed(2)}`
  }
  if (value >= 0.01) {
    return `$${value.toFixed(4)}`
  }
  if (value >= 0.0001) {
    return `$${value.toFixed(6)}`
  }
  return `$${value.toFixed(8)}`
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`
  }
  return value.toLocaleString()
}

export function formatPricePer1M(value: number): string {
  if (value >= 1) {
    return `$${value.toFixed(2)}`
  }
  if (value >= 0.01) {
    return `$${value.toFixed(3)}`
  }
  return `$${value.toFixed(4)}`
}

// Helper to count tokens for a given text and provider
export function getTokenCount(text: string, provider: string): number {
  const result = countTokens(text, provider)
  return result.tokens
}
