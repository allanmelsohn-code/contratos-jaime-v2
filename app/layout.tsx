import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Papaia · Contratos Inteligentes',
  description: 'IA para imobiliárias e cartórios — contratos como mamão com açúcar.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
