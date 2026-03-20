import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ApiDocumentation } from '@/components/api-documentation'
import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tokenbudget.edwardiaz.dev'

export const metadata: Metadata = {
  title: 'API Documentation - Free LLM Token Cost API',
  description: 'Free REST API to calculate LLM token costs programmatically. Calculate costs for GPT-4, Claude, Gemini and 50+ models. No API key required, rate limited to 100 req/min.',
  keywords: [
    'LLM API',
    'token cost API',
    'GPT API pricing',
    'Claude API cost',
    'free LLM API',
    'token calculator API',
    'AI cost estimation API',
    'cached tokens API',
    'REST API LLM',
  ],
  openGraph: {
    title: 'TokenBudget API - Free LLM Token Cost Calculator API',
    description: 'Free REST API to calculate LLM token costs. No API key required. Supports GPT-4, Claude, Gemini and 50+ models.',
    url: `${BASE_URL}/docs`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TokenBudget API - Free LLM Token Cost Calculator',
    description: 'Free REST API to calculate LLM token costs. No API key required.',
  },
  alternates: {
    canonical: `${BASE_URL}/docs`,
  },
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-12">
        <ApiDocumentation />
      </main>
      <Footer />
    </div>
  )
}
