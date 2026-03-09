'use client'

import { Zap, TrendingDown, Brain } from 'lucide-react'
import type { CostEstimate } from '@/lib/types'
import { formatCurrency } from '@/lib/calculator'

interface CheapestOptionProps {
  cheapest: CostEstimate | null
  mostExpensive: CostEstimate | null
}

export function CheapestOption({ cheapest, mostExpensive }: CheapestOptionProps) {
  if (!cheapest) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">No data</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground/70">Enter a prompt to see cost recommendations</p>
      </div>
    )
  }

  const savings = mostExpensive ? mostExpensive.monthlyCost - cheapest.monthlyCost : 0
  const savingsPercent = mostExpensive && mostExpensive.monthlyCost > 0
    ? ((savings / mostExpensive.monthlyCost) * 100).toFixed(0)
    : 0

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-full bg-cyan-500/20 p-1.5">
          <Zap className="h-4 w-4 text-cyan-500" />
        </div>
        <span className="text-sm font-medium text-foreground">Cheapest Option</span>
      </div>

      <div className="mb-1 flex items-center gap-2">
        <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{cheapest.displayName}</span>
        {cheapest.isReasoning && (
          <Brain className="h-4 w-4 text-purple-500 dark:text-purple-400" />
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {cheapest.provider} | Cost optimized for your usage
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Monthly Cost</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {formatCurrency(cheapest.monthlyCost)}
          </div>
        </div>
        {savings > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">vs Expensive</div>
            <div className="mt-1 flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-emerald-500" />
              <span className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {savingsPercent}%
              </span>
            </div>
          </div>
        )}
      </div>

      {savings > 0 && (
        <div className="mt-4 rounded-lg bg-emerald-500/10 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Monthly savings vs {mostExpensive?.displayName}</span>
            <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              -{formatCurrency(savings)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Cost per request</span>
          <span className="tabular-nums text-foreground">{formatCurrency(cheapest.costPerRequest)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Daily cost</span>
          <span className="tabular-nums text-foreground">{formatCurrency(cheapest.dailyCost)}</span>
        </div>
      </div>
    </div>
  )
}
