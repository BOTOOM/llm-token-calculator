import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'LLM Calc - Token Counter & Cost Calculator for LLM APIs',
  description: 'Compare token usage and pricing across OpenAI, Gemini, Mistral and Anthropic models instantly. Estimate LLM API costs before you write a single line of code.',
  keywords: ['LLM', 'tokens', 'cost calculator', 'OpenAI', 'GPT-4', 'Gemini', 'Mistral', 'Anthropic', 'Claude', 'API pricing'],
  openGraph: {
    title: 'LLM Calc - Token Counter & Cost Calculator',
    description: 'Compare token usage and pricing across OpenAI, Gemini, Mistral and Anthropic models instantly.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLM Calc - Token Counter & Cost Calculator',
    description: 'Compare token usage and pricing across OpenAI, Gemini, Mistral and Anthropic models instantly.',
  },
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
