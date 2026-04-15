import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Euthycare', template: '%s · Euthycare' },
  description: 'Plataforma terapêutica para profissionais de saúde mental.',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#7B9E87',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
