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
  emerald: { dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400' },
  blue: { dot: 'bg-blue-400', badge: 'bg-blue-500/10 text-blue-400' },
  orange: { dot: 'bg-orange-400', badge: 'bg-orange-500/10 text-orange-400' },
  amber: { dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-400' },
  purple: { dot: 'bg-purple-400', badge: 'bg-purple-500/10 text-purple-400' },
}

export function TokenCountCards({ counts }: TokenCountCardsProps) {
  if (counts.every(c => c.tokens === 0)) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {counts.map((count) => {
          const colors = colorClasses[count.color || 'emerald']
          return (
            <div
              key={count.provider}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                <span className="truncate uppercase tracking-wider">{count.displayName}</span>
              </div>
              <div className="mt-2 text-2xl font-bold tabular-nums text-zinc-600">
                --
              </div>
              <div className="mt-1 text-xs text-zinc-600">Tokens Estimated</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {counts.map((count) => {
        const colors = colorClasses[count.color || 'emerald']
        return (
          <div
            key={count.provider}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700"
          >
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
              <span className="truncate uppercase tracking-wider">{count.displayName}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              {count.isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              ) : (
                <span className="text-2xl font-bold tabular-nums text-white">
                  {count.tokens.toLocaleString()}
                </span>
              )}
              {count.isEstimate && !count.isLoading && (
                <span className="text-xs text-zinc-600">~</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
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
