'use client'

import { useState, useRef } from 'react'
import type { FormState, ExtractedDoc } from '@/lib/types'

const SLOTS_LOCADOR = [
  { docType: 'rg',             label: 'Identidade (RG / CNH)' },
  { docType: 'certidao_civil', label: 'Certidão de Estado Civil' },
  { docType: 'comprovante',    label: 'Comprovante de Endereço' },
  { docType: 'banco',          label: 'Dados Bancários' },
]
const SLOTS_LOCATARIO = [
  { docType: 'rg',             label: 'Identidade (RG / CNH)' },
  { docType: 'certidao_civil', label: 'Certidão de Estado Civil' },
  { docType: 'comprovante',    label: 'Comprovante de Residência' },
  { docType: 'cnpj',           label: 'CNPJ (se Pessoa Jurídica)' },
]
const SLOTS_FIADOR = [
  { docType: 'rg',                label: 'Identidade (RG / CNH)' },
  { docType: 'certidao_civil',    label: 'Certidão de Estado Civil' },
  { docType: 'comprovante',       label: 'Comprovante de Residência' },
  { docType: 'rg_conjuge',        label: 'Identidade do Cônjuge' },
  { docType: 'certidao_casamento',label: 'Certidão de Casamento' },
]
const SLOTS_IMOVEL = [
  { docType: 'matricula', label: 'Matrícula do Imóvel' },
  { docType: 'iptu',      label: 'IPTU' },
]

const EXTRACT_FIELDS: Record<string, string[]> = {
  rg:                ['nome','cpf','rg','orgao_expedidor','data_nascimento','naturalidade','filiacao_mae','filiacao_pai','endereco','numero','bairro','cidade','uf','cep','estado_civil','nacionalidade','profissao'],
  certidao_civil:    ['estado_civil','regime','nome','cpf','data_nascimento'],
  comprovante:       ['endereco','numero','complemento','bairro','cidade','uf','cep','nome'],
  banco:             ['banco','agencia','conta','pix','nome'],
  cnpj:              ['cnpj','razao_social','endereco','numero','complemento','bairro','cidade','uf','cep'],
  rg_conjuge:        ['nome','cpf','rg','orgao_expedidor','data_nascimento','estado_civil'],
  certidao_casamento:['estado_civil','regime','nome_conjuge','cpf_conjuge'],
  matricula:         ['numero_matricula','comarca','cartorio','endereco_imovel','area_total','area_util','proprietario'],
  iptu:              ['endereco_imovel','area_total','valor_iptu'],
}

type SlotState = {
  file?: File
  status: 'idle' | 'loading' | 'done' | 'error'
  extracted?: Record<string, any>
  error?: string
}

type PersonCard = {
  id: string
  role: 'locador' | 'locatario' | 'fiador'
  index: number
  slots: Record<string, SlotState>
}

interface Props {
  docs: ExtractedDoc[]
  setDocs: (v: ExtractedDoc[]) => void
  form: FormState
  setForm: (v: FormState | ((prev: FormState) => FormState)) => void
  onNext: () => void
}

function newSlots(defs: { docType: string }[]): Record<string, SlotState> {
  return Object.fromEntries(defs.map(d => [d.docType, { status: 'idle' as const }]))
}

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload  = () => res((r.result as string).split(',')[1])
    r.onerror = () => rej(new Error('read failed'))
    r.readAsDataURL(file)
  })
}

function SlotRow({ label, docType, state, onUpload }: {
  label: string; docType: string; state: SlotState; onUpload: (f: File) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const isDone  = state.status === 'done'
  const isLoad  = state.status === 'loading'
  const isError = state.status === 'error'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid var(--border-s)' }}>
      <button
        onClick={() => ref.current?.click()}
        disabled={isLoad}
        style={{
          flexShrink:0, fontSize:11, fontWeight:600, padding:'5px 12px',
          borderRadius:7, border:'1px solid var(--border)',
          background: isDone ? '#DCFCE7' : 'var(--cream)',
          color: isDone ? '#166534' : 'var(--ink-m)',
          cursor: isLoad ? 'wait' : 'pointer',
          minWidth: 72,
        }}
      >
        {isLoad ? '⏳' : isDone ? '✅' : '📎'} Upload
      </button>
      <input ref={ref} type="file" accept="image/*,.pdf" style={{ display:'none' }}
        onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:500, color:'var(--ink)' }}>{label}</div>
        {isDone && state.extracted && (
          <div style={{ fontSize:11, color:'var(--sage)', marginTop:2 }}>
            {state.extracted.nome || state.extracted.razao_social || state.extracted.banco || state.extracted.numero_matricula || '✓ extraído'}
          </div>
        )}
        {isError && (
          <div style={{ fontSize:11, color:'var(--coral)', marginTop:2 }}>{state.error}</div>
        )}
      </div>
      {state.status === 'idle' && (
        <span style={{ fontSize:11, color:'var(--ink-f)', flexShrink:0 }}>Não enviado</span>
      )}
    </div>
  )
}

export default function StepUpload({ docs, setDocs, form, setForm, onNext }: Props) {
  const [cards, setCards] = useState<PersonCard[]>([
    { id: 'locador-1',   role: 'locador',   index: 1, slots: newSlots(SLOTS_LOCADOR) },
    { id: 'locatario-1', role: 'locatario', index: 1, slots: newSlots(SLOTS_LOCATARIO) },
  ])
  const [imovelSlots, setImovelSlots] = useState<Record<string, SlotState>>(newSlots(SLOTS_IMOVEL))

  function addCard(role: 'locador' | 'locatario' | 'fiador') {
    const existing = cards.filter(c => c.role === role)
    const idx = existing.length + 1
    const slotDefs = role === 'locador' ? SLOTS_LOCADOR : role === 'locatario' ? SLOTS_LOCATARIO : SLOTS_FIADOR
    setCards(prev => [...prev, { id: `${role}-${idx}-${Date.now()}`, role, index: idx, slots: newSlots(slotDefs) }])
  }

  function removeCard(id: string) {
    setCards(prev => prev.filter(c => c.id !== id))
  }

  async function runOCR(cardId: string | 'imovel', docType: string, file: File) {
    // Capture card info synchronously
    const card = cardId !== 'imovel' ? cards.find(c => c.id === cardId) : null
    const role  = cardId === 'imovel' ? 'imovel' : (card?.role ?? 'locatario')
    const cardIdx = (card?.index ?? 1) - 1

    const setSlot = (s: SlotState) => {
      if (cardId === 'imovel') {
        setImovelSlots(prev => ({ ...prev, [docType]: s }))
      } else {
        setCards(prev => prev.map(c => c.id === cardId ? { ...c, slots: { ...c.slots, [docType]: s } } : c))
      }
    }

    setSlot({ file, status: 'loading' })

    try {
      const b64 = await toBase64(file)
      const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          imageBase64: b64,
          mimeType,
          explicitRole: role,
          explicitDocType: docType,
          extractFields: EXTRACT_FIELDS[docType] || [],
        }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setSlot({ file, status: 'error', error: data.error || 'Erro na extração' })
        return
      }

      const e = data.extracted || {}
      setSlot({ file, status: 'done', extracted: e })

      if (cardId === 'imovel') {
        setForm(prev => ({
          ...prev,
          imovel: {
            ...prev.imovel,
            ...(e.numero_matricula && { matricula: e.numero_matricula }),
            ...(e.comarca         && { comarca:   e.comarca }),
            ...(e.cartorio        && { cartorio:  e.cartorio }),
            ...((e.endereco_imovel || e.endereco) && { endereco: e.endereco_imovel || e.endereco }),
            ...(e.numero   && { numero:   e.numero }),
            ...(e.bairro   && { bairro:   e.bairro }),
            ...(e.cidade   && { cidade:   e.cidade }),
            ...(e.uf       && { uf:       e.uf }),
            ...(e.cep      && { cep:      e.cep }),
            ...(e.area_total && { areaTotal: e.area_total }),
            ...(e.area_util  && { areaUtil:  e.area_util }),
            ...(e.proprietario && { proprietario: e.proprietario }),
          },
        }))
      } else {
        const roleKey = role === 'locador' ? 'locadores' : role === 'locatario' ? 'locatarios' : 'fiadores'
        setForm(prev => {
          const arr = [...(prev[roleKey as keyof FormState] as any[])]
          while (arr.length <= cardIdx) arr.push({})
          const ex = arr[cardIdx] || {}
          arr[cardIdx] = {
            ...ex,
            ...(e.nome           && { nome:         e.nome }),
            ...(e.razao_social   && { nome:         e.razao_social }),
            ...(e.cpf            && { cpf:          e.cpf }),
            ...(e.cnpj           && { cnpj:         e.cnpj }),
            ...(e.rg             && { rg:           e.rg }),
            ...(e.orgao_expedidor && { orgao:       e.orgao_expedidor }),
            ...(e.data_nascimento && { dataNasc:    e.data_nascimento }),
            ...(e.naturalidade   && { naturalidade: e.naturalidade }),
            ...(e.nacionalidade  && { nacionalidade:e.nacionalidade }),
            ...(e.profissao      && { profissao:    e.profissao }),
            ...(e.estado_civil   && { estadoCivil:  e.estado_civil }),
            ...(e.regime         && { regime:       e.regime }),
            ...(e.filiacao_mae   && { maternidade:  e.filiacao_mae }),
            ...(e.filiacao_pai   && { paternidade:  e.filiacao_pai }),
            ...(e.endereco       && { endereco:     e.endereco }),
            ...(e.numero         && { numero:       e.numero }),
            ...(e.complemento    && { complemento:  e.complemento }),
            ...(e.bairro         && { bairro:       e.bairro }),
            ...(e.cidade         && { cidade:       e.cidade }),
            ...(e.uf             && { uf:           e.uf }),
            ...(e.cep            && { cep:          e.cep }),
            ...(e.banco          && { banco:        e.banco }),
            ...(e.agencia        && { agencia:      e.agencia }),
            ...(e.conta          && { conta:        e.conta }),
            ...(e.pix            && { pix:          e.pix }),
            ...(e.nome_conjuge   && { conjuge: { ...(ex.conjuge||{}), nome: e.nome_conjuge } }),
            ...(e.cpf_conjuge    && { conjuge: { ...(ex.conjuge||{}), cpf:  e.cpf_conjuge  } }),
          }
          return { ...prev, [roleKey]: arr }
        })
      }
    } catch (err: any) {
      setSlot({ file, status: 'error', error: err.message })
    }
  }

  const ROLE_META = {
    locador:   { label: 'Locador',   slots: SLOTS_LOCADOR,   color: '#92400E', badge: '#FEF3C7' },
    locatario: { label: 'Locatário', slots: SLOTS_LOCATARIO, color: '#1E40AF', badge: '#DBEAFE' },
    fiador:    { label: 'Fiador',    slots: SLOTS_FIADOR,    color: '#5B21B6', badge: '#EDE9FE' },
  }

  function renderSection(
    title: string,
    role: 'locador' | 'locatario' | 'fiador',
    sCards: PersonCard[],
    optional = false,
  ) {
    const meta = ROLE_META[role]
    return (
      <div className="j-card" key={role}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div className="j-card-title" style={{ marginBottom:0 }}>{title}</div>
          <button onClick={() => addCard(role)} className="j-btn" style={{ fontSize:11, padding:'5px 12px' }}>
            + {meta.label}
          </button>
        </div>

        {optional && sCards.length === 0 && (
          <div style={{ fontSize:12, color:'var(--ink-f)', fontStyle:'italic' }}>Nenhum fiador adicionado.</div>
        )}

        {sCards.map((card, i) => (
          <div key={card.id} style={{ border:'1px solid var(--border-s)', borderRadius:10, padding:'12px 14px', marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600, color: meta.color }}>
                {meta.label} {sCards.length > 1 ? i + 1 : ''}
              </span>
              {sCards.length > 1 && (
                <button onClick={() => removeCard(card.id)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-f)', fontSize:14, lineHeight:1 }}>✕</button>
              )}
            </div>
            {meta.slots.map(slot => (
              <SlotRow
                key={slot.docType}
                label={slot.label}
                docType={slot.docType}
                state={card.slots[slot.docType] || { status: 'idle' }}
                onUpload={file => runOCR(card.id, slot.docType, file)}
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  const locadores  = cards.filter(c => c.role === 'locador')
  const locatarios = cards.filter(c => c.role === 'locatario')
  const fiadores   = cards.filter(c => c.role === 'fiador')

  return (
    <div>
      <div className="j-eyebrow">Passo 1 de 4</div>
      <h1 className="j-title">Documentos do Contrato</h1>
      <p className="j-desc">Faça upload de cada documento por pessoa. O Claude Vision extrai os dados automaticamente.</p>

      {renderSection('🏠 Locadores', 'locador', locadores)}
      {renderSection('🔑 Locatários', 'locatario', locatarios)}
      {renderSection('🤝 Fiadores (opcional)', 'fiador', fiadores, true)}

      <div className="j-card">
        <div className="j-card-title">📍 Imóvel</div>
        {SLOTS_IMOVEL.map(slot => (
          <SlotRow
            key={slot.docType}
            label={slot.label}
            docType={slot.docType}
            state={imovelSlots[slot.docType] || { status: 'idle' }}
            onUpload={file => runOCR('imovel', slot.docType, file)}
          />
        ))}
      </div>

      <div className="j-btn-row">
        <span />
        <button onClick={onNext} className="j-btn j-btn-gold">
          Revisar Dados →
        </button>
      </div>
    </div>
  )
}
