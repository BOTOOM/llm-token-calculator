import type { ModelPrice, CostEstimate, UsageProjection } from './types'
import { countTokens } from './tokenizer'

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  inputPricePer1k: number,
  outputPricePer1k: number
): number {
  return (inputTokens / 1000) * inputPricePer1k + (outputTokens / 1000) * outputPricePer1k
}

export function calculateCostEstimates(
  inputText: string,
  outputTokens: number,
  models: ModelPrice[],
  usage: UsageProjection
): CostEstimate[] {
  return models.map((model) => {
    const inputTokens = countTokens(inputText, model.provider)
    const costPerRequest = calculateCost(
      inputTokens,
      outputTokens,
      model.inputPricePer1k,
      model.outputPricePer1k
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
      inputPricePer1k: model.inputPricePer1k,
      outputPricePer1k: model.outputPricePer1k,
      isPopular: model.isPopular,
      isFlagship: model.isFlagship,
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
  return `$${value.toFixed(6)}`
}

export function formatTokens(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`
  }
  return value.toString()
}
