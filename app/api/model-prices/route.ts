import { NextResponse } from 'next/server'
import { getModelPrices, PRICE_CACHE_MAX_AGE } from '@/lib/price-fetcher'

export const revalidate = PRICE_CACHE_MAX_AGE

export async function GET() {
  const { models, source } = await getModelPrices()

  return NextResponse.json(
    {
      models,
      source,
      cacheMaxAge: PRICE_CACHE_MAX_AGE,
      note: `Prices are cached for ${PRICE_CACHE_MAX_AGE / 60} minutes and sourced from LiteLLM's pricing database`,
    },
    {
      headers: {
        'Cache-Control': `public, s-maxage=${PRICE_CACHE_MAX_AGE}, stale-while-revalidate=${PRICE_CACHE_MAX_AGE * 2}`,
      },
    },
  )
}
