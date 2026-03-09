'use client'

import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Copy, Trash2, FileText, MessageSquare, Hash, Loader2, ShieldCheck } from 'lucide-react'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

interface TokenInputProps {
  inputText: string
  onInputChange: (value: string) => void
  inputTokens: number
  onInputTokensChange: (value: number) => void
  inputMode: 'text' | 'number'
  onInputModeChange: (mode: 'text' | 'number') => void
  outputText: string
  onOutputChange: (value: string) => void
  outputTokens: number
  onOutputTokensChange: (value: number) => void
  outputMode: 'text' | 'number'
  onOutputModeChange: (mode: 'text' | 'number') => void
  inputTokenCount: number
  outputTokenCount: number
  isCalculating?: boolean
}

export function TokenInput({
  inputText,
  onInputChange,
  inputTokens,
  onInputTokensChange,
  inputMode,
  onInputModeChange,
  outputText,
  onOutputChange,
  outputTokens,
  onOutputTokensChange,
  outputMode,
  onOutputModeChange,
  inputTokenCount,
  outputTokenCount,
  isCalculating,
}: TokenInputProps) {
  const handleCopyInput = useCallback(async () => {
    await navigator.clipboard.writeText(inputText)
  }, [inputText])

  const handleClearInput = useCallback(() => {
    onInputChange('')
    onInputTokensChange(0)
  }, [onInputChange, onInputTokensChange])

  const handleCopyOutput = useCallback(async () => {
    await navigator.clipboard.writeText(outputText)
  }, [outputText])

  const handleClearOutput = useCallback(() => {
    onOutputChange('')
    onOutputTokensChange(0)
  }, [onOutputChange, onOutputTokensChange])

  return (
    <div className="space-y-4">
      {/* Privacy Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
        <p className="text-sm text-emerald-700 dark:text-emerald-200">
          <span className="font-medium">100% Private:</span> All calculations happen in your browser. Your text is never sent to any server or stored anywhere.
        </p>
      </div>

      {/* Input Prompt */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="font-medium uppercase tracking-wide">Input Prompt</span>
            {inputMode === 'text' && inputTokenCount > 0 && (
              <span className="ml-2 rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-600 dark:text-cyan-400">
                {isCalculating ? (
                  <Loader2 className="inline h-3 w-3 animate-spin" />
                ) : (
                  `${inputTokenCount.toLocaleString()} tokens`
                )}
              </span>
            )}
            {inputMode === 'number' && inputTokens > 0 && (
              <span className="ml-2 rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-600 dark:text-cyan-400">
                {inputTokens.toLocaleString()} tokens
              </span>
            )}
          </div>
          {inputMode === 'text' && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleCopyInput}
                disabled={!inputText}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleClearInput}
                disabled={!inputText}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          )}
        </div>
        
        <div className="p-4">
          {/* Mode Toggle */}
          <div className="mb-4 flex rounded-lg border border-border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => onInputModeChange('text')}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                inputMode === 'text'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="h-4 w-4" />
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => onInputModeChange('number')}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                inputMode === 'number'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Hash className="h-4 w-4" />
              Enter Token Count
            </button>
          </div>

          {inputMode === 'text' ? (
            <div>
              <Textarea
                value={inputText}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Paste your system prompt, user instructions, or document text here to calculate tokens across different models..."
                className="min-h-[160px] resize-y bg-muted/30 placeholder:text-muted-foreground/60"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Paste your full prompt including system messages and context to get accurate token counts.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={inputTokens || ''}
                  onChange={(e) => onInputTokensChange(Number(e.target.value) || 0)}
                  placeholder="1000"
                  min={0}
                  className="max-w-[200px] bg-muted/30"
                />
                <span className="text-sm text-muted-foreground">tokens per request</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Enter the known token count for your input prompt if you already have it.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Output Section */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium uppercase tracking-wide">Expected Output</span>
            {outputMode === 'text' && outputTokenCount > 0 && (
              <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {isCalculating ? (
                  <Loader2 className="inline h-3 w-3 animate-spin" />
                ) : (
                  `${outputTokenCount.toLocaleString()} tokens`
                )}
              </span>
            )}
            {outputMode === 'number' && outputTokens > 0 && (
              <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {outputTokens.toLocaleString()} tokens
              </span>
            )}
          </div>
          {outputMode === 'text' && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleCopyOutput}
                disabled={!outputText}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleClearOutput}
                disabled={!outputText}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Mode Toggle */}
          <div className="mb-4 flex rounded-lg border border-border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => onOutputModeChange('text')}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                outputMode === 'text'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              Paste Output Text
            </button>
            <button
              type="button"
              onClick={() => onOutputModeChange('number')}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                outputMode === 'number'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Hash className="h-4 w-4" />
              Enter Token Count
            </button>
          </div>

          {outputMode === 'text' ? (
            <div>
              <Textarea
                value={outputText}
                onChange={(e) => onOutputChange(e.target.value)}
                placeholder="Paste an example AI response or expected output here to calculate output tokens..."
                className="min-h-[120px] resize-y bg-muted/30 placeholder:text-muted-foreground/60"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Paste a sample response to calculate the exact token count for output pricing.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={outputTokens || ''}
                  onChange={(e) => onOutputTokensChange(Number(e.target.value) || 0)}
                  placeholder="500"
                  min={0}
                  className="max-w-[200px] bg-muted/30"
                />
                <span className="text-sm text-muted-foreground">tokens per response</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Enter the expected average token count for AI responses. Typical responses are 100-2000 tokens.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
