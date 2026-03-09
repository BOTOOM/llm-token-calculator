'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp } from 'lucide-react'
import type { UsageProjection } from '@/lib/types'
import { formatTokens } from '@/lib/calculator'

interface UsageProjectionsProps {
  usage: UsageProjection
  onChange: (usage: UsageProjection) => void
  inputTokens: number
}

export function UsageProjections({ usage, onChange, inputTokens }: UsageProjectionsProps) {
  const dailyTokens = (inputTokens + usage.outputTokensPerRequest) * usage.requestsPerDay
  const monthlyTokens = dailyTokens * usage.monthlyActiveDays

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm">
      <div className="mb-5 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-cyan-400" />
        <span className="text-sm font-medium text-white">Usage Projections</span>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
            Output Tokens per Request
          </Label>
          <Input
            type="number"
            value={usage.outputTokensPerRequest}
            onChange={(e) =>
              onChange({ ...usage, outputTokensPerRequest: Number(e.target.value) || 0 })
            }
            className="border-zinc-700 bg-zinc-800/50 text-white"
          />
          <p className="mt-1 text-xs text-zinc-600">Average length of the AI{"'"}s response</p>
        </div>

        <div>
          <Label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
            Requests per Day
          </Label>
          <Input
            type="number"
            value={usage.requestsPerDay}
            onChange={(e) =>
              onChange({ ...usage, requestsPerDay: Number(e.target.value) || 0 })
            }
            className="border-zinc-700 bg-zinc-800/50 text-white"
          />
        </div>

        <div>
          <Label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
            Monthly Active Days
          </Label>
          <Input
            type="number"
            value={usage.monthlyActiveDays}
            onChange={(e) =>
              onChange({ ...usage, monthlyActiveDays: Number(e.target.value) || 0 })
            }
            className="border-zinc-700 bg-zinc-800/50 text-white"
          />
        </div>

        <div className="border-t border-zinc-800 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Daily Tokens Total</span>
            <span className="font-semibold tabular-nums text-white">{formatTokens(dailyTokens)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-zinc-400">Monthly Tokens Total</span>
            <span className="font-semibold tabular-nums text-white">{formatTokens(monthlyTokens)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
