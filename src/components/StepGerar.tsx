'use client'

import { useState } from 'react'
import { PenTool, Mail, FileText, Loader2, Download, Printer, Pen, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { FormState } from '@/lib/types'

interface Props {
  form: FormState
  setForm: (v: FormState) => void
  onPrev: () => void
  tenantId?: string
}

export default function StepGerar({ form, setForm, onPrev, tenantId }: Props) {
  const [dsStatus, setDsStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [dsResult, setDsResult] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [formato, setFormato] = useState<'docx' | 'pdf'>('docx')
  const [dsAccount, setDsAccount] = useState('')
  const [dsMsg, setDsMsg] = useState('Prezado(a), encaminhamos para sua assinatura o Contrato de Locação intermediado pela Jaime Imobiliária. Por gentileza, assine digitalmente dentro do prazo estipulado.')

  // Build signatarios list from form (Aligned with API)
  const signatarios = [
    ...form.locadores.map(l => ({ nome: l.nome || 'LOCADOR', email: l.email || '', role: 'LOCADOR(A)' })),
    ...form.locatarios.map(l => ({ nome: l.nome || 'LOCATÁRIO', email: l.email || '', role: 'LOCATÁRIO(A)' })),
    ...(form.gnt === 'fiador' ? form.fiadores.flatMap(f => {
      const s = [{ nome: f.nome || 'FIADOR', email: f.email || '', role: 'FIADOR(A)' }]
      if (f.conjuge?.nome) s.push({ nome: f.conjuge.nome, email: f.conjuge.email || '', role: 'CÔNJUGE / OUTORGANTE' })
      return s
    }) : []),
    ...(form.gnt === 'imovel-cau' ? (form.garantia?.caucionantes || []).map((c: any) => ({
      nome: c.nome || 'CAUCIONANTE', email: c.email || '', role: 'CAUCIONANTE'
    })) : []),
    ...form.testemunhas.map((t, i) => ({ nome: t.nome || `TESTEMUNHA ${i + 1}`, email: t.email || '', role: 'TESTEMUNHA' })),
    { nome: 'JAIMERX IMOBILIÁRIA LTDA', email: 'juridico@jaimeimobiliaria.com.br', role: 'CNPJ 63.271.809/0001-78 · Intermediadora' },
  ]

  function gerarPdf() {
    const f = form
    const loc = (f.locadores || []).map((l: any) => l.nome || '').filter(Boolean).join(', ')
    const loc_t = (f.locatarios || []).map((l: any) => l.nome || '').filter(Boolean).join(', ')
    const imovel = f.imovel || {}
    const valor = f.valor || {}
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Contrato de Locação</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12pt; color: #111; margin: 40px; line-height: 1.6; }
  h1 { text-align: center; font-size: 14pt; text-transform: uppercase; margin-bottom: 4px; }
  h2 { font-size: 12pt; text-transform: uppercase; margin-top: 24px; margin-bottom: 4px; }
  .resumo { border: 1px solid #ccc; border-collapse: collapse; width: 100%; margin: 16px 0; }
  .resumo td { border: 1px solid #ccc; padding: 6px 10px; font-size: 11pt; }
  .resumo td:first-child { font-weight: bold; width: 30%; background: #f5f5f5; }
  p { text-align: justify; margin: 8px 0; }
  @media print { body { margin: 20px; } }
</style></head><body>
<h1>Contrato de Locação Residencial</h1>
<table class="resumo">
  <tr><td>Locador(es)</td><td>${loc || '—'}</td></tr>
  <tr><td>Locatário(s)</td><td>${loc_t || '—'}</td></tr>
  <tr><td>Imóvel</td><td>${imovel.endereco || '—'}${imovel.numero ? ', ' + imovel.numero : ''}${imovel.complemento ? ' — ' + imovel.complemento : ''}, ${imovel.bairro || ''}, ${imovel.cidade || ''} - ${imovel.uf || ''}</td></tr>
  <tr><td>Valor do aluguel</td><td>R$ ${valor.aluguel || '—'}</td></tr>
  <tr><td>Vigência</td><td>${valor.prazo || '—'} meses</td></tr>
  <tr><td>Vencimento</td><td>Dia ${valor.vencimento || '—'} de cada mês</td></tr>
  <tr><td>Índice de reajuste</td><td>${valor.indice || '—'}, ${valor.reajuste || '—'}</td></tr>
  <tr><td>Garantia</td><td>${f.gnt ? f.gnt.toUpperCase() : '—'}</td></tr>
</table>
<p><em>Este documento foi gerado pelo sistema Papaia. Para o contrato completo em formato Word com todas as cláusulas, use a opção de download .docx.</em></p>
<script>window.onload = function(){ window.print(); }</script>
</body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  async function downloadDocx() {
    setGenerating(true)
    try {
      const res = await fetch('/api/gerar-contrato', {
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
      const imovel = form.imovel?.complemento || form.imovel?.endereco || 'contrato'
      const gnt = form.gnt?.toUpperCase() || 'CONTRATO'
      a.download = `LOCAÇÃO - ${gnt} - ${imovel.toUpperCase()}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setGenerating(false)
    }
  }

  async function enviarDocuSign() {
    if (!signatarios.some(s => s.email)) {
      alert('Preencha os e-mails dos signatários antes de enviar via DocuSign.')
      return
    }

    setDsStatus('loading')
    try {
      // First generate the contract
      const contractRes = await fetch('/api/gerar-contrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const contractBuffer = await contractRes.arrayBuffer()
      const contractBase64 = btoa(String.fromCharCode(...new Uint8Array(contractBuffer)))

      // Send to DocuSign
      const dsRes = await fetch('/api/docusign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatarios,
          assunto: `Contrato de Locação · ${form.imovel?.complemento || form.imovel?.endereco || 'Jaime Imobiliária'}`,
          mensagem: dsMsg,
          contractBase64,
          accountId: dsAccount || undefined,
        }),
      })

      const result = await dsRes.json()
      if (!dsRes.ok) {
        setDsStatus('error')
        setDsResult(result)
      } else {
        setDsStatus('done')
        setDsResult(result)
      }
    } catch (e: any) {
      setDsStatus('error')
      setDsResult({ error: e.message })
    }
  }

  return (
    <div>
      <div className="mb-7">
        <div className="text-[11px] font-medium tracking-widest uppercase text-[#B8860B] mb-2">Passo 4 de 4</div>
        <h1 className="font-serif text-2xl text-[#1A1612] mb-2">Assinaturas e Geração</h1>
        <p className="text-sm text-[#4A3F35] leading-relaxed">Confirme as partes, baixe o .docx ou envie para DocuSign.</p>
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
              {s.email && <div className="text-[11px] text-[#B8860B] mt-1 flex items-center gap-1"><Mail size={11} /> {s.email}</div>}
              <div className="border-b border-[#1A1612] mt-6 mb-1 h-0.5" />
              <div className="text-[10px] text-[#8A7A6A]">Assinatura</div>
            </div>
          ))}
        </div>

        {/* Testemunhas */}
        <div className="mt-4 pt-4 border-t border-black/8">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#8A7A6A] mb-3">Testemunhas</div>
          <div className="grid grid-cols-2 gap-3">
            {form.testemunhas.map((t, i) => (
              <div key={i} className="flex flex-col gap-2">
                <label className="text-[11px] text-[#4A3F35]">Testemunha {i + 1}</label>
                <input type="text" value={t.nome || ''} onChange={e => {
                  const arr = [...form.testemunhas]
                  arr[i] = { ...arr[i], nome: e.target.value }
                  setForm({ ...form, testemunhas: arr })
                }}
                  className="px-2.5 py-1.5 border border-black/15 rounded-lg text-sm bg-[#F5F0E8] focus:outline-none focus:border-[#B8860B]"
                  placeholder="Nome completo" />
                <input type="text" value={t.cpf || ''} onChange={e => {
                  const arr = [...form.testemunhas]
                  arr[i] = { ...arr[i], cpf: e.target.value }
                  setForm({ ...form, testemunhas: arr })
                }}
                  className="px-2.5 py-1.5 border border-black/15 rounded-lg text-sm bg-[#F5F0E8] focus:outline-none focus:border-[#B8860B]"
                  placeholder="CPF" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Download */}
      <div className="bg-white border border-black/10 rounded-xl p-5 shadow-sm mb-4">
        <div className="font-serif text-base font-semibold text-[#1A1612] mb-3 pb-3 border-b border-black/8 flex items-center gap-2">
          <FileText size={15} /> Gerar Contrato
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <span style={{ fontSize:13, color:'var(--ink-m)', fontWeight:500 }}>Formato:</span>
          <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, cursor:'pointer' }}>
            <input type="radio" value="docx" checked={formato==='docx'} onChange={() => setFormato('docx')} />
            Word (.docx)
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, cursor:'pointer' }}>
            <input type="radio" value="pdf" checked={formato==='pdf'} onChange={() => setFormato('pdf')} />
            PDF (via impressão)
          </label>
        </div>
        {formato === 'docx' ? (
          <button onClick={downloadDocx} disabled={generating}
            className="px-6 py-2.5 bg-[#1A1612] text-[#F5F0E8] rounded-lg text-sm font-semibold hover:bg-[#2D2520] disabled:opacity-50 transition-all flex items-center gap-2">
            {generating ? <><Loader2 size={13} className="j-spin" /> Gerando...</> : <><Download size={13} /> Baixar .docx</>}
          </button>
        ) : (
          <button onClick={gerarPdf}
            className="px-6 py-2.5 bg-[#1A1612] text-[#F5F0E8] rounded-lg text-sm font-semibold hover:bg-[#2D2520] transition-all flex items-center gap-2">
            <Printer size={13} /> Abrir para imprimir / salvar PDF
          </button>
        )}
      </div>

      {/* DocuSign */}
      <div className="border-2 border-[#3B4EDE] rounded-xl p-5 bg-[#3B4EDE]/[0.03] mb-4">
        <div className="text-base font-semibold text-[#3B4EDE] flex items-center gap-2 mb-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#3B4EDE"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          Enviar via DocuSign
        </div>
        <p className="text-sm text-[#4A3F35] mb-4">
          Gera o contrato e cria um envelope DocuSign com todos os signatários. Cada parte recebe o documento por e-mail para assinatura digital com validade jurídica (MP 2.200-2, Decreto 8.539/15).
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[#4A3F35]">Account ID (deixe vazio para usar env var)</label>
            <input type="text" value={dsAccount} onChange={e => setDsAccount(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="px-2.5 py-1.5 border border-black/15 rounded-lg text-xs font-mono bg-[#F5F0E8] focus:outline-none focus:border-[#3B4EDE]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[#4A3F35]">E-mails dos signatários preenchidos</label>
            <div className="text-sm text-[#4A3F35] bg-[#F5F0E8] px-2.5 py-1.5 rounded-lg border border-black/10">
              {signatarios.filter(s => s.email).length} / {signatarios.length} com e-mail
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 mb-4">
          <label className="text-[11px] font-medium text-[#4A3F35]">Mensagem para os signatários</label>
          <textarea value={dsMsg} onChange={e => setDsMsg(e.target.value)} rows={2}
            className="px-2.5 py-1.5 border border-black/15 rounded-lg text-sm bg-[#F5F0E8] focus:outline-none focus:border-[#3B4EDE] resize-none" />
        </div>
        <button onClick={enviarDocuSign} disabled={dsStatus === 'loading'}
          className="px-6 py-2.5 bg-[#3B4EDE] text-white rounded-lg text-sm font-semibold hover:bg-[#2D3ECC] disabled:opacity-50 transition-all flex items-center gap-2">
          {dsStatus === 'loading' ? <><Loader2 size={13} className="j-spin" /> Enviando...</> : <><Pen size={13} /> Enviar via DocuSign</>}
        </button>

        {dsStatus === 'done' && dsResult && (
          <div className="mt-4 p-3 bg-[#3B4EDE]/8 border border-[#3B4EDE]/25 rounded-lg text-sm text-[#3B4EDE]">
            <CheckCircle2 size={14} className="inline mr-1" /> Envelope criado com sucesso — ID: <code className="font-mono text-xs">{dsResult.envelopeId}</code>
            <br /><span className="text-xs text-[#6B7DB3]">Status: {dsResult.status} · Signatários notificados por e-mail</span>
          </div>
        )}
        {dsStatus === 'error' && dsResult && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertTriangle size={13} className="inline mr-1" /> {dsResult.error} {dsResult.detail && <span className="text-xs block mt-1 font-mono">{JSON.stringify(dsResult.detail)}</span>}
          </div>
        )}
      </div>

      <div className="j-btn-row">
        <button onClick={onPrev} className="j-btn j-btn-out">← Voltar</button>
      </div>
    </div>
  )
}
