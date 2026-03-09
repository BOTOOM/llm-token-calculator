'use client'

import { Calculator, Github, Menu, X, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const GITHUB_REPO = 'https://github.com/BOTOOM/llm-token-calculator'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const scrollToCalculator = () => {
    const element = document.getElementById('calculator')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">
            LLM<span className="text-cyan-400">Calc</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#calculator"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Calculator
          </a>
          <a
            href="#comparison"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Compare Models
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            How It Works
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-pink-400"
            asChild
          >
            <a
              href="https://github.com/sponsors/BOTOOM"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Sponsor"
            >
              <Heart className="mr-1.5 h-4 w-4" />
              Sponsor
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            asChild
          >
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:from-blue-600 hover:to-cyan-500"
            onClick={scrollToCalculator}
          >
            Start Calculating
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-white/10 bg-zinc-950 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <a
              href="#calculator"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Calculator
            </a>
            <a
              href="#comparison"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Compare Models
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </a>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 transition-colors hover:text-white"
              >
                GitHub
              </a>
              <a
                href="https://github.com/sponsors/BOTOOM"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-pink-400 transition-colors hover:text-pink-300"
              >
                <Heart className="mr-1 inline h-3.5 w-3.5" />
                Sponsor
              </a>
            </div>
            <Button
              className="mt-2 w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white"
              onClick={scrollToCalculator}
            >
              Start Calculating
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
