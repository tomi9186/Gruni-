import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gruni!',
  description: 'Analiza utakmica, predviđanja i kvote u realnom vremenu',
  icons: {
    icon: '/gruni-logo.png',
    apple: '/gruni-logo.png',
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
