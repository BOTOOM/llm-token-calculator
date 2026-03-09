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
import { ArrowUpDown, Filter, ChevronDown } from 'lucide-react'
import type { CostEstimate, SortField, SortDirection } from '@/lib/types'
import { formatCurrency } from '@/lib/calculator'
import { cn } from '@/lib/utils'
import { providers } from '@/lib/model-prices'

interface ComparisonTableProps {
  estimates: CostEstimate[]
}

export function ComparisonTable({ estimates }: ComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('monthlyCost')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedProviders, setSelectedProviders] = useState<string[]>(providers)

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
    const filtered = estimates.filter((e) => selectedProviders.includes(e.provider))
    
    return [...filtered].sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'model':
          comparison = a.displayName.localeCompare(b.displayName)
          break
        case 'provider':
          comparison = a.provider.localeCompare(b.provider)
          break
        case 'inputPricePer1k':
          comparison = a.inputPricePer1k - b.inputPricePer1k
          break
        case 'outputPricePer1k':
          comparison = a.outputPricePer1k - b.outputPricePer1k
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
  }, [estimates, sortField, sortDirection, selectedProviders])

  const cheapestModel = useMemo(() => {
    if (sortedEstimates.length === 0) return null
    return sortedEstimates.reduce((min, e) => (e.monthlyCost < min.monthlyCost ? e : min))
  }, [sortedEstimates])

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 text-xs font-medium uppercase tracking-wider text-zinc-400 hover:text-white"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
    </Button>
  )

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-zinc-800 p-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Model Comparison Matrix</h3>
          <p className="text-sm text-zinc-500">
            Live rates adjusted for your specific input/output profile.
          </p>
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
                Filter Provider
                <ChevronDown className="ml-2 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-zinc-700 bg-zinc-900">
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

      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="w-[200px]">
              <SortButton field="model">Model</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="provider">Provider</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="inputPricePer1k">Input / 1M</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="outputPricePer1k">Output / 1M</SortButton>
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
          {sortedEstimates.map((estimate) => {
            const isCheapest = cheapestModel?.model === estimate.model
            return (
              <TableRow
                key={estimate.model}
                className={cn(
                  'border-zinc-800',
                  isCheapest && 'bg-cyan-500/5'
                )}
              >
                <TableCell className="font-medium text-white">
                  <div className="flex items-center gap-2">
                    {estimate.displayName}
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
                  </div>
                </TableCell>
                <TableCell className="text-zinc-400">{estimate.provider}</TableCell>
                <TableCell className="text-right tabular-nums text-zinc-300">
                  ${(estimate.inputPricePer1k * 1000).toFixed(2)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-zinc-300">
                  ${(estimate.outputPricePer1k * 1000).toFixed(2)}
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
          })}
        </TableBody>
      </Table>
    </div>
  )
}
