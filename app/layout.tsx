// Layout raiz da aplicação
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import './globals.css'
import { AppProvider } from '@/components/AppProvider'
import { AppFrame } from '@/components/AppFrame'
import { YouTubePlayerProvider } from '@/components/YouTubePlayer'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Ministério de Louvor IBCE',
  description: 'Sistema de organização do grupo de louvor',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" {...mantineHtmlProps} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className={inter.variable} suppressHydrationWarning>
        <AppProvider>
          <YouTubePlayerProvider>
            <AppFrame>{children}</AppFrame>
          </YouTubePlayerProvider>
        </AppProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}






