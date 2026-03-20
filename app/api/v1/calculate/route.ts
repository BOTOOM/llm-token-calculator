import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { fallbackModelPrices } from '@/lib/model-prices'
import type { ModelPrice } from '@/lib/types'

// Cache for model prices
let cachedPrices: ModelPrice[] | null = null
let cacheTime = 0
const CACHE_TTL = 3600000 // 1 hour

async function getModelPrices(): Promise<ModelPrice[]> {
  const now = Date.now()
  
  if (cachedPrices && (now - cacheTime) < CACHE_TTL) {
    return cachedPrices
  }
  
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json',
      { next: { revalidate: 3600 } }
    )
    
    if (!response.ok) throw new Error('Failed to fetch')
    
    const data = await response.json()
    
    // Parse and cache
    const prices: ModelPrice[] = []
    for (const [modelId, modelData] of Object.entries(data)) {
      if (modelId === 'sample_spec') continue
      const d = modelData as Record<string, unknown>
      
      const inputCost = (d.input_cost_per_token as number) || 0
      const outputCost = (d.output_cost_per_token as number) || 0
      const cacheCost = (d.cache_read_input_token_cost as number) || undefined
      
      if (inputCost === 0 && outputCost === 0) continue
      
      const cleanId = modelId.replace(/^(openai\/|anthropic\/|vertex_ai\/|bedrock\/|groq\/)/, '')
      
      prices.push({
        provider: (d.litellm_provider as string) || 'unknown',
        model: cleanId,
        displayName: cleanId,
        inputPricePer1M: inputCost * 1_000_000,
        outputPricePer1M: outputCost * 1_000_000,
        cachedInputPricePer1M: cacheCost ? cacheCost * 1_000_000 : undefined,
        contextWindow: (d.max_input_tokens as number) || (d.max_tokens as number),
        maxOutputTokens: d.max_output_tokens as number,
      })
    }
    
    cachedPrices = prices
    cacheTime = now
    return prices
  } catch {
    return fallbackModelPrices
  }
}

interface CalculateRequest {
  model: string
  inputTokens: number
  outputTokens: number
  cachedTokens?: number
}

interface CalculateResponse {
  model: string
  provider: string
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  costs: {
    input: number
    output: number
    cached: number
    total: number
  }
  prices: {
    inputPer1M: number
    outputPer1M: number
    cachedPer1M: number | null
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting: 100 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'anonymous'
  
  const rateLimitResult = rateLimit(`calculate:${ip}`, { limit: 100, windowMs: 60000 })
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult)
      }
    )
  }
  
  try {
    const body: CalculateRequest = await request.json()
    
    // Validate input
    if (!body.model || typeof body.model !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'model is required and must be a string' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }
    
    if (typeof body.inputTokens !== 'number' || body.inputTokens < 0) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'inputTokens must be a non-negative number' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }
    
    if (typeof body.outputTokens !== 'number' || body.outputTokens < 0) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'outputTokens must be a non-negative number' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }
    
    const cachedTokens = body.cachedTokens || 0
    
    // Get model prices
    const prices = await getModelPrices()
    const modelData = prices.find(p => 
      p.model.toLowerCase() === body.model.toLowerCase() ||
      p.displayName.toLowerCase() === body.model.toLowerCase()
    )
    
    if (!modelData) {
      return NextResponse.json(
        { 
          error: 'Model not found', 
          message: `Model "${body.model}" not found. Use GET /api/v1/models to see available models.` 
        },
        { status: 404, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }
    
    // Calculate costs
    const effectiveInputTokens = Math.max(0, body.inputTokens - cachedTokens)
    const inputCost = (effectiveInputTokens / 1_000_000) * modelData.inputPricePer1M
    const outputCost = (body.outputTokens / 1_000_000) * modelData.outputPricePer1M
    const cachedCost = modelData.cachedInputPricePer1M 
      ? (cachedTokens / 1_000_000) * modelData.cachedInputPricePer1M
      : 0
    
    const response: CalculateResponse = {
      model: modelData.model,
      provider: modelData.provider,
      inputTokens: body.inputTokens,
      outputTokens: body.outputTokens,
      cachedTokens,
      costs: {
        input: Number(inputCost.toFixed(8)),
        output: Number(outputCost.toFixed(8)),
        cached: Number(cachedCost.toFixed(8)),
        total: Number((inputCost + outputCost + cachedCost).toFixed(8)),
      },
      prices: {
        inputPer1M: modelData.inputPricePer1M,
        outputPer1M: modelData.outputPricePer1M,
        cachedPer1M: modelData.cachedInputPricePer1M || null,
      }
    }
    
    return NextResponse.json(response, {
      headers: {
        ...getRateLimitHeaders(rateLimitResult),
        'Cache-Control': 'no-store',
      }
    })
    
  } catch (error) {
    console.error('Calculate API error:', error)
    return NextResponse.json(
      { error: 'Invalid request', message: 'Could not parse request body' },
      { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
    )
  }
}

// Also support GET for simple queries
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'anonymous'
  
  const rateLimitResult = rateLimit(`calculate:${ip}`, { limit: 100, windowMs: 60000 })
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    )
  }
  
  const { searchParams } = new URL(request.url)
  const model = searchParams.get('model')
  const inputTokens = parseInt(searchParams.get('input') || '0', 10)
  const outputTokens = parseInt(searchParams.get('output') || '0', 10)
  const cachedTokens = parseInt(searchParams.get('cached') || '0', 10)
  
  if (!model) {
    return NextResponse.json(
      { error: 'Missing parameter', message: 'model query parameter is required' },
      { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
    )
  }
  
  // Reuse POST logic by creating a mock request
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ model, inputTokens, outputTokens, cachedTokens })
  })
  
  return POST(new NextRequest(mockRequest))
}
