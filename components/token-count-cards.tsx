'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TokenCount {
  provider: string
  displayName: string
  tokens: number
  isLoading?: boolean
  isEstimate?: boolean
  color?: string
}

interface TokenCountCardsProps {
  counts: TokenCount[]
}

const colorClasses: Record<string, { dot: string; badge: string }> = {
  emerald: { dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  blue: { dot: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  orange: { dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  amber: { dot: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  purple: { dot: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  cyan: { dot: 'bg-cyan-500', badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
  rose: { dot: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
}

const defaultColor = colorClasses.emerald

export function TokenCountCards({ counts }: TokenCountCardsProps) {
  if (counts.every(c => c.tokens === 0)) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {counts.map((count) => {
          const colors = colorClasses[count.color || 'emerald'] || defaultColor
          return (
            <div
              key={count.provider}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                <span className="truncate uppercase tracking-wider">{count.displayName}</span>
              </div>
              <div className="mt-2 text-2xl font-bold tabular-nums text-muted-foreground/50">
                --
              </div>
              <div className="mt-1 text-xs text-muted-foreground/70">Tokens Estimated</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {counts.map((count) => {
        const colors = colorClasses[count.color || 'emerald'] || defaultColor
        return (
          <div
            key={count.provider}
            className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
              <span className="truncate uppercase tracking-wider">{count.displayName}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              {count.isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  {count.tokens.toLocaleString()}
                </span>
              )}
              {count.isEstimate && !count.isLoading && (
                <span className="text-xs text-muted-foreground">~</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Tokens {count.isEstimate ? 'Estimated' : 'Counted'}</span>
              {!count.isEstimate && !count.isLoading && (
                <span className={cn('rounded px-1 py-0.5 text-[10px] font-medium', colors.badge)}>
                  Exact
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
