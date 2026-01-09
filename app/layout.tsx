// Layout raiz da aplicação
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Header } from '@/components/Header'
import { YouTubePlayerProvider } from '@/components/YouTubePlayer'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="pt-BR" suppressHydrationWarning className="overflow-x-hidden">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;500;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Raleway:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <ThemeProvider>
          <YouTubePlayerProvider>
            <Header />
            <main className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
              {children}
            </main>
          </YouTubePlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}






