'use client'

import { useState } from 'react'
import { Copy, Check, AlertCircle, Zap, Code, Database, ArrowRight, Play, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="group relative rounded-lg border border-border bg-zinc-950 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium text-zinc-400">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-zinc-400 hover:text-white"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-zinc-300">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// API Tester component for client-side testing
function ApiTester({ 
  endpoint, 
  method,
  defaultBody 
}: { 
  endpoint: string
  method: 'GET' | 'POST'
  defaultBody?: Record<string, unknown>
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [params, setParams] = useState(defaultBody || {})

  const runTest = async () => {
    setIsLoading(true)
    setError(null)
    setResponse(null)
    
    try {
      const url = method === 'GET' 
        ? `${endpoint}?${new URLSearchParams(params as Record<string, string>).toString()}`
        : endpoint
      
      const res = await fetch(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'POST' ? JSON.stringify(params) : undefined,
      })
      
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsLoading(false)
    }
  }

  const updateParam = (key: string, value: string) => {
    setParams(prev => ({
      ...prev,
      [key]: isNaN(Number(value)) ? value : Number(value)
    }))
  }

  return (
    <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Play className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-medium text-foreground">Try it live</span>
        <span className="text-xs text-muted-foreground">(runs from your browser)</span>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(params).map(([key, value]) => (
          <div key={key}>
            <Label className="text-xs text-muted-foreground">{key}</Label>
            <Input
              value={String(value)}
              onChange={(e) => updateParam(key, e.target.value)}
              className="mt-1 h-8 text-sm"
            />
          </div>
        ))}
      </div>
      
      <Button 
        onClick={runTest} 
        disabled={isLoading}
        size="sm"
        className="mt-3 bg-emerald-600 text-white hover:bg-emerald-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play className="mr-2 h-3.5 w-3.5" />
            Run Request
          </>
        )}
      </Button>
      
      {(response || error) && (
        <div className="mt-3">
          <Label className="text-xs text-muted-foreground">Response</Label>
          <pre className={cn(
            "mt-1 max-h-48 overflow-auto rounded-lg p-3 text-xs",
            error ? "bg-red-500/10 text-red-500" : "bg-zinc-950 text-zinc-300"
          )}>
            {error || response}
          </pre>
        </div>
      )}
    </div>
  )
}

function EndpointCard({ 
  method, 
  path, 
  description, 
  children,
  tester
}: { 
  method: 'GET' | 'POST'
  path: string
  description: string
  children: React.ReactNode
  tester?: { defaultBody: Record<string, unknown> }
}) {
  const methodColors = {
    GET: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    POST: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  }
  
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-bold",
            methodColors[method]
          )}>
            {method}
          </span>
          <code className="text-sm font-medium text-foreground">{path}</code>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="p-6">
        {children}
        {tester && (
          <ApiTester 
            endpoint={path} 
            method={method} 
            defaultBody={tester.defaultBody}
          />
        )}
      </div>
    </div>
  )
}

export function ApiDocumentation() {
  return (
    <div className="container mx-auto max-w-4xl px-4">
      {/* Header */}
      <div className="mb-12">
        <div className="mb-4 flex items-center gap-2">
          <Code className="h-6 w-6 text-emerald-500" />
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            API v1
          </span>
        </div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          API Documentation
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Calculate LLM token costs programmatically. Perfect for integrating cost estimation 
          into your applications, CI/CD pipelines, or monitoring dashboards. No API key required.
        </p>
      </div>

      {/* Rate Limits Warning */}
      <div className="mb-8 flex gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <h3 className="font-medium text-amber-700 dark:text-amber-300">Rate Limits</h3>
          <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
            All endpoints are rate limited to <strong>100 requests per minute</strong> per IP address. 
            Rate limit headers are included in every response: <code className="rounded bg-amber-500/10 px-1">X-RateLimit-Limit</code>, 
            <code className="rounded bg-amber-500/10 px-1 ml-1">X-RateLimit-Remaining</code>, 
            <code className="rounded bg-amber-500/10 px-1 ml-1">X-RateLimit-Reset</code>.
          </p>
        </div>
      </div>

      {/* Base URL */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Base URL</h2>
        <code className="mt-2 block rounded-lg bg-muted px-4 py-3 text-sm text-foreground">
          https://tokenbudget.edwardiaz.dev/api/v1
        </code>
      </div>

      {/* Endpoints */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-foreground">Endpoints</h2>

        {/* Calculate Endpoint */}
        <EndpointCard
          method="POST"
          path="/api/v1/calculate"
          description="Calculate the cost for a specific model given input, output, and optionally cached tokens."
          tester={{ defaultBody: { model: 'gpt-4o', inputTokens: 1000, outputTokens: 500, cachedTokens: 0 } }}
        >
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">Request Body</h4>
              <CodeBlock
                language="json"
                code={`{
  "model": "gpt-4o",
  "inputTokens": 1000,
  "outputTokens": 500,
  "cachedTokens": 200  // optional - tokens served from cache
}`}
              />
            </div>
            
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">Response</h4>
              <CodeBlock
                language="json"
                code={`{
  "model": "gpt-4o",
  "provider": "OpenAI",
  "inputTokens": 1000,
  "outputTokens": 500,
  "cachedTokens": 200,
  "costs": {
    "input": 0.002,
    "output": 0.005,
    "cached": 0.00025,
    "total": 0.00725
  },
  "prices": {
    "inputPer1M": 2.5,
    "outputPer1M": 10.0,
    "cachedPer1M": 1.25
  }
}`}
              />
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">cURL Example</h4>
              <CodeBlock
                language="bash"
                code={`curl -X POST https://tokenbudget.edwardiaz.dev/api/v1/calculate \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o","inputTokens":1000,"outputTokens":500,"cachedTokens":200}'`}
              />
            </div>
          </div>
        </EndpointCard>

        {/* Best Model Endpoint */}
        <EndpointCard
          method="POST"
          path="/api/v1/best"
          description="Find the cheapest model for your token usage, with optional filters for capabilities and providers."
          tester={{ defaultBody: { inputTokens: 1000, outputTokens: 500, cachedTokens: 0 } }}
        >
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">Request Body</h4>
              <CodeBlock
                language="json"
                code={`{
  "inputTokens": 1000,
  "outputTokens": 500,
  "cachedTokens": 0,
  "filters": {
    "providers": ["OpenAI", "Anthropic"],  // optional
    "minContext": 128000,                   // optional
    "capabilities": ["vision", "functions"] // optional
  }
}`}
              />
            </div>
            
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">Response</h4>
              <CodeBlock
                language="json"
                code={`{
  "recommendation": {
    "model": "gpt-4o-mini",
    "provider": "OpenAI",
    "costs": {
      "input": 0.00015,
      "output": 0.0003,
      "cached": 0,
      "total": 0.00045
    },
    "contextWindow": 128000,
    "capabilities": {
      "vision": true,
      "functions": true,
      "reasoning": false
    }
  },
  "alternatives": [
    {
      "model": "claude-3-5-haiku",
      "provider": "Anthropic",
      "totalCost": 0.0028,
      "priceDiff": "+522%"
    }
  ]
}`}
              />
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">Available Capability Filters</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li><code className="rounded bg-muted px-1.5 py-0.5">vision</code> - Models that can analyze images</li>
                <li><code className="rounded bg-muted px-1.5 py-0.5">functions</code> - Models that support function calling</li>
                <li><code className="rounded bg-muted px-1.5 py-0.5">reasoning</code> - Models with enhanced reasoning (o1, o3, etc.)</li>
                <li><code className="rounded bg-muted px-1.5 py-0.5">coding</code> - Models optimized for code generation</li>
              </ul>
            </div>
          </div>
        </EndpointCard>

        {/* Models List Endpoint */}
        <EndpointCard
          method="GET"
          path="/api/v1/models"
          description="List all available models with their pricing. Supports filtering by provider and caching capability."
          tester={{ defaultBody: { provider: '', hasCache: '', search: '' } }}
        >
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">Query Parameters</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><code className="rounded bg-muted px-1.5 py-0.5">provider</code> - Filter by provider (e.g., openai, anthropic)</li>
                <li><code className="rounded bg-muted px-1.5 py-0.5">hasCache</code> - Only show models with cached pricing (true/false)</li>
                <li><code className="rounded bg-muted px-1.5 py-0.5">search</code> - Search by model name</li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">Response</h4>
              <CodeBlock
                language="json"
                code={`{
  "count": 65,
  "providers": ["OpenAI", "Anthropic", "Google", ...],
  "models": [
    {
      "id": "gpt-4o",
      "provider": "OpenAI",
      "input": 2.5,
      "output": 10.0,
      "cached": 1.25,
      "context": 128000
    },
    ...
  ],
  "lastUpdated": "2026-03-20T12:00:00.000Z"
}`}
              />
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">Example</h4>
              <CodeBlock
                language="bash"
                code={`curl "https://tokenbudget.edwardiaz.dev/api/v1/models?provider=openai&hasCache=true"`}
              />
            </div>
          </div>
        </EndpointCard>
      </div>

      {/* Error Handling */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-foreground">Error Handling</h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            All error responses follow a consistent format:
          </p>
          <CodeBlock
            language="json"
            code={`{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 45  // seconds until rate limit resets
}`}
          />
          <div className="mt-6">
            <h4 className="mb-3 text-sm font-medium text-foreground">HTTP Status Codes</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><code className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400">200</code> - Success</li>
              <li><code className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">400</code> - Bad request (invalid parameters)</li>
              <li><code className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">404</code> - Model not found</li>
              <li><code className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-600 dark:text-red-400">429</code> - Rate limit exceeded</li>
              <li><code className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-600 dark:text-red-400">500</code> - Internal server error</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Performance Notes */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-foreground">Performance</h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span><strong className="text-foreground">Cached Pricing Data:</strong> Model prices are cached and refreshed hourly from LiteLLM, ensuring fast response times (~50ms).</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span><strong className="text-foreground">Edge Deployment:</strong> API runs on Vercel Edge Functions for low latency globally.</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span><strong className="text-foreground">Minimal Payload:</strong> Responses are optimized to include only essential data, keeping bandwidth low.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Use Cases */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-foreground">Use Cases</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Zap className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">CI/CD Integration</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add cost checks to your deployment pipeline to prevent expensive model regressions.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <Database className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Cost Monitoring</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Log token usage and calculate costs in real-time for your dashboard metrics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 p-8 text-center">
        <h2 className="text-xl font-bold text-foreground">Ready to get started?</h2>
        <p className="mt-2 text-muted-foreground">
          No API key required. Start making requests right away.
        </p>
        <Button 
          className="mt-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600"
          asChild
        >
          <a href="/#calculator">
            Try the Calculator
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  )
}
