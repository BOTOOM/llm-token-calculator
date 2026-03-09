'use client'

import { Calculator, Github, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
            size="icon"
            className="text-zinc-400 hover:text-white"
            asChild
          >
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:from-blue-600 hover:to-cyan-500"
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
            <Button
              className="mt-2 w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white"
            >
              Start Calculating
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
