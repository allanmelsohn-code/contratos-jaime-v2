import type { Metadata } from 'next'
import './globals.css'

const BASE_URL = 'https://contratos.usepapaia.com.br'

export const metadata: Metadata = {
  title: 'Papaia · Contratos Inteligentes',
  description: 'IA para imobiliárias e cartórios — contratos como mamão com açúcar.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title:       'Papaia · Contratos Inteligentes',
    description: 'IA para imobiliárias e cartórios — contratos como mamão com açúcar.',
    url:         BASE_URL,
    siteName:    'Papaia',
    images: [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630 }],
    type:        'website',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Papaia · Contratos Inteligentes',
    description: 'IA para imobiliárias e cartórios — contratos como mamão com açúcar.',
    images:      [`${BASE_URL}/opengraph-image`],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
