'use client'

import { cn } from '@/lib/utils'

interface TokenCountCardsProps {
  counts: {
    provider: string
    displayName: string
    tokens: number
    color: string
  }[]
}

const providerColors: Record<string, string> = {
  OpenAI: 'bg-emerald-500',
  Google: 'bg-blue-500',
  Mistral: 'bg-orange-500',
  Anthropic: 'bg-amber-500',
}

export function TokenCountCards({ counts }: TokenCountCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {counts.map((item) => (
        <div
          key={item.provider}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm transition-all hover:border-zinc-700"
        >
          <div className="mb-3 flex items-center gap-2">
            <div className={cn('h-2 w-2 rounded-full', providerColors[item.provider] || 'bg-zinc-500')} />
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {item.displayName}
            </span>
          </div>
          <div className="text-3xl font-bold tabular-nums text-white">
            {item.tokens.toLocaleString()}
          </div>
          <div className="mt-1 text-sm text-zinc-500">Tokens Estimated</div>
        </div>
      ))}
    </div>
  )
}
