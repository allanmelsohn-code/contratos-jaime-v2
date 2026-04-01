'use client'

import { useState } from 'react'
import { PenTool, FileText, Loader2, Download } from 'lucide-react'
import type { FormState } from '@/lib/types'

interface Props {
  form: FormState
  onPrev: () => void
}

export default function StepGerarCV({ form, onPrev }: Props) {
  const [generating, setGenerating] = useState(false)

  const isEscritura = form.modalidade === 'escritura'

  const signatarios = [
    ...(form.vendedores || []).map((v: any) => ({
      nome: v.tipo === 'PJ' ? (v.razaoSocial || 'VENDEDOR') : (v.nome || 'VENDEDOR'),
      role: isEscritura ? 'OUTORGANTE(A) VENDEDOR(A)' : 'VENDEDOR(A)',
    })),
    ...(form.compradores || []).map((c: any) => ({
      nome: c.tipo === 'PJ' ? (c.razaoSocial || 'COMPRADOR') : (c.nome || 'COMPRADOR'),
      role: isEscritura ? 'OUTORGADO(A) COMPRADOR(A)' : 'COMPRADOR(A)',
    })),
    ...(form.testemunhas || []).map((t: any) => ({
      nome: t.nome || 'TESTEMUNHA',
      role: 'TESTEMUNHA',
    })),
    { nome: 'JAIMERX IMOBILIÁRIA LTDA', role: 'Intermediadora' },
  ]

  async function downloadDocx() {
    setGenerating(true)
    try {
      const res = await fetch('/api/gerar-compra-venda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(`Erro ao gerar contrato: ${err.error}`)
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const neg = form.negocio || {}
      const endereco = neg.complemento || neg.endereco || 'IMOVEL'
      const prefix = isEscritura ? 'ESCRITURA' : 'CV'
      a.download = `${prefix} - ${endereco.toUpperCase()}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <div className="text-[11px] font-medium tracking-widest uppercase text-[#B8860B] mb-2">Passo 3 de 3</div>
        <h1 className="font-serif text-2xl text-[#1A1612] mb-2">Assinaturas e Geração</h1>
        <p className="text-sm text-[#4A3F35] leading-relaxed">Confirme as partes e baixe o contrato em .docx.</p>
      </div>

      {/* Signatários */}
      <div className="bg-white border border-black/10 rounded-xl p-5 shadow-sm mb-4">
        <div className="font-serif text-base font-semibold text-[#1A1612] mb-4 pb-3 border-b border-black/8 flex items-center gap-2">
          <PenTool size={15} /> Partes para Assinatura
        </div>
        <div className="grid grid-cols-2 gap-3">
          {signatarios.map((s, i) => (
            <div key={i} className="border border-black/10 rounded-xl p-3 bg-[#F5F0E8]">
              <div className="font-semibold text-sm text-[#1A1612]">{s.nome}</div>
              <div className="text-[11px] text-[#8A7A6A]">{s.role}</div>
              <div className="border-b border-[#1A1612] mt-6 mb-1 h-0.5" />
              <div className="text-[10px] text-[#8A7A6A]">Assinatura</div>
            </div>
          ))}
        </div>
      </div>

      {/* Download */}
      <div className="bg-white border border-black/10 rounded-xl p-5 shadow-sm mb-4">
        <div className="font-serif text-base font-semibold text-[#1A1612] mb-3 pb-3 border-b border-black/8 flex items-center gap-2">
          <FileText size={15} /> Gerar Documento
        </div>
        <p className="text-sm text-[#4A3F35] mb-4">
          Clique abaixo para gerar e baixar o{' '}
          {isEscritura ? 'instrumento de escritura' : 'instrumento de compra e venda'} em formato Word (.docx).
        </p>
        <button
          onClick={downloadDocx}
          disabled={generating}
          className="px-6 py-2.5 bg-[#1A1612] text-[#F5F0E8] rounded-lg text-sm font-semibold hover:bg-[#2D2520] disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {generating ? (
            <><Loader2 size={13} className="j-spin" /> Gerando...</>
          ) : (
            <><Download size={13} /> Baixar .docx</>
          )}
        </button>
      </div>

      <div className="flex justify-between pt-5 border-t border-black/10">
        <button
          onClick={onPrev}
          className="px-5 py-2.5 border border-black/15 rounded-lg text-sm text-[#4A3F35] hover:bg-black/5 transition-all"
        >← Voltar</button>
      </div>
    </div>
  )
}
