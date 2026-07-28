import type { Metadata, Viewport } from 'next'
import './globals.css'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata: Metadata = {
  title: 'Gruni!',
  description: 'Analiza utakmica, predviđanja i kvote u realnom vremenu',
  icons: {
    icon: `${basePath}/logo.webp`,
    apple: `${basePath}/logo.webp`,
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="hr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
