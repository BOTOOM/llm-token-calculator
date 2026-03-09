import { Heart, Github, Coffee, ShieldCheck } from 'lucide-react'

const GITHUB_REPO = 'https://github.com/BOTOOM/llm-token-calculator'

function Logo({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 32 32" 
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="footer-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#footer-logo-grad)"/>
      <path d="M8 10h4v12H8V10z" fill="white" opacity="0.9"/>
      <path d="M14 10h4v12h-4V10z" fill="white" opacity="0.7"/>
      <path d="M20 10h4v8h-4v-8z" fill="white" opacity="0.5"/>
      <path d="M8 23h16v1H8v-1z" fill="white" opacity="0.4"/>
    </svg>
  )
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/30">
      {/* Sponsor Section */}
      <div className="border-b border-border py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-lg font-semibold text-foreground">Support the Project</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            If you find this tool useful, consider supporting its development. Your sponsorship helps keep the pricing data updated and add new features.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/sponsors/BOTOOM"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-pink-500/30 bg-pink-500/10 px-5 py-2.5 text-sm font-medium text-pink-600 transition-colors hover:bg-pink-500/20 dark:text-pink-400"
            >
              <Heart className="h-4 w-4" />
              Sponsor on GitHub
            </a>
            <a
              href="https://buymeacoffee.com/edwardiazdev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-5 py-2.5 text-sm font-medium text-yellow-600 transition-colors hover:bg-yellow-500/20 dark:text-yellow-400"
            >
              <Coffee className="h-4 w-4" />
              Buy Me a Coffee
            </a>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="border-b border-border py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 text-center">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">100% Private:</span> All calculations happen locally in your browser. We never send, store, or log any of your text data.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <Logo className="h-7 w-7" />
              <span className="text-sm font-medium text-foreground">
                Tokon<span className="text-cyan-500">omics</span>
              </span>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-6">
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a
                href={`${GITHUB_REPO}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Report Issue
              </a>
              <a
                href={`${GITHUB_REPO}/blob/main/CONTRIBUTING.md`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Contribute
              </a>
              <a
                href={`${GITHUB_REPO}/blob/main/LICENSE`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                MIT License
              </a>
            </nav>

            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} Tokonomics. Pricing data from{' '}
              <a 
                href="https://github.com/BerriAI/litellm"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                LiteLLM
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
