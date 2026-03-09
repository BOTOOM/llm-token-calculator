import { Calculator } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-cyan-400">
              <Calculator className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-white">
              LLM<span className="text-cyan-400">Calc</span>
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm text-zinc-500 transition-colors hover:text-white"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-sm text-zinc-500 transition-colors hover:text-white"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-zinc-500 transition-colors hover:text-white"
            >
              Status
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 transition-colors hover:text-white"
            >
              X (Twitter)
            </a>
          </nav>

          <p className="text-sm text-zinc-600">
            &copy; {currentYear} LLM Calc Inc. All rates updated 4h ago.
          </p>
        </div>
      </div>
    </footer>
  )
}
