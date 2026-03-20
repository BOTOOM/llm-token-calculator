'use client'

import { Github, Menu, X, Heart, Code } from 'lucide-react'
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
        <linearGradient id="nav-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill="url(#nav-logo-grad)"/>
      <path d="M8 8h16v3H8z" fill="white" opacity="0.95"/>
      <path d="M14 11h4v13h-4z" fill="white" opacity="0.95"/>
      <circle cx="10" cy="20" r="2" fill="white" opacity="0.6"/>
      <circle cx="22" cy="20" r="2" fill="white" opacity="0.6"/>
      <circle cx="10" cy="14" r="1.5" fill="white" opacity="0.4"/>
      <circle cx="22" cy="14" r="1.5" fill="white" opacity="0.4"/>
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
            Token<span className="text-emerald-500">Budget</span>
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
          <a
            href="/docs"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Code className="h-3.5 w-3.5" />
            API
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
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600"
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
            <a
              href="/docs"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              <Code className="h-3.5 w-3.5" />
              API Documentation
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
              className="mt-2 w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
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
