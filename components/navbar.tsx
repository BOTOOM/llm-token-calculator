'use client'

import { Github, Menu, X, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useState } from 'react'

const GITHUB_REPO = 'https://github.com/BOTOOM/llm-token-calculator'

function Logo({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 32 32" 
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#logo-grad)"/>
      <path d="M8 10h4v12H8V10z" fill="white" opacity="0.9"/>
      <path d="M14 10h4v12h-4V10z" fill="white" opacity="0.7"/>
      <path d="M20 10h4v8h-4v-8z" fill="white" opacity="0.5"/>
      <path d="M8 23h16v1H8v-1z" fill="white" opacity="0.4"/>
    </svg>
  )
}

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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="/" className="flex items-center gap-3">
          <Logo className="h-9 w-9" />
          <span className="text-lg font-semibold text-foreground">
            Tokon<span className="text-cyan-500">omics</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#calculator"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Calculator
          </a>
          <a
            href="#comparison"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Compare Models
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </a>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-pink-500"
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
            className="text-muted-foreground hover:text-foreground"
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
          <ThemeToggle />
          <Button
            className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:from-blue-600 hover:to-cyan-500"
            onClick={scrollToCalculator}
          >
            Start Calculating
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <a
              href="#calculator"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Calculator
            </a>
            <a
              href="#comparison"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Compare Models
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </a>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                GitHub
              </a>
              <a
                href="https://github.com/sponsors/BOTOOM"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-pink-500 transition-colors hover:text-pink-400"
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
