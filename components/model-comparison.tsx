'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Plus,
  X,
  Check,
  Minus,
  Trophy,
  Eye,
  Wrench,
  Brain,
  Code,
  Layers,
  FileJson,
  Scale,
} from 'lucide-react'
import type { ModelPrice, UsageProjection, CapabilityFilter } from '@/lib/types'
import { calculateCost, formatCurrency, formatPricePer1M } from '@/lib/calculator'
import { CAPABILITY_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

const MAX_MODELS = 5

const CAPABILITY_ROWS: { key: CapabilityFilter; icon: React.ReactNode }[] = [
  { key: 'supportsVision', icon: <Eye className="h-3.5 w-3.5" /> },
  { key: 'supportsFunctionCalling', icon: <Wrench className="h-3.5 w-3.5" /> },
  { key: 'isReasoning', icon: <Brain className="h-3.5 w-3.5" /> },
  { key: 'isCoding', icon: <Code className="h-3.5 w-3.5" /> },
  { key: 'isMultimodal', icon: <Layers className="h-3.5 w-3.5" /> },
  { key: 'supportsJSON', icon: <FileJson className="h-3.5 w-3.5" /> },
]

function formatContextWindow(tokens?: number): string {
  if (!tokens) return '—'
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`
  return tokens.toString()
}

const modelKey = (m: Pick<ModelPrice, 'provider' | 'model'>) => `${m.provider}:${m.model}`

interface ModelComparisonProps {
  models: ModelPrice[]
  inputTokens: number
  outputTokens: number
  usage: UsageProjection
}

function pickDefaults(models: ModelPrice[]): string[] {
  const preferred = ['gpt-5', 'claude-opus-4-6', 'gemini-3-pro', 'grok-4.6', 'claude-opus-4-5']
  const seeded: string[] = []
  for (const id of preferred) {
    const found = models.find(m => m.model === id)
    if (found && !seeded.includes(modelKey(found))) seeded.push(modelKey(found))
    if (seeded.length >= 3) break
  }
  if (seeded.length < 3) {
    for (const m of models.filter(m => m.isFlagship)) {
      const k = modelKey(m)
      if (!seeded.includes(k)) seeded.push(k)
      if (seeded.length >= 3) break
    }
  }
  // Guaranteed non-empty fallback: just take the first available models.
  if (seeded.length === 0) {
    for (const m of models.slice(0, 3)) seeded.push(modelKey(m))
  }
  return seeded.slice(0, MAX_MODELS)
}

export function ModelComparison({ models, inputTokens, outputTokens, usage }: ModelComparisonProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  // True once the user manually changes the selection, so we stop auto-seeding.
  const [userTouched, setUserTouched] = useState(false)

  const modelByKey = useMemo(() => {
    const map = new Map<string, ModelPrice>()
    for (const m of models) map.set(modelKey(m), m)
    return map
  }, [models])

  // Keep the selection valid as the price data loads/swaps (fallback -> live),
  // and seed a sensible default when nothing is selected and the user hasn't
  // touched anything yet.
  useEffect(() => {
    if (models.length === 0) return
    setSelectedKeys(prev => {
      const valid = prev.filter(k => modelByKey.has(k))
      if (valid.length > 0) {
        return valid.length === prev.length ? prev : valid
      }
      if (userTouched) return prev.length === 0 ? prev : []
      return pickDefaults(models)
    })
  }, [models, modelByKey, userTouched])

  const selectedModels = useMemo(
    () => selectedKeys.map(k => modelByKey.get(k)).filter((m): m is ModelPrice => Boolean(m)),
    [selectedKeys, modelByKey],
  )

  const groupedModels = useMemo(() => {
    const groups = new Map<string, ModelPrice[]>()
    for (const m of models) {
      const arr = groups.get(m.provider) ?? []
      arr.push(m)
      groups.set(m.provider, arr)
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [models])

  const toggleModel = useCallback((key: string) => {
    setSelectedKeys(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key)
      if (prev.length >= MAX_MODELS) return prev
      return [...prev, key]
    })
  }, [])

  const removeModel = useCallback((key: string) => {
    setSelectedKeys(prev => prev.filter(k => k !== key))
  }, [])

  const clearAll = useCallback(() => setSelectedKeys([]), [])

  const hasTokens = inputTokens > 0 || outputTokens > 0

  // Cost per selected model
  const costs = useMemo(() => {
    const monthlyRequests = usage.requestsPerDay * usage.monthlyActiveDays
    return selectedModels.map(m => {
      const costPerRequest = calculateCost(inputTokens, outputTokens, m.inputPricePer1M, m.outputPricePer1M)
      return {
        key: modelKey(m),
        costPerRequest,
        monthlyCost: costPerRequest * monthlyRequests,
      }
    })
  }, [selectedModels, inputTokens, outputTokens, usage])

  const cheapestKey = useMemo(() => {
    if (!hasTokens || costs.length < 2) return null
    return costs.reduce((min, c) => (c.monthlyCost < min.monthlyCost ? c : min)).key
  }, [costs, hasTokens])

  const costByKey = useMemo(() => new Map(costs.map(c => [c.key, c])), [costs])

  const atLimit = selectedKeys.length >= MAX_MODELS

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
              <Scale className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Compare Models Side by Side</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Pick up to {MAX_MODELS} models. Add tokens above for cost estimates, or just compare specs and pricing.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600"
                  size="sm"
                  disabled={atLimit}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add model
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0">
                <Command>
                  <CommandInput placeholder="Search models..." />
                  <CommandList className="max-h-[320px]">
                    <CommandEmpty>No models found.</CommandEmpty>
                    {groupedModels.map(([provider, providerModels]) => (
                      <CommandGroup key={provider} heading={provider}>
                        {providerModels.map(m => {
                          const key = modelKey(m)
                          const isSelected = selectedKeys.includes(key)
                          return (
                            <CommandItem
                              key={key}
                              value={`${m.displayName} ${m.provider} ${m.model}`}
                              onSelect={() => toggleModel(key)}
                              disabled={!isSelected && atLimit}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="truncate">{m.displayName}</span>
                              {isSelected && <Check className="h-4 w-4 shrink-0 text-cyan-500" />}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedKeys.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Body */}
        {selectedModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Scale className="h-6 w-6" />
            </span>
            <div>
              <p className="font-medium text-foreground">No models selected yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use &quot;Add model&quot; to choose up to {MAX_MODELS} models and compare them.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-36 min-w-36 bg-card p-3 text-left align-bottom text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Attribute
                  </th>
                  {selectedModels.map(m => {
                    const key = modelKey(m)
                    const isCheapest = key === cheapestKey
                    return (
                      <th
                        key={key}
                        className={cn(
                          'min-w-[150px] border-l border-border p-3 text-left align-top',
                          isCheapest && 'bg-cyan-500/5',
                        )}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold leading-tight text-foreground">{m.displayName}</span>
                            <span className="text-xs font-normal text-muted-foreground">{m.provider}</span>
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {m.isFlagship && (
                                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-[10px] font-normal text-blue-600 dark:text-blue-400">
                                  Flagship
                                </Badge>
                              )}
                              {m.isPopular && (
                                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                                  Popular
                                </Badge>
                              )}
                              {isCheapest && (
                                <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-[10px] font-normal text-cyan-600 dark:text-cyan-400">
                                  <Trophy className="mr-0.5 h-2.5 w-2.5" />
                                  Cheapest
                                </Badge>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeModel(key)}
                            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`Remove ${m.displayName}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="text-sm">
                <SpecRow label="Input / 1M" models={selectedModels} cheapestKey={cheapestKey} render={m => formatPricePer1M(m.inputPricePer1M)} />
                <SpecRow label="Output / 1M" models={selectedModels} cheapestKey={cheapestKey} render={m => formatPricePer1M(m.outputPricePer1M)} />
                <SpecRow
                  label="Cached input / 1M"
                  models={selectedModels}
                  cheapestKey={cheapestKey}
                  render={m => (m.cachedInputPricePer1M != null ? formatPricePer1M(m.cachedInputPricePer1M) : '—')}
                />
                <SpecRow label="Context window" models={selectedModels} cheapestKey={cheapestKey} render={m => formatContextWindow(m.contextWindow)} />
                <SpecRow label="Max output" models={selectedModels} cheapestKey={cheapestKey} render={m => formatContextWindow(m.maxOutputTokens)} />

                {/* Capability rows */}
                {CAPABILITY_ROWS.map(({ key, icon }) => (
                  <tr key={key} className="border-t border-border">
                    <td className="sticky left-0 z-10 bg-card p-3 text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        {icon}
                        {CAPABILITY_LABELS[key].label}
                      </span>
                    </td>
                    {selectedModels.map(m => {
                      const active = Boolean(m[key])
                      return (
                        <td
                          key={modelKey(m)}
                          className={cn('border-l border-border p-3', modelKey(m) === cheapestKey && 'bg-cyan-500/5')}
                        >
                          {active ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* Cost rows (only when tokens are provided) */}
                {hasTokens && (
                  <>
                    <tr className="border-t border-border">
                      <td colSpan={selectedModels.length + 1} className="bg-muted/40 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Cost estimate · {inputTokens.toLocaleString()} in / {outputTokens.toLocaleString()} out tokens
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="sticky left-0 z-10 bg-card p-3 text-muted-foreground">Cost / request</td>
                      {selectedModels.map(m => {
                        const key = modelKey(m)
                        return (
                          <td key={key} className={cn('border-l border-border p-3 tabular-nums', key === cheapestKey && 'bg-cyan-500/5')}>
                            {formatCurrency(costByKey.get(key)?.costPerRequest ?? 0)}
                          </td>
                        )
                      })}
                    </tr>
                    <tr className="border-t border-border">
                      <td className="sticky left-0 z-10 bg-card p-3 font-medium text-foreground">Monthly est.</td>
                      {selectedModels.map(m => {
                        const key = modelKey(m)
                        const isCheapest = key === cheapestKey
                        return (
                          <td
                            key={key}
                            className={cn(
                              'border-l border-border p-3 font-semibold tabular-nums',
                              isCheapest ? 'bg-cyan-500/5 text-cyan-600 dark:text-cyan-400' : 'text-foreground',
                            )}
                          >
                            {formatCurrency(costByKey.get(key)?.monthlyCost ?? 0)}
                          </td>
                        )
                      })}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!hasTokens && selectedModels.length > 0 && (
          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            Showing specs and pricing only. Enter input/output tokens in the calculator above to see per-request and monthly cost estimates.
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

// Simple attribute row where every model renders a single string value.
function SpecRow({
  label,
  models,
  cheapestKey,
  render,
}: {
  label: string
  models: ModelPrice[]
  cheapestKey: string | null
  render: (m: ModelPrice) => React.ReactNode
}) {
  return (
    <tr className="border-t border-border">
      <td className="sticky left-0 z-10 bg-card p-3 text-muted-foreground">{label}</td>
      {models.map(m => {
        const key = modelKey(m)
        return (
          <td key={key} className={cn('border-l border-border p-3 tabular-nums text-foreground', key === cheapestKey && 'bg-cyan-500/5')}>
            {render(m)}
          </td>
        )
      })}
    </tr>
  )
}
