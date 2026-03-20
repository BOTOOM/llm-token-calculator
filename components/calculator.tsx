'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { TokenInput } from './token-input'
import { TokenCountCards } from './token-count-cards'
import { UsageProjections } from './usage-projections'
import { CheapestOption } from './cheapest-option'
import { ComparisonTable } from './comparison-table'
import { countTokens, estimateTokens } from '@/lib/tokenizer'
import { calculateCostEstimates, findCheapestModel } from '@/lib/calculator'
import { fallbackModelPrices } from '@/lib/model-prices'
import type { UsageProjection, ModelPrice } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function Calculator() {
  const [inputText, setInputText] = useState('')
  const [inputTokensManual, setInputTokensManual] = useState(1000)
  const [inputMode, setInputMode] = useState<'text' | 'number'>('text')
  
  const [outputText, setOutputText] = useState('')
  const [outputTokensManual, setOutputTokensManual] = useState(500)
  const [outputMode, setOutputMode] = useState<'text' | 'number'>('number')
  
  const [cachedTokens, setCachedTokens] = useState(0)
  
  const [isCalculating, setIsCalculating] = useState(false)
  
  const [usage, setUsage] = useState<UsageProjection>({
    outputTokensPerRequest: 500,
    requestsPerDay: 1000,
    monthlyActiveDays: 30,
  })

  // Fetch model prices from API
  const { data: priceData } = useSWR('/api/model-prices', fetcher, {
    fallbackData: { models: fallbackModelPrices, source: 'fallback' },
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  const models: ModelPrice[] = priceData?.models || fallbackModelPrices

  // Calculate token counts with debounce for real counting
  const [inputTokenCounts, setInputTokenCounts] = useState<{ provider: string; displayName: string; tokens: number; isEstimate: boolean }[]>([])
  const [outputTokenCount, setOutputTokenCount] = useState(0)

  // Quick estimate for immediate feedback
  const quickInputEstimate = useMemo(() => estimateTokens(inputText), [inputText])
  const quickOutputEstimate = useMemo(() => estimateTokens(outputText), [outputText])

  // Real token counting with debounce
  const calculateRealTokens = useCallback(() => {
    if (inputMode === 'number' && outputMode === 'number') {
      setInputTokenCounts([])
      setOutputTokenCount(0)
      setIsCalculating(false)
      return
    }

    const hasInputText = inputMode === 'text' && inputText
    const hasOutputText = outputMode === 'text' && outputText

    if (!hasInputText && !hasOutputText) {
      setInputTokenCounts([])
      setOutputTokenCount(0)
      setIsCalculating(false)
      return
    }

    setIsCalculating(true)

    setTimeout(() => {
      const providers = [
        { provider: 'OpenAI', displayName: 'OpenAI (Tiktoken)' },
        { provider: 'Anthropic', displayName: 'Anthropic (Claude)' },
        { provider: 'Google', displayName: 'Google (Gemini)' },
        { provider: 'Mistral', displayName: 'Mistral' },
      ]

      if (hasInputText) {
        const counts = providers.map((p) => {
          const result = countTokens(inputText, p.provider)
          return {
            ...p,
            tokens: result.tokens,
            isEstimate: result.isEstimate,
          }
        })
        setInputTokenCounts(counts)
      }

      if (hasOutputText) {
        const outputResult = countTokens(outputText, 'OpenAI')
        setOutputTokenCount(outputResult.tokens)
      }

      setIsCalculating(false)
    }, 100)
  }, [inputText, outputText, inputMode, outputMode])

  // Debounced real calculation
  useEffect(() => {
    const timer = setTimeout(calculateRealTokens, 300)
    return () => clearTimeout(timer)
  }, [calculateRealTokens])

  // Get the effective input tokens
  const effectiveInputTokens = useMemo(() => {
    if (inputMode === 'number') {
      return inputTokensManual
    }
    if (inputTokenCounts.length > 0) {
      return Math.round(inputTokenCounts.reduce((sum, t) => sum + t.tokens, 0) / inputTokenCounts.length)
    }
    return quickInputEstimate
  }, [inputMode, inputTokensManual, inputTokenCounts, quickInputEstimate])

  // Get the effective output tokens
  const effectiveOutputTokens = useMemo(() => {
    if (outputMode === 'number') {
      return outputTokensManual
    }
    return outputTokenCount || quickOutputEstimate
  }, [outputMode, outputTokensManual, outputTokenCount, quickOutputEstimate])

  // Update usage when output tokens change
  useEffect(() => {
    setUsage(prev => ({
      ...prev,
      outputTokensPerRequest: effectiveOutputTokens,
    }))
  }, [effectiveOutputTokens])

  // Calculate cost estimates for all models (including cached tokens)
  const costEstimates = useMemo(() => {
    // For now, cachedTokens reduce the effective input cost
    // In a more sophisticated version, we'd use cachedInputPricePer1M where available
    const effectiveInput = Math.max(0, effectiveInputTokens - cachedTokens)
    return calculateCostEstimates(effectiveInput, effectiveOutputTokens, models, usage)
  }, [effectiveInputTokens, effectiveOutputTokens, cachedTokens, models, usage])

  // Find cheapest and most expensive models
  const cheapestModel = useMemo(() => findCheapestModel(costEstimates), [costEstimates])
  const mostExpensiveModel = useMemo(() => {
    if (costEstimates.length === 0) return null
    return costEstimates.reduce((max, e) => (e.monthlyCost > max.monthlyCost ? e : max))
  }, [costEstimates])

  // Token count cards with loading state
  const tokenCountsForCards = useMemo(() => {
    if (inputMode === 'number') {
      return [
        { provider: 'Manual', displayName: 'Manual Input', tokens: inputTokensManual, isLoading: false, isEstimate: false, color: 'cyan' },
      ]
    }

    if (inputTokenCounts.length > 0) {
      return inputTokenCounts.map(t => ({
        provider: t.provider,
        displayName: t.displayName,
        tokens: t.tokens,
        isLoading: isCalculating,
        isEstimate: t.isEstimate,
        color: t.provider === 'OpenAI' ? 'emerald' : 
               t.provider === 'Anthropic' ? 'amber' :
               t.provider === 'Google' ? 'blue' : 'orange',
      }))
    }
    
    if (inputText) {
      return [
        { provider: 'OpenAI', displayName: 'OpenAI (Tiktoken)', tokens: quickInputEstimate, isLoading: isCalculating, isEstimate: true, color: 'emerald' },
        { provider: 'Anthropic', displayName: 'Anthropic (Claude)', tokens: Math.round(quickInputEstimate * 0.95), isLoading: isCalculating, isEstimate: true, color: 'amber' },
        { provider: 'Google', displayName: 'Google (Gemini)', tokens: Math.round(quickInputEstimate * 1.05), isLoading: isCalculating, isEstimate: true, color: 'blue' },
        { provider: 'Mistral', displayName: 'Mistral', tokens: quickInputEstimate, isLoading: isCalculating, isEstimate: true, color: 'orange' },
      ]
    }

    return []
  }, [inputMode, inputTokensManual, inputTokenCounts, quickInputEstimate, isCalculating, inputText])

  return (
    <section id="calculator" className="py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Calculate Your Token Costs
          </h2>
          <p className="mt-2 text-muted-foreground">
            Follow the steps below to get accurate cost estimates for your LLM usage
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main input area with steps */}
          <div className="lg:col-span-2">
            <TokenInput
              inputText={inputText}
              onInputChange={setInputText}
              inputTokens={inputTokensManual}
              onInputTokensChange={setInputTokensManual}
              inputMode={inputMode}
              onInputModeChange={setInputMode}
              outputText={outputText}
              onOutputChange={setOutputText}
              outputTokens={outputTokensManual}
              onOutputTokensChange={setOutputTokensManual}
              outputMode={outputMode}
              onOutputModeChange={setOutputMode}
              cachedTokens={cachedTokens}
              onCachedTokensChange={setCachedTokens}
              inputTokenCount={effectiveInputTokens}
              outputTokenCount={outputTokenCount || quickOutputEstimate}
              isCalculating={isCalculating}
            />
            
            {/* Token count cards - only show when using text mode */}
            {inputMode === 'text' && tokenCountsForCards.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-xs font-bold text-white">
                    4
                  </span>
                  <span className="text-sm font-medium text-foreground">Token Count by Provider</span>
                </div>
                <TokenCountCards counts={tokenCountsForCards} />
              </div>
            )}
          </div>

          {/* Sidebar with projections and recommendation */}
          <div className="space-y-6">
            <UsageProjections
              usage={usage}
              onChange={setUsage}
              inputTokens={effectiveInputTokens}
              outputMode={outputMode}
            />
            <CheapestOption
              cheapest={cheapestModel}
              mostExpensive={mostExpensiveModel}
            />
          </div>
        </div>

        {/* Comparison table */}
        <div id="comparison" className="mt-12">
          <ComparisonTable 
            estimates={costEstimates} 
            priceSource={priceData?.source}
            lastUpdated={priceData?.lastUpdated}
          />
        </div>
      </div>
    </section>
  )
}
