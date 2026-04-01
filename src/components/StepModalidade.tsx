'use client'

import type { ReactNode } from 'react'
import { Home, DollarSign, FileText } from 'lucide-react'

export type Modalidade = 'locacao' | 'compra-venda' | 'escritura'

const OPCOES: {
  id: Modalidade
  icon: ReactNode
  label: string
  desc: string
  tag: string
  novo?: boolean
}[] = [
  {
    id: 'locacao',
    icon: <Home size={22} />,
    label: 'Locação',
    desc: 'Contrato de aluguel residencial ou comercial com todas as cláusulas padrão.',
    tag: '4 etapas · OCR automático',
  },
  {
    id: 'compra-venda',
    icon: <DollarSign size={22} />,
    label: 'Compra e Venda',
    desc: 'Promessa de compra e venda de imóvel com condições de pagamento e prazo.',
    tag: '3 etapas',
  },
  {
    id: 'escritura',
    icon: <FileText size={22} />,
    label: 'Escritura',
    desc: 'Instrumento particular com força de escritura pública para transferência definitiva.',
    tag: '3 etapas',
    novo: true,
  },
]

export default function StepModalidade({ onSelect }: { onSelect: (m: Modalidade) => void }) {
  return (
    <main className="j-main">
      <div className="j-eyebrow">Novo contrato</div>
      <h1 className="j-title">Selecione a modalidade</h1>
      <p className="j-desc">
        Escolha o tipo de contrato que deseja gerar. O fluxo e os campos serão adaptados automaticamente.
      </p>

      <div className="j-choices-modal">
        {OPCOES.map((op) => (
          <button
            key={op.id}
            className="j-choice-modal"
            onClick={() => onSelect(op.id)}
            style={{ position: 'relative' }}
          >
            {op.novo && (
              <span style={{
                position: 'absolute', top: 14, right: 14,
                background: 'var(--sage-p)', color: 'var(--sage-d)',
                padding: '2px 8px', borderRadius: 20,
                fontSize: 9, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
              }}>
                Novo
              </span>
            )}
            <div className="j-choice-modal-icon">{op.icon}</div>
            <div className="j-choice-modal-label">{op.label}</div>
            <div className="j-choice-modal-desc">{op.desc}</div>
            <span className="j-choice-modal-tag">{op.tag}</span>
          </button>
        ))}
      </div>
    </main>
  )
}
