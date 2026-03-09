'use client'

import { Zap } from 'lucide-react'
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

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-full bg-cyan-500/20 p-1.5">
          <Zap className="h-4 w-4 text-cyan-400" />
        </div>
        <span className="text-sm font-medium text-white">Cheapest Option</span>
      </div>

      <div className="mb-2 text-2xl font-bold text-cyan-400">{cheapest.displayName}</div>
      <p className="mb-4 text-sm text-zinc-400">
        Cost optimized for your current usage volume.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500">Monthly Cost</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-white">
            {formatCurrency(cheapest.monthlyCost)}
          </div>
        </div>
        {savings > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">Savings/Mo</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-emerald-400">
              -{formatCurrency(savings)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
