'use client'

import { useState, useMemo } from 'react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowUpDown, Filter, ChevronDown, Database, Clock } from 'lucide-react'
import type { CostEstimate, SortField, SortDirection } from '@/lib/types'
import { formatCurrency, formatPricePer1M } from '@/lib/calculator'
import { cn } from '@/lib/utils'

interface ComparisonTableProps {
  estimates: CostEstimate[]
  priceSource?: string
  lastUpdated?: string
}

export function ComparisonTable({ estimates, priceSource, lastUpdated }: ComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('monthlyCost')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])

  // Get unique providers from estimates
  const providers = useMemo(() => {
    return [...new Set(estimates.map(e => e.provider))].sort()
  }, [estimates])

  // Initialize selected providers to all
  useMemo(() => {
    if (selectedProviders.length === 0 && providers.length > 0) {
      setSelectedProviders(providers)
    }
  }, [providers, selectedProviders.length])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleProvider = (provider: string) => {
    setSelectedProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider]
    )
  }

  const sortedEstimates = useMemo(() => {
    const effectiveProviders = selectedProviders.length > 0 ? selectedProviders : providers
    const filtered = estimates.filter((e) => effectiveProviders.includes(e.provider))
    
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
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [estimates, sortField, sortDirection, selectedProviders, providers])

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
      className="-ml-3 h-8 text-xs font-medium uppercase tracking-wider text-zinc-400 hover:text-white"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className={cn(
        "ml-1.5 h-3.5 w-3.5",
        sortField === field && "text-cyan-400"
      )} />
    </Button>
  )

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-zinc-800 p-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Model Comparison Matrix</h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
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
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 bg-zinc-800/50 text-zinc-300"
              >
                <Filter className="mr-2 h-3.5 w-3.5" />
                Filter ({selectedProviders.length || providers.length})
                <ChevronDown className="ml-2 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto border-zinc-700 bg-zinc-900">
              {providers.map((provider) => (
                <DropdownMenuCheckboxItem
                  key={provider}
                  checked={selectedProviders.includes(provider)}
                  onCheckedChange={() => toggleProvider(provider)}
                  className="text-zinc-300"
                >
                  {provider}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 bg-zinc-800/50 text-zinc-300"
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
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-[220px]">
                <SortButton field="model">Model</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="provider">Provider</SortButton>
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
                <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
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
                      'border-zinc-800',
                      isCheapest && 'bg-cyan-500/5'
                    )}
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate">{estimate.displayName}</span>
                        {estimate.isFlagship && (
                          <Badge
                            variant="outline"
                            className="border-blue-500/30 bg-blue-500/10 text-[10px] text-blue-400"
                          >
                            Flagship
                          </Badge>
                        )}
                        {estimate.isPopular && (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400"
                          >
                            Popular
                          </Badge>
                        )}
                        {estimate.isReasoning && (
                          <Badge
                            variant="outline"
                            className="border-purple-500/30 bg-purple-500/10 text-[10px] text-purple-400"
                          >
                            Reasoning
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400">{estimate.provider}</TableCell>
                    <TableCell className="text-right tabular-nums text-zinc-300">
                      {formatPricePer1M(estimate.inputPricePer1M)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-zinc-300">
                      {formatPricePer1M(estimate.outputPricePer1M)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-zinc-300">
                      {formatCurrency(estimate.costPerRequest)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right tabular-nums font-semibold',
                        isCheapest ? 'text-cyan-400' : 'text-white'
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
      
      <div className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
        Showing {sortedEstimates.length} of {estimates.length} models
        {priceSource === 'LiteLLM' && (
          <span className="ml-2">
            | Pricing data from{' '}
            <a 
              href="https://github.com/BerriAI/litellm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              LiteLLM
            </a>
          </span>
        )}
      </div>
    </div>
  )
}
