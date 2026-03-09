import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tokonomics.dev'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Tokonomics - LLM Token Counter & Cost Calculator',
    template: '%s | Tokonomics',
  },
  description: 'Calculate and compare token costs across 50+ LLM models from OpenAI, Anthropic, Google, Mistral, AWS and more. Free, open-source, and privacy-first.',
  keywords: [
    'LLM',
    'tokens',
    'token counter',
    'cost calculator',
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
  ],
  authors: [{ name: 'BOTOOM', url: 'https://github.com/BOTOOM' }],
  creator: 'BOTOOM',
  publisher: 'BOTOOM',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Tokonomics',
    title: 'Tokonomics - LLM Token Counter & Cost Calculator',
    description: 'Calculate and compare token costs across 50+ LLM models. Free, open-source, and privacy-first.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tokonomics - LLM Token Counter & Cost Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tokonomics - LLM Token Counter & Cost Calculator',
    description: 'Calculate and compare token costs across 50+ LLM models. Free, open-source, and privacy-first.',
    images: ['/og-image.png'],
    creator: '@BOTOOM',
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
