import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ApiDocumentation } from '@/components/api-documentation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Documentation - TokenBudget',
  description: 'Learn how to use the TokenBudget API to calculate LLM token costs programmatically. Rate limits, endpoints, and examples.',
  openGraph: {
    title: 'API Documentation - TokenBudget',
    description: 'Calculate LLM token costs programmatically with the TokenBudget API.',
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
