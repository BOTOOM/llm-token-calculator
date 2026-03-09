'use client'

import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Copy, Trash2, FileText } from 'lucide-react'
import { useCallback } from 'react'

interface TokenInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function TokenInput({ value, onChange, placeholder }: TokenInputProps) {
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value)
  }, [value])

  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <FileText className="h-4 w-4" />
          <span className="font-medium uppercase tracking-wide">Input Prompt Analysis</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-zinc-400 hover:text-white"
            onClick={handleCopy}
            disabled={!value}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-zinc-400 hover:text-white"
            onClick={handleClear}
            disabled={!value}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Paste your system prompt, user instructions, or document text here to calculate tokens across different models..."}
        className="min-h-[200px] resize-y border-0 bg-transparent px-4 py-4 text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  )
}
