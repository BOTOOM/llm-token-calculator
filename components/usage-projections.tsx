'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp, Info } from 'lucide-react'
import type { UsageProjection } from '@/lib/types'
import { formatTokens } from '@/lib/calculator'

interface UsageProjectionsProps {
  usage: UsageProjection
  onChange: (usage: UsageProjection) => void
  inputTokens: number
  outputMode?: 'text' | 'number'
}

export function UsageProjections({ usage, onChange, inputTokens, outputMode = 'number' }: UsageProjectionsProps) {
  const dailyTokens = (inputTokens + usage.outputTokensPerRequest) * usage.requestsPerDay
  const monthlyTokens = dailyTokens * usage.monthlyActiveDays

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-cyan-500" />
        <span className="text-sm font-medium text-foreground">Usage Projections</span>
      </div>

      <div className="space-y-4">
        {outputMode === 'number' && (
          <div>
            <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
              Output Tokens per Request
            </Label>
            <Input
              type="number"
              value={usage.outputTokensPerRequest}
              onChange={(e) =>
                onChange({ ...usage, outputTokensPerRequest: Number(e.target.value) || 0 })
              }
              className="bg-muted/30"
            />
            <p className="mt-1 text-xs text-muted-foreground">Average length of AI response</p>
          </div>
        )}

        {outputMode === 'text' && (
          <div className="rounded-lg bg-cyan-500/5 p-3">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 text-cyan-500" />
              <div>
                <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400">Output from Text</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Using {usage.outputTokensPerRequest.toLocaleString()} tokens from your pasted output text
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
            Requests per Day
          </Label>
          <Input
            type="number"
            value={usage.requestsPerDay}
            onChange={(e) =>
              onChange({ ...usage, requestsPerDay: Number(e.target.value) || 0 })
            }
            className="bg-muted/30"
          />
        </div>

        <div>
          <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
            Monthly Active Days
          </Label>
          <Input
            type="number"
            value={usage.monthlyActiveDays}
            onChange={(e) =>
              onChange({ ...usage, monthlyActiveDays: Number(e.target.value) || 0 })
            }
            className="bg-muted/30"
            max={31}
          />
        </div>

        <div className="border-t border-border pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Input Tokens</span>
              <span className="font-medium tabular-nums text-foreground">{formatTokens(inputTokens)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Output Tokens</span>
              <span className="font-medium tabular-nums text-foreground">{formatTokens(usage.outputTokensPerRequest)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Tokens/Request</span>
              <span className="font-medium tabular-nums text-foreground">{formatTokens(inputTokens + usage.outputTokensPerRequest)}</span>
            </div>
          </div>
          
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Daily Tokens</span>
              <span className="font-semibold tabular-nums text-foreground">{formatTokens(dailyTokens)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly Tokens</span>
              <span className="font-semibold tabular-nums text-cyan-600 dark:text-cyan-400">{formatTokens(monthlyTokens)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
