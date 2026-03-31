import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jaime · Gerador de Contratos',
  description: 'Sistema interno de geração de contratos de locação',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
