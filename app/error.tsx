'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, RefreshCw, Bug, AlertTriangle, Zap } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-red-500/5 blur-3xl dark:bg-red-500/10" />
        <div className="absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-3xl dark:bg-orange-500/10" />
      </div>

      {/* Animated circuit pattern */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%23888' stroke-width='0.5'%3E%3Cpath d='M0 50h40M60 50h40M50 0v40M50 60v40'/%3E%3Ccircle cx='50' cy='50' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Error Icon Display */}
        <div className="mb-8 relative">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl border-2 border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10 shadow-xl">
            <AlertTriangle className="h-14 w-14 text-red-500" />
          </div>
          {/* Animated pulse rings */}
          <div className="absolute inset-0 animate-ping rounded-3xl border-2 border-red-500/20" style={{ animationDuration: '2s' }} />
          <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg">
            <Bug className="h-4 w-4" />
          </div>
        </div>

        {/* Message */}
        <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
          Token Overflow Error
        </h1>
        <p className="mb-2 max-w-md text-lg text-muted-foreground">
          Something went wrong while processing your request.
        </p>
        <p className="mb-8 text-sm text-muted-foreground/70">
          Don't worry, no tokens were harmed in this error.
        </p>

        {/* Error details - styled like a code block */}
        <div className="mb-8 w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-muted-foreground">error.log</span>
          </div>
          <div className="p-4 font-mono text-sm">
            <div className="flex items-center gap-2 text-red-500">
              <span className="text-muted-foreground">1</span>
              <span>{"{"} error: "UNEXPECTED_TOKEN_ERROR" {"}"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>2</span>
              <span>status: <span className="text-orange-500">500</span></span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>3</span>
              <span>message: <span className="text-foreground">"{error.message || 'An unexpected error occurred'}"</span></span>
            </div>
            {error.digest && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>4</span>
                <span>digest: <span className="text-cyan-500">"{error.digest}"</span></span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button 
            onClick={reset} 
            size="lg" 
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Helpful tip */}
        <div className="mt-12 flex max-w-sm items-start gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 text-left">
          <Zap className="mt-0.5 h-5 w-5 shrink-0 text-cyan-500" />
          <div>
            <p className="text-sm font-medium text-foreground">What happened?</p>
            <p className="text-xs text-muted-foreground">
              This error is temporary. Try refreshing the page or come back later. 
              If the problem persists, please report it on our GitHub repository.
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
        <Link 
          href="https://github.com/BOTOOM/llm-token-calculator/issues" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Report Issue
        </Link>
      </div>
    </div>
  )
}
