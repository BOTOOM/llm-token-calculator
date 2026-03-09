import { Calculator, Coins, BarChart3, Zap } from 'lucide-react'

const steps = [
  {
    icon: Calculator,
    title: 'Token Counting',
    description:
      'LLM providers charge based on the number of tokens processed. Tokens are pieces of text - roughly 4 characters or 0.75 words on average.',
  },
  {
    icon: Coins,
    title: 'Input vs Output Tokens',
    description:
      'Input tokens are what you send to the model (prompts, context). Output tokens are the generated response. Each has different pricing.',
  },
  {
    icon: BarChart3,
    title: 'Tiered Pricing',
    description:
      'Different models have vastly different costs. Flagship models like GPT-4o cost more than efficient alternatives like GPT-4o-mini.',
  },
  {
    icon: Zap,
    title: 'Cost Optimization',
    description:
      'By comparing costs across providers, you can save 10-90% on your LLM spending without sacrificing quality for your use case.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">How Token Pricing Works</h2>
          <p className="text-muted-foreground">
            Understanding token-based billing helps you make smarter decisions about which models to use for your applications.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50"
            >
              <div className="absolute -top-3 left-6">
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <step.icon className="h-6 w-6 text-cyan-500" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">The Calculation Formula</h3>
          <div className="rounded-lg bg-muted p-4 font-mono text-sm">
            <span className="text-cyan-600 dark:text-cyan-400">Total Cost</span>
            <span className="text-muted-foreground"> = </span>
            <span className="text-foreground">(Input Tokens</span>
            <span className="text-muted-foreground"> * </span>
            <span className="text-blue-600 dark:text-blue-400">Rate_In</span>
            <span className="text-foreground">)</span>
            <span className="text-muted-foreground"> + </span>
            <span className="text-foreground">(Output Tokens</span>
            <span className="text-muted-foreground"> * </span>
            <span className="text-blue-600 dark:text-blue-400">Rate_Out</span>
            <span className="text-foreground">)</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Rates are typically expressed per 1 million tokens (1M). Our calculator automatically applies the correct rates for each provider and multiplies by your expected usage volume.
          </p>
        </div>

        {/* Pro Tip */}
        <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
              <Zap className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <h4 className="font-semibold text-cyan-600 dark:text-cyan-400">Pro Tip</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                You can paste both your input prompt AND an example output response to get accurate token counts for both. 
                This gives you the most precise cost estimate for your specific use case.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
