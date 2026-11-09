import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { Calculator } from '@/components/calculator'
import { HowItWorks } from '@/components/how-it-works'
import { Footer } from '@/components/footer'
import { getModelPrices } from '@/lib/price-fetcher'

export const revalidate = 3600
export const dynamic = 'force-static'

export default async function Home() {
  const { models } = await getModelPrices()
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero initialModels={models} />
        <Calculator initialModels={models} />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}
