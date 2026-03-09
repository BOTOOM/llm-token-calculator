import { Calculator, Heart, Github, Coffee } from 'lucide-react'

const GITHUB_REPO = 'https://github.com/BOTOOM/llm-token-calculator'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      {/* Sponsor Section */}
      <div className="border-b border-zinc-800 py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-lg font-semibold text-white">Support the Project</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            If you find this tool useful, consider supporting its development. Your sponsorship helps keep the pricing data updated and add new features.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/sponsors/BOTOOM"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-pink-500/30 bg-pink-500/10 px-5 py-2.5 text-sm font-medium text-pink-400 transition-colors hover:bg-pink-500/20"
            >
              <Heart className="h-4 w-4" />
              Sponsor on GitHub
            </a>
            <a
              href="https://buymeacoffee.com/edwardiazdev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-5 py-2.5 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-500/20"
            >
              <Coffee className="h-4 w-4" />
              Buy Me a Coffee
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-cyan-400">
                <Calculator className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-white">
                LLM<span className="text-cyan-400">Calc</span>
              </span>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-6">
              <a
                href={GITHUB_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-white"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a
                href={`${GITHUB_REPO}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-500 transition-colors hover:text-white"
              >
                Report Issue
              </a>
              <a
                href={`${GITHUB_REPO}/blob/main/CONTRIBUTING.md`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-500 transition-colors hover:text-white"
              >
                Contribute
              </a>
              <a
                href={`${GITHUB_REPO}/blob/main/LICENSE`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-500 transition-colors hover:text-white"
              >
                MIT License
              </a>
            </nav>

            <p className="text-sm text-zinc-600">
              &copy; {currentYear} LLM Calc. Pricing data from{' '}
              <a 
                href="https://github.com/BerriAI/litellm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-white"
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
