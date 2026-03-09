'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Calculator, Search, AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-3xl dark:bg-cyan-500/10" />
      </div>

      {/* Grid pattern */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%23666' stroke-width='1'%3E%3Cpath d='M0 0h60v60H0z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* 404 Token Display */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card shadow-lg">
            <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-4xl font-bold text-transparent">
              4
            </span>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 shadow-lg">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card shadow-lg">
            <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-4xl font-bold text-transparent">
              4
            </span>
          </div>
        </div>

        {/* Message */}
        <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
          Token Not Found
        </h1>
        <p className="mb-2 max-w-md text-lg text-muted-foreground">
          Looks like this page exceeded its token budget and got truncated.
        </p>
        <p className="mb-8 text-sm text-muted-foreground/70">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Stats display - mimicking token counter */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card/50 px-4 py-3 text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Page Tokens
            </div>
            <div className="mt-1 text-2xl font-bold text-foreground">0</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 px-4 py-3 text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </div>
            <div className="mt-1 text-2xl font-bold text-red-500">404</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 px-4 py-3 text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Cost
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-500">$0.00</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/#calculator">
              <Calculator className="mr-2 h-4 w-4" />
              Start Calculating
            </Link>
          </Button>
        </div>

        {/* Fun token-related tip */}
        <div className="mt-12 flex max-w-sm items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-left">
          <Search className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-medium text-foreground">Pro Tip</p>
            <p className="text-xs text-muted-foreground">
              Unlike missing pages, every token in your LLM prompts counts toward your budget. 
              Use TokenBudget to optimize your API costs!
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Token<span className="text-emerald-500">Budget</span>
        </Link>
        {' '}&bull;{' '}
        <span>LLM Cost Calculator</span>
      </div>
    </div>
  )
}
