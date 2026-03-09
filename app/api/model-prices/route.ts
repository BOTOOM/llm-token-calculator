import { NextResponse } from 'next/server'
import { modelPrices } from '@/lib/model-prices'

export const revalidate = 86400 // Revalidate every 24 hours

export async function GET() {
  // In a production environment, you could fetch from external pricing APIs
  // For now, we use the maintained static dataset
  return NextResponse.json({
    prices: modelPrices,
    lastUpdated: new Date().toISOString(),
  })
}
