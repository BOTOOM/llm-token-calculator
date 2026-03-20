import { fallbackModelPrices } from '@/lib/model-prices'
import type { ModelPrice } from '@/lib/types'

// Module-level cache shared across all API routes within the same serverless instance
let cachedPrices: ModelPrice[] | null = null
let cacheTime = 0
const CACHE_TTL_MS = 3_600_000 // 1 hour

export const PRICE_CACHE_MAX_AGE = 3600

export async function getModelPrices(): Promise<ModelPrice[]> {
  const now = Date.now()

  if (cachedPrices && now - cacheTime < CACHE_TTL_MS) {
    return cachedPrices
  }

  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json',
      { next: { revalidate: 3600 } }
    )

    if (!response.ok) throw new Error(`LiteLLM fetch failed: ${response.status}`)

    const data = await response.json()
    const prices: ModelPrice[] = []

    for (const [modelId, modelData] of Object.entries(data)) {
      if (modelId === 'sample_spec') continue
      const d = modelData as Record<string, unknown>

      const inputCost = (d.input_cost_per_token as number) || 0
      const outputCost = (d.output_cost_per_token as number) || 0
      if (inputCost === 0 && outputCost === 0) continue

      const cleanId = modelId.replace(
        /^(openai\/|anthropic\/|vertex_ai\/|bedrock\/|groq\/)/,
        ''
      )

      prices.push({
        provider: (d.litellm_provider as string) || 'unknown',
        model: cleanId,
        displayName: cleanId,
        inputPricePer1M: inputCost * 1_000_000,
        outputPricePer1M: outputCost * 1_000_000,
        cachedInputPricePer1M: d.cache_read_input_token_cost
          ? (d.cache_read_input_token_cost as number) * 1_000_000
          : undefined,
        contextWindow: (d.max_input_tokens as number) || (d.max_tokens as number),
        maxOutputTokens: d.max_output_tokens as number,
        supportsVision: d.supports_vision as boolean,
        supportsFunctionCalling: d.supports_function_calling as boolean,
        isReasoning:
          (d.supports_reasoning as boolean) ||
          modelId.includes('o1') ||
          modelId.includes('o3'),
      })
    }

    cachedPrices = prices
    cacheTime = now
    return prices
  } catch {
    // Graceful fallback — never crash a request due to upstream failure
    return fallbackModelPrices
  }
}
