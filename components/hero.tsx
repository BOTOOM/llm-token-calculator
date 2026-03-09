import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Github, Heart } from 'lucide-react'

const GITHUB_REPO = 'https://github.com/BOTOOM/llm-token-calculator'

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-20 md:pb-24 md:pt-32">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-20 h-80 w-80 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-blue-400/10 blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-6 border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Now supporting GPT-5.4, Gemini 3.1, Claude 4.6 & more
          </Badge>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            <span className="text-balance">Token Counter & Cost Calculator for</span>
            <span className="mt-2 block bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              LLM APIs
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-zinc-400 md:text-xl">
            Compare token usage and pricing across OpenAI, Anthropic, Google, Mistral, AWS Bedrock, and many more.
            Estimate project costs before you write a single line of code.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:from-blue-600 hover:to-cyan-500 sm:w-auto"
              asChild
            >
              <a href="#calculator">
                Start Calculating
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-zinc-700 bg-transparent text-white hover:bg-zinc-800 sm:w-auto"
              asChild
            >
              <a href="#how-it-works">Learn How It Works</a>
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-500">
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Github className="h-4 w-4" />
              Open Source
            </a>
            <span className="text-zinc-700">|</span>
            <a
              href="https://github.com/sponsors/BOTOOM"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-pink-400"
            >
              <Heart className="h-4 w-4" />
              Sponsor
            </a>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">50+ models supported</span>
          </div>
        </div>
      </div>
    </section>
  )
}
