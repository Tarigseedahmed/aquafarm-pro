'use client';

import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'
import I18nProvider from '@/i18n/I18nProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cairo',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read preferred locale from localStorage on client
  const defaultLocale = 'ar'
  let initialLocale = defaultLocale
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('locale')
      if (stored === 'ar' || stored === 'en') initialLocale = stored
    } catch {}
  }
  const dir = initialLocale === 'ar' ? 'rtl' : 'ltr'
  return (
    <html lang={initialLocale} dir={dir} suppressHydrationWarning>
      <body className={`${cairo.variable} font-cairo antialiased`}>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <I18nProvider locale={initialLocale as 'ar' | 'en'}>
              {children}
            </I18nProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
