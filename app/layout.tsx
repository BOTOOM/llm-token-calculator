import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tokenbudget.edwardiaz.dev'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'TokenBudget - LLM Token Counter & Cost Calculator',
    template: '%s | TokenBudget',
  },
  description: 'Calculate and compare token costs across 50+ LLM models from OpenAI, Anthropic, Google, Mistral, AWS and more. Free API, open-source, and privacy-first calculator with cached token support.',
  keywords: [
    'LLM',
    'tokens',
    'token counter',
    'cost calculator',
    'token budget',
    'LLM API',
    'token API',
    'cached tokens',
    'OpenAI',
    'GPT-4',
    'GPT-5',
    'Claude',
    'Gemini',
    'Mistral',
    'Anthropic',
    'API pricing',
    'AI costs',
    'tiktoken',
    'tokenizer',
    'LLM cost API',
    'token estimation',
  ],
  authors: [{ name: 'Edward Diaz', url: 'https://github.com/BOTOOM' }],
  creator: 'Edward Diaz',
  publisher: 'Edward Diaz',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'TokenBudget',
    title: 'TokenBudget - LLM Token Counter & Cost Calculator with Free API',
    description: 'Calculate and compare token costs across 50+ LLM models. Free API for developers, open-source, and privacy-first.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TokenBudget - LLM Token Counter & Cost Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TokenBudget - LLM Token Counter & Cost Calculator',
    description: 'Calculate and compare token costs across 50+ LLM models. Free, open-source, and privacy-first.',
    images: ['/og-image.png'],
    creator: '@edwardiazdev',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: BASE_URL,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://raw.githubusercontent.com" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
