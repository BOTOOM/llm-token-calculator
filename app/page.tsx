import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { Calculator } from '@/components/calculator'
import { HowItWorks } from '@/components/how-it-works'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Calculator />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}
