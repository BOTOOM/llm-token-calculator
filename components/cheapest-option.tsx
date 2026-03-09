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
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-zinc-500">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">No data</span>
        </div>
        <p className="mt-2 text-sm text-zinc-600">Enter a prompt to see cost recommendations</p>
      </div>
    )
  }

  const savings = mostExpensive ? mostExpensive.monthlyCost - cheapest.monthlyCost : 0
  const savingsPercent = mostExpensive && mostExpensive.monthlyCost > 0
    ? ((savings / mostExpensive.monthlyCost) * 100).toFixed(0)
    : 0

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-full bg-cyan-500/20 p-1.5">
          <Zap className="h-4 w-4 text-cyan-400" />
        </div>
        <span className="text-sm font-medium text-white">Cheapest Option</span>
      </div>

      <div className="mb-1 flex items-center gap-2">
        <span className="text-2xl font-bold text-cyan-400">{cheapest.displayName}</span>
        {cheapest.isReasoning && (
          <Brain className="h-4 w-4 text-purple-400" />
        )}
      </div>
      <p className="mb-4 text-sm text-zinc-400">
        {cheapest.provider} | Cost optimized for your usage
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500">Monthly Cost</div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-white">
            {formatCurrency(cheapest.monthlyCost)}
          </div>
        </div>
        {savings > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">vs Expensive</div>
            <div className="mt-1 flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-emerald-400" />
              <span className="text-xl font-semibold tabular-nums text-emerald-400">
                {savingsPercent}%
              </span>
            </div>
          </div>
        )}
      </div>

      {savings > 0 && (
        <div className="mt-4 rounded-lg bg-emerald-500/10 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Monthly savings vs {mostExpensive?.displayName}</span>
            <span className="font-semibold tabular-nums text-emerald-400">
              -{formatCurrency(savings)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Cost per request</span>
          <span className="tabular-nums text-zinc-300">{formatCurrency(cheapest.costPerRequest)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
          <span>Daily cost</span>
          <span className="tabular-nums text-zinc-300">{formatCurrency(cheapest.dailyCost)}</span>
        </div>
      </div>
    </div>
  )
}
