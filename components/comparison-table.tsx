'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowUpDown, 
  Filter, 
  ChevronDown, 
  Database, 
  Clock, 
  Eye, 
  Wrench,
  Zap,
  Brain,
  Code,
  Layers,
  FileJson,
  Info,
  X
} from 'lucide-react'
import type { CostEstimate, SortField, SortDirection, CapabilityFilter, ContextWindowFilter } from '@/lib/types'
import { formatCurrency, formatPricePer1M } from '@/lib/calculator'
import { CAPABILITY_LABELS, CONTEXT_WINDOW_FILTERS } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ComparisonTableProps {
  estimates: CostEstimate[]
  priceSource?: string
  lastUpdated?: string
}

const CAPABILITY_ICONS: Record<CapabilityFilter, React.ReactNode> = {
  supportsVision: <Eye className="h-3.5 w-3.5" />,
  supportsFunctionCalling: <Wrench className="h-3.5 w-3.5" />,
  supportsStreaming: <Zap className="h-3.5 w-3.5" />,
  supportsJSON: <FileJson className="h-3.5 w-3.5" />,
  isReasoning: <Brain className="h-3.5 w-3.5" />,
  isCoding: <Code className="h-3.5 w-3.5" />,
  isMultimodal: <Layers className="h-3.5 w-3.5" />,
}

function formatContextWindow(tokens?: number): string {
  if (!tokens) return 'Unknown'
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`
  return tokens.toString()
}

export function ComparisonTable({ estimates, priceSource, lastUpdated }: ComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('monthlyCost')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedCapabilities, setSelectedCapabilities] = useState<CapabilityFilter[]>([])
  const [selectedContextFilter, setSelectedContextFilter] = useState<ContextWindowFilter>(CONTEXT_WINDOW_FILTERS[0])
  const [providerFilterOpen, setProviderFilterOpen] = useState(false)
  const [capabilityFilterOpen, setCapabilityFilterOpen] = useState(false)
  const [contextFilterOpen, setContextFilterOpen] = useState(false)

  // Get unique providers from estimates
  const providers = useMemo(() => {
    return [...new Set(estimates.map(e => e.provider))].sort()
  }, [estimates])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleProvider = useCallback((provider: string) => {
    setSelectedProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider]
    )
  }, [])

  const toggleCapability = useCallback((capability: CapabilityFilter) => {
    setSelectedCapabilities((prev) =>
      prev.includes(capability)
        ? prev.filter((c) => c !== capability)
        : [...prev, capability]
    )
  }, [])

  const clearAllFilters = useCallback(() => {
    setSelectedProviders([])
    setSelectedCapabilities([])
    setSelectedContextFilter(CONTEXT_WINDOW_FILTERS[0])
  }, [])

  const hasActiveFilters = selectedProviders.length > 0 || selectedCapabilities.length > 0 || selectedContextFilter.min !== undefined

  const sortedEstimates = useMemo(() => {
    let filtered = estimates

    // Filter by providers
    if (selectedProviders.length > 0) {
      filtered = filtered.filter((e) => selectedProviders.includes(e.provider))
    }

    // Filter by capabilities
    if (selectedCapabilities.length > 0) {
      filtered = filtered.filter((e) => 
        selectedCapabilities.every((cap) => e[cap])
      )
    }

    // Filter by context window
    if (selectedContextFilter.min !== undefined || selectedContextFilter.max !== undefined) {
      filtered = filtered.filter((e) => {
        const ctx = e.contextWindow || 0
        if (selectedContextFilter.min !== undefined && ctx < selectedContextFilter.min) return false
        if (selectedContextFilter.max !== undefined && ctx >= selectedContextFilter.max) return false
        return true
      })
    }
    
    return [...filtered].sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'model':
          comparison = a.displayName.localeCompare(b.displayName)
          break
        case 'provider':
          comparison = a.provider.localeCompare(b.provider)
          break
        case 'inputPricePer1M':
          comparison = a.inputPricePer1M - b.inputPricePer1M
          break
        case 'outputPricePer1M':
          comparison = a.outputPricePer1M - b.outputPricePer1M
          break
        case 'costPerRequest':
          comparison = a.costPerRequest - b.costPerRequest
          break
        case 'monthlyCost':
          comparison = a.monthlyCost - b.monthlyCost
          break
        case 'contextWindow':
          comparison = (a.contextWindow || 0) - (b.contextWindow || 0)
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [estimates, sortField, sortDirection, selectedProviders, selectedCapabilities, selectedContextFilter])

  const cheapestModel = useMemo(() => {
    if (sortedEstimates.length === 0) return null
    return sortedEstimates.reduce((min, e) => (e.monthlyCost < min.monthlyCost ? e : min))
  }, [sortedEstimates])

  const formatLastUpdated = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className={cn(
        "ml-1.5 h-3.5 w-3.5",
        sortField === field && "text-cyan-600 dark:text-cyan-400"
      )} />
    </Button>
  )

  const ModelCapabilityBadges = ({ estimate }: { estimate: CostEstimate }) => {
    const capabilities: { key: CapabilityFilter; active: boolean }[] = [
      { key: 'supportsVision', active: !!estimate.supportsVision },
      { key: 'supportsFunctionCalling', active: !!estimate.supportsFunctionCalling },
      { key: 'isReasoning', active: !!estimate.isReasoning },
      { key: 'isCoding', active: !!estimate.isCoding },
      { key: 'isMultimodal', active: !!estimate.isMultimodal },
    ]

    const activeCapabilities = capabilities.filter(c => c.active)
    if (activeCapabilities.length === 0) return null

    return (
      <div className="mt-1 flex flex-wrap gap-1">
        {activeCapabilities.slice(0, 3).map(({ key }) => (
          <TooltipProvider key={key} delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted text-muted-foreground">
                  {CAPABILITY_ICONS[key]}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-medium">{CAPABILITY_LABELS[key].label}</p>
                <p className="text-xs text-muted-foreground">{CAPABILITY_LABELS[key].description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {activeCapabilities.length > 3 && (
          <span className="inline-flex h-5 items-center rounded bg-muted px-1.5 text-[10px] text-muted-foreground">
            +{activeCapabilities.length - 3}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border p-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Model Comparison Matrix</h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                {priceSource === 'LiteLLM' ? 'Live pricing from LiteLLM' : 'Fallback pricing data'}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Updated {formatLastUpdated(lastUpdated)}
              </span>
            </div>
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-2">
          {/* Provider Filter */}
          <Popover open={providerFilterOpen} onOpenChange={setProviderFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  selectedProviders.length > 0 && "border-cyan-500/50 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                )}
              >
                <Filter className="mr-2 h-3.5 w-3.5" />
                Providers
                {selectedProviders.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                    {selectedProviders.length}
                  </Badge>
                )}
                <ChevronDown className="ml-2 h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              align="start" 
              className="w-56 p-2"
              onInteractOutside={() => setProviderFilterOpen(false)}
            >
              <div className="mb-2 flex items-center justify-between px-2">
                <span className="text-xs font-medium text-muted-foreground">Filter by provider</span>
                {selectedProviders.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground"
                    onClick={() => setSelectedProviders([])}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="max-h-[280px] space-y-1 overflow-y-auto">
                {providers.map((provider) => (
                  <label
                    key={provider}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted"
                  >
                    <Checkbox
                      checked={selectedProviders.includes(provider)}
                      onCheckedChange={() => toggleProvider(provider)}
                      className="data-[state=checked]:border-cyan-500 data-[state=checked]:bg-cyan-500"
                    />
                    <span className="text-sm">{provider}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Capabilities Filter */}
          <Popover open={capabilityFilterOpen} onOpenChange={setCapabilityFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  selectedCapabilities.length > 0 && "border-cyan-500/50 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                )}
              >
                <Layers className="mr-2 h-3.5 w-3.5" />
                Capabilities
                {selectedCapabilities.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                    {selectedCapabilities.length}
                  </Badge>
                )}
                <ChevronDown className="ml-2 h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              align="start" 
              className="w-64 p-2"
              onInteractOutside={() => setCapabilityFilterOpen(false)}
            >
              <div className="mb-2 flex items-center justify-between px-2">
                <span className="text-xs font-medium text-muted-foreground">Filter by capability</span>
                {selectedCapabilities.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground"
                    onClick={() => setSelectedCapabilities([])}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {(Object.keys(CAPABILITY_LABELS) as CapabilityFilter[]).map((cap) => (
                  <label
                    key={cap}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted"
                  >
                    <Checkbox
                      checked={selectedCapabilities.includes(cap)}
                      onCheckedChange={() => toggleCapability(cap)}
                      className="data-[state=checked]:border-cyan-500 data-[state=checked]:bg-cyan-500"
                    />
                    <div className="flex items-center gap-2 text-sm">
                      {CAPABILITY_ICONS[cap]}
                      <span>{CAPABILITY_LABELS[cap].label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Context Window Filter */}
          <Popover open={contextFilterOpen} onOpenChange={setContextFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  selectedContextFilter.min !== undefined && "border-cyan-500/50 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                )}
              >
                <Database className="mr-2 h-3.5 w-3.5" />
                Context: {selectedContextFilter.label}
                <ChevronDown className="ml-2 h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              align="start" 
              className="w-48 p-2"
              onInteractOutside={() => setContextFilterOpen(false)}
            >
              <div className="mb-2 px-2">
                <span className="text-xs font-medium text-muted-foreground">Context window size</span>
              </div>
              <div className="space-y-1">
                {CONTEXT_WINDOW_FILTERS.map((filter, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedContextFilter(filter)
                      setContextFilterOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                      selectedContextFilter.label === filter.label && "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('monthlyCost')}
          >
            <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
            Sort by Cost
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[260px]">
                <SortButton field="model">Model</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="provider">Provider</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="contextWindow">Context</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="inputPricePer1M">Input / 1M</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="outputPricePer1M">Output / 1M</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="costPerRequest">Cost/Request</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="monthlyCost">Monthly Est.</SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEstimates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No models match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              sortedEstimates.map((estimate) => {
                const isCheapest = cheapestModel?.model === estimate.model && cheapestModel?.provider === estimate.provider
                return (
                  <TableRow
                    key={`${estimate.provider}-${estimate.model}`}
                    className={cn(
                      'border-border',
                      isCheapest && 'bg-cyan-500/5'
                    )}
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate">{estimate.displayName}</span>
                          {estimate.isFlagship && (
                            <Badge
                              variant="outline"
                              className="border-blue-500/30 bg-blue-500/10 text-[10px] text-blue-600 dark:text-blue-400"
                            >
                              Flagship
                            </Badge>
                          )}
                          {estimate.isPopular && (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                            >
                              Popular
                            </Badge>
                          )}
                          {estimate.description && (
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-sm">{estimate.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <ModelCapabilityBadges estimate={estimate} />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{estimate.provider}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{formatContextWindow(estimate.contextWindow)}</span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-sm">
                              {estimate.contextWindow?.toLocaleString() || 'Unknown'} tokens
                            </p>
                            {estimate.maxOutputTokens && (
                              <p className="text-xs text-muted-foreground">
                                Max output: {estimate.maxOutputTokens.toLocaleString()} tokens
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPricePer1M(estimate.inputPricePer1M)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPricePer1M(estimate.outputPricePer1M)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(estimate.costPerRequest)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right tabular-nums font-semibold',
                        isCheapest ? 'text-cyan-600 dark:text-cyan-400' : 'text-foreground'
                      )}
                    >
                      {formatCurrency(estimate.monthlyCost)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
        Showing {sortedEstimates.length} of {estimates.length} models
        {priceSource === 'LiteLLM' && (
          <span className="ml-2">
            | Pricing data from{' '}
            <a 
              href="https://github.com/BerriAI/litellm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-600 hover:underline dark:text-cyan-400"
            >
              LiteLLM
            </a>
          </span>
        )}
      </div>
    </div>
  )
}
