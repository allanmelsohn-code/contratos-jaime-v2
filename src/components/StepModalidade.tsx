'use client'

interface Props {
  onSelect: (modalidade: 'locacao' | 'compra-venda' | 'escritura') => void
}

const MODALIDADES = [
  {
    id: 'locacao' as const,
    icon: '🏠',
    label: 'Locação',
    desc: 'Contrato de locação residencial ou comercial',
  },
  {
    id: 'compra-venda' as const,
    icon: '🤝',
    label: 'Compra e Venda',
    desc: 'Instrumento particular de compra e venda de imóvel',
  },
  {
    id: 'escritura' as const,
    icon: '📜',
    label: 'Escritura',
    desc: 'Escritura pública de compra e venda ou doação',
  },
]

export default function StepModalidade({ onSelect }: Props) {
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center bg-[#F5F0E8] px-6 py-16">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#B8860B] mb-3">
            Novo Contrato
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#1A1612] mb-3">
            Selecione a Modalidade
          </h1>
          <p className="text-sm text-[#8A7A6A]">{today}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MODALIDADES.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className="border-2 border-black/10 hover:border-[#B8860B] bg-white rounded-xl p-7 text-left transition-all shadow-sm hover:shadow-md hover:bg-[#B8860B]/5 group"
            >
              <div className="text-5xl mb-4">{m.icon}</div>
              <div className="font-serif text-lg font-semibold text-[#1A1612] mb-2 group-hover:text-[#B8860B] transition-colors">
                {m.label}
              </div>
              <div className="text-[13px] text-[#8A7A6A] leading-snug">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
