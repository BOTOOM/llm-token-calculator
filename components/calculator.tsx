'use client'

import { useState, useMemo } from 'react'
import { TokenInput } from './token-input'
import { TokenCountCards } from './token-count-cards'
import { UsageProjections } from './usage-projections'
import { CheapestOption } from './cheapest-option'
import { ComparisonTable } from './comparison-table'
import { countTokens } from '@/lib/tokenizer'
import { calculateCostEstimates, findCheapestModel } from '@/lib/calculator'
import { modelPrices } from '@/lib/model-prices'
import type { UsageProjection } from '@/lib/types'

export function Calculator() {
  const [promptText, setPromptText] = useState('')
  const [usage, setUsage] = useState<UsageProjection>({
    outputTokensPerRequest: 500,
    requestsPerDay: 1000,
    monthlyActiveDays: 30,
  })

  // Calculate token counts for different providers
  const tokenCounts = useMemo(() => {
    const providers = [
      { provider: 'OpenAI', displayName: 'OpenAI (Tiktoken)', color: 'emerald' },
      { provider: 'Google', displayName: 'Gemini (Vertex)', color: 'blue' },
      { provider: 'Mistral', displayName: 'Mistral (Codestral)', color: 'orange' },
      { provider: 'Anthropic', displayName: 'Anthropic (Claude)', color: 'amber' },
    ]

    return providers.map((p) => ({
      ...p,
      tokens: countTokens(promptText, p.provider),
    }))
  }, [promptText])

  // Get average input tokens for cost calculation
  const avgInputTokens = useMemo(() => {
    if (tokenCounts.length === 0) return 0
    return Math.round(tokenCounts.reduce((sum, t) => sum + t.tokens, 0) / tokenCounts.length)
  }, [tokenCounts])

  // Calculate cost estimates for all models
  const costEstimates = useMemo(() => {
    return calculateCostEstimates(promptText, usage.outputTokensPerRequest, modelPrices, usage)
  }, [promptText, usage])

  // Find cheapest and most expensive models
  const cheapestModel = useMemo(() => findCheapestModel(costEstimates), [costEstimates])
  const mostExpensiveModel = useMemo(() => {
    if (costEstimates.length === 0) return null
    return costEstimates.reduce((max, e) => (e.monthlyCost > max.monthlyCost ? e : max))
  }, [costEstimates])

  return (
    <section id="calculator" className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main input area */}
          <div className="lg:col-span-2">
            <TokenInput
              value={promptText}
              onChange={setPromptText}
            />
            
            {/* Token count cards */}
            <div className="mt-6">
              <TokenCountCards counts={tokenCounts} />
            </div>
          </div>

          {/* Sidebar with projections and recommendation */}
          <div className="space-y-6">
            <UsageProjections
              usage={usage}
              onChange={setUsage}
              inputTokens={avgInputTokens}
            />
            <CheapestOption
              cheapest={cheapestModel}
              mostExpensive={mostExpensiveModel}
            />
          </div>
        </div>

        {/* Comparison table */}
        <div id="comparison" className="mt-12">
          <ComparisonTable estimates={costEstimates} />
        </div>
      </div>
    </section>
  )
}
