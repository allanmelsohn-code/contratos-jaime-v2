'use client'

import { useState, useRef, type ReactNode } from 'react'
import { Home, Users, Handshake, MapPin, Shield, Banknote, BarChart3, Plus } from 'lucide-react'
import type { FormState, ExtractedDoc } from '@/lib/types'

// ── Slot definitions ──────────────────────────────────────────────────────────

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
  { docType: 'rg',                 label: 'Identidade (RG / CNH)' },
  { docType: 'certidao_civil',     label: 'Certidão de Estado Civil' },
  { docType: 'comprovante',        label: 'Comprovante de Residência' },
  { docType: 'rg_conjuge',         label: 'Identidade do Cônjuge' },
  { docType: 'certidao_casamento', label: 'Certidão de Casamento' },
]
const SLOTS_IMOVEL = [
  { docType: 'matricula', label: 'Matrícula do Imóvel' },
  { docType: 'iptu',      label: 'IPTU' },
]

const EXTRACT_FIELDS: Record<string, string[]> = {
  rg:                 ['nome','cpf','rg','orgao_expedidor','data_nascimento','naturalidade','filiacao_mae','filiacao_pai','endereco','numero','bairro','cidade','uf','cep','estado_civil','nacionalidade','profissao'],
  certidao_civil:     ['estado_civil','regime','nome','cpf','data_nascimento'],
  comprovante:        ['endereco','numero','complemento','bairro','cidade','uf','cep','nome'],
  banco:              ['banco','agencia','conta','pix','nome'],
  cnpj:               ['cnpj','razao_social','endereco','numero','complemento','bairro','cidade','uf','cep'],
  rg_conjuge:         ['nome','cpf','rg','orgao_expedidor','data_nascimento','estado_civil'],
  certidao_casamento: ['estado_civil','regime','nome_conjuge','cpf_conjuge'],
  matricula:          ['numero_matricula','comarca','cartorio','endereco_imovel','area_total','area_util','proprietario'],
  iptu:               ['endereco_imovel','area_total','valor_iptu'],
}

// ── Manual fill fields (FormState keys) ──────────────────────────────────────

type ManualField = { key: string; label: string }

const MANUAL_PESSOA: Record<string, ManualField[]> = {
  rg: [
    { key: 'nome', label: 'Nome completo' },
    { key: 'cpf',  label: 'CPF' },
    { key: 'rg',   label: 'RG' },
    { key: 'orgao', label: 'Órgão expedidor' },
    { key: 'dataNasc', label: 'Data de nascimento' },
    { key: 'nacionalidade', label: 'Nacionalidade' },
    { key: 'naturalidade',  label: 'Naturalidade' },
    { key: 'profissao',     label: 'Profissão' },
    { key: 'estadoCivil',   label: 'Estado civil' },
    { key: 'regime',        label: 'Regime de bens' },
    { key: 'endereco',    label: 'Endereço' },
    { key: 'numero',      label: 'Número' },
    { key: 'complemento', label: 'Complemento' },
    { key: 'bairro',      label: 'Bairro' },
    { key: 'cidade',      label: 'Cidade' },
    { key: 'uf',          label: 'UF' },
    { key: 'cep',         label: 'CEP' },
  ],
  certidao_civil: [
    { key: 'estadoCivil', label: 'Estado civil' },
    { key: 'regime',      label: 'Regime de bens' },
  ],
  comprovante: [
    { key: 'endereco',    label: 'Endereço' },
    { key: 'numero',      label: 'Número' },
    { key: 'complemento', label: 'Complemento' },
    { key: 'bairro',      label: 'Bairro' },
    { key: 'cidade',      label: 'Cidade' },
    { key: 'uf',          label: 'UF' },
    { key: 'cep',         label: 'CEP' },
  ],
  banco: [
    { key: 'banco',   label: 'Banco' },
    { key: 'agencia', label: 'Agência' },
    { key: 'conta',   label: 'Conta' },
    { key: 'pix',     label: 'PIX' },
  ],
  cnpj: [
    { key: 'nome',     label: 'Razão social' },
    { key: 'cnpj',     label: 'CNPJ' },
    { key: 'endereco', label: 'Endereço' },
    { key: 'numero',   label: 'Número' },
    { key: 'bairro',   label: 'Bairro' },
    { key: 'cidade',   label: 'Cidade' },
    { key: 'uf',       label: 'UF' },
    { key: 'cep',      label: 'CEP' },
  ],
  rg_conjuge: [
    { key: '_cj_nome',        label: 'Nome do cônjuge' },
    { key: '_cj_cpf',         label: 'CPF do cônjuge' },
    { key: '_cj_rg',          label: 'RG do cônjuge' },
    { key: '_cj_estadoCivil', label: 'Estado civil' },
    { key: '_cj_regime',      label: 'Regime de bens' },
  ],
  certidao_casamento: [
    { key: 'estadoCivil', label: 'Estado civil (casado)' },
    { key: 'regime',      label: 'Regime de bens' },
    { key: '_cj_nome',    label: 'Nome do cônjuge' },
    { key: '_cj_cpf',     label: 'CPF do cônjuge' },
  ],
}

const MANUAL_IMOVEL: Record<string, ManualField[]> = {
  matricula: [
    { key: 'matricula',    label: 'Nº da matrícula' },
    { key: 'comarca',      label: 'Comarca' },
    { key: 'cartorio',     label: 'Cartório' },
    { key: 'endereco',     label: 'Endereço do imóvel' },
    { key: 'numero',       label: 'Número' },
    { key: 'complemento',  label: 'Complemento' },
    { key: 'bairro',       label: 'Bairro' },
    { key: 'cidade',       label: 'Cidade' },
    { key: 'uf',           label: 'UF' },
    { key: 'cep',          label: 'CEP' },
    { key: 'areaTotal',    label: 'Área total (m²)' },
    { key: 'areaUtil',     label: 'Área útil (m²)' },
    { key: 'proprietario', label: 'Proprietário registrado' },
  ],
  iptu: [
    { key: 'endereco',  label: 'Endereço do imóvel' },
    { key: 'numero',    label: 'Número' },
    { key: 'bairro',    label: 'Bairro' },
    { key: 'cidade',    label: 'Cidade' },
    { key: 'uf',        label: 'UF' },
    { key: 'areaTotal', label: 'Área total (m²)' },
  ],
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── SlotRow ───────────────────────────────────────────────────────────────────

function SlotRow({ label, state, onUpload, onManualSave, manualFields }: {
  label: string
  state: SlotState
  onUpload: (f: File) => void
  onManualSave: (data: Record<string, string>) => void
  manualFields: ManualField[]
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [vals, setVals] = useState<Record<string, string>>({})

  const isDone  = state.status === 'done'
  const isLoad  = state.status === 'loading'
  const isError = state.status === 'error'

  function salvar() { onManualSave(vals); setShowForm(false) }

  return (
    <div style={{ borderBottom: '1px solid var(--border-s)', paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => ref.current?.click()} disabled={isLoad} style={{
          fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 7,
          border: `1.5px solid ${isDone ? '#86EFAC' : 'var(--border)'}`,
          background: isDone ? '#DCFCE7' : 'var(--cream)',
          color: isDone ? '#166534' : 'var(--ink-m)', cursor: isLoad ? 'wait' : 'pointer', flexShrink: 0,
        }}>
          {isLoad ? '⏳' : isDone ? '✅' : '📎'} Upload
        </button>

        {manualFields.length > 0 && (
          <button onClick={() => setShowForm(v => !v)} style={{
            fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 7,
            border: `1.5px solid ${showForm ? 'var(--tenant-primary)' : 'var(--border)'}`,
            background: showForm ? 'var(--tenant-primary-p)' : 'var(--cream)',
            color: showForm ? 'var(--tenant-primary-d)' : 'var(--ink-m)', cursor: 'pointer', flexShrink: 0,
          }}>
            ✏️ Preencher
          </button>
        )}

        <input ref={ref} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{label}</div>
          {isDone && (
            <div style={{ fontSize: 11, color: 'var(--sage)', marginTop: 2 }}>
              {state.extracted?.nome || state.extracted?.razao_social || state.extracted?.banco || state.extracted?.numero_matricula || vals.nome || vals.matricula || '✓ preenchido'}
            </div>
          )}
          {isError && <div style={{ fontSize: 11, color: 'var(--coral)', marginTop: 2 }}>{state.error}</div>}
        </div>

        {state.status === 'idle' && <span style={{ fontSize: 11, color: 'var(--ink-f)', flexShrink: 0 }}>Não enviado</span>}
      </div>

      {showForm && (
        <div style={{ marginTop: 10, padding: '12px 14px', background: 'var(--cream)', borderRadius: 8, border: '1px solid var(--border-s)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 10 }}>
            {manualFields.map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-m)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {f.label}
                </label>
                <input value={vals[f.key] || ''} onChange={e => setVals(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, background: '#fff', color: 'var(--ink)', outline: 'none' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--ink-m)' }}>
              Cancelar
            </button>
            <button onClick={salvar} style={{ fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 7, border: 'none', background: 'var(--tenant-primary)', color: '#fff', cursor: 'pointer' }}>
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const GNT_OPTIONS = [
  { id: 'fiador',     icon: <Users size={16} />,      label: 'Fiador',               desc: 'Pessoa física garantidora' },
  { id: 'seguro',     icon: <Shield size={16} />,     label: 'Seguro Fiança',        desc: 'Apólice de seguro' },
  { id: 'caucao',     icon: <Banknote size={16} />,   label: 'Caução',               desc: 'Depósito em dinheiro' },
  { id: 'titulo',     icon: <BarChart3 size={16} />,  label: 'Título Capitalização', desc: 'Título em garantia' },
  { id: 'imovel-cau', icon: <Home size={16} />,       label: 'Imóvel Caucionado',    desc: 'Garantia real em imóvel · art. 38 §1º' },
]

const ROLE_META = {
  locador:   { label: 'Locador',   slots: SLOTS_LOCADOR,   color: '#92400E', bg: '#FEF3C7', border: '#F59E0B' },
  locatario: { label: 'Locatário', slots: SLOTS_LOCATARIO, color: '#1E40AF', bg: '#DBEAFE', border: '#60A5FA' },
  fiador:    { label: 'Fiador',    slots: SLOTS_FIADOR,    color: '#5B21B6', bg: '#EDE9FE', border: '#A78BFA' },
}

export default function StepUpload({ docs, setDocs, form, setForm, onNext }: Props) {
  const [cards, setCards] = useState<PersonCard[]>([
    { id: 'locador-1',   role: 'locador',   index: 1, slots: newSlots(SLOTS_LOCADOR) },
    { id: 'locatario-1', role: 'locatario', index: 1, slots: newSlots(SLOTS_LOCATARIO) },
  ])
  const [imovelSlots, setImovelSlots] = useState<Record<string, SlotState>>(newSlots(SLOTS_IMOVEL))

  function addCard(role: 'locador' | 'locatario' | 'fiador') {
    const idx = cards.filter(c => c.role === role).length + 1
    const defs = role === 'locador' ? SLOTS_LOCADOR : role === 'locatario' ? SLOTS_LOCATARIO : SLOTS_FIADOR
    setCards(prev => [...prev, { id: `${role}-${idx}-${Date.now()}`, role, index: idx, slots: newSlots(defs) }])
  }

  function removeCard(id: string) { setCards(prev => prev.filter(c => c.id !== id)) }

  function setGnt(gnt: FormState['gnt']) {
    setForm(prev => ({ ...prev, gnt }))
    if (gnt === 'fiador' && !cards.find(c => c.role === 'fiador')) {
      setCards(prev => [...prev, { id: 'fiador-1', role: 'fiador', index: 1, slots: newSlots(SLOTS_FIADOR) }])
    }
  }

  function setSlotState(cardId: string | 'imovel', docType: string, s: SlotState) {
    if (cardId === 'imovel') setImovelSlots(prev => ({ ...prev, [docType]: s }))
    else setCards(prev => prev.map(c => c.id === cardId ? { ...c, slots: { ...c.slots, [docType]: s } } : c))
  }

  async function runOCR(cardId: string | 'imovel', docType: string, file: File) {
    const card    = cardId !== 'imovel' ? cards.find(c => c.id === cardId) : null
    const role    = cardId === 'imovel' ? 'imovel' : (card?.role ?? 'locatario')
    const cardIdx = (card?.index ?? 1) - 1

    setSlotState(cardId, docType, { file, status: 'loading' })
    try {
      const b64 = await toBase64(file)
      const res = await fetch('/api/ocr', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, imageBase64: b64, mimeType: file.type || 'image/jpeg', explicitRole: role, explicitDocType: docType, extractFields: EXTRACT_FIELDS[docType] || [] }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setSlotState(cardId, docType, { file, status: 'error', error: data.error || 'Erro' }); return }
      const e = data.extracted || {}
      setSlotState(cardId, docType, { file, status: 'done', extracted: e })
      mergeIntoForm(cardId, role, cardIdx, e)
    } catch (err: any) { setSlotState(cardId, docType, { file, status: 'error', error: err.message }) }
  }

  function handleManualSave(cardId: string | 'imovel', role: string, cardIdx: number, docType: string, data: Record<string, string>) {
    setSlotState(cardId, docType, { status: 'done', extracted: data })
    if (cardId === 'imovel') {
      setForm(prev => ({ ...prev, imovel: { ...prev.imovel, ...data } }))
    } else {
      const roleKey = role === 'locador' ? 'locadores' : role === 'locatario' ? 'locatarios' : 'fiadores'
      setForm(prev => {
        const arr = [...(prev[roleKey as keyof FormState] as any[])]
        while (arr.length <= cardIdx) arr.push({})
        const ex = arr[cardIdx] || {}
        const conjuge: any = { ...(ex.conjuge || {}) }
        const pessoa: any  = { ...ex }
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('_cj_')) conjuge[k.replace('_cj_', '')] = v
          else pessoa[k] = v
        }
        arr[cardIdx] = { ...pessoa, conjuge }
        return { ...prev, [roleKey]: arr }
      })
    }
  }

  function mergeIntoForm(cardId: string | 'imovel', role: string, cardIdx: number, e: Record<string, any>) {
    if (cardId === 'imovel') {
      setForm(prev => ({ ...prev, imovel: { ...prev.imovel,
        ...(e.numero_matricula && { matricula: e.numero_matricula }),
        ...(e.comarca          && { comarca: e.comarca }),
        ...(e.cartorio         && { cartorio: e.cartorio }),
        ...((e.endereco_imovel || e.endereco) && { endereco: e.endereco_imovel || e.endereco }),
        ...(e.numero    && { numero: e.numero }),    ...(e.bairro    && { bairro: e.bairro }),
        ...(e.cidade    && { cidade: e.cidade }),    ...(e.uf        && { uf: e.uf }),
        ...(e.cep       && { cep: e.cep }),          ...(e.area_total && { areaTotal: e.area_total }),
        ...(e.area_util && { areaUtil: e.area_util }), ...(e.proprietario && { proprietario: e.proprietario }),
      }}))
    } else {
      const roleKey = role === 'locador' ? 'locadores' : role === 'locatario' ? 'locatarios' : 'fiadores'
      setForm(prev => {
        const arr = [...(prev[roleKey as keyof FormState] as any[])]
        while (arr.length <= cardIdx) arr.push({})
        const ex = arr[cardIdx] || {}
        arr[cardIdx] = { ...ex,
          ...(e.nome            && { nome: e.nome }),            ...(e.razao_social    && { nome: e.razao_social }),
          ...(e.cpf             && { cpf: e.cpf }),              ...(e.cnpj            && { cnpj: e.cnpj }),
          ...(e.rg              && { rg: e.rg }),                ...(e.orgao_expedidor && { orgao: e.orgao_expedidor }),
          ...(e.data_nascimento && { dataNasc: e.data_nascimento }),
          ...(e.naturalidade    && { naturalidade: e.naturalidade }),
          ...(e.nacionalidade   && { nacionalidade: e.nacionalidade }),
          ...(e.profissao       && { profissao: e.profissao }),
          ...(e.estado_civil    && { estadoCivil: e.estado_civil }),
          ...(e.regime          && { regime: e.regime }),
          ...(e.filiacao_mae    && { maternidade: e.filiacao_mae }),
          ...(e.filiacao_pai    && { paternidade: e.filiacao_pai }),
          ...(e.endereco        && { endereco: e.endereco }),    ...(e.numero          && { numero: e.numero }),
          ...(e.complemento     && { complemento: e.complemento }), ...(e.bairro       && { bairro: e.bairro }),
          ...(e.cidade          && { cidade: e.cidade }),        ...(e.uf              && { uf: e.uf }),
          ...(e.cep             && { cep: e.cep }),              ...(e.banco           && { banco: e.banco }),
          ...(e.agencia         && { agencia: e.agencia }),      ...(e.conta           && { conta: e.conta }),
          ...(e.pix             && { pix: e.pix }),
          ...(e.nome_conjuge    && { conjuge: { ...(ex.conjuge||{}), nome: e.nome_conjuge } }),
          ...(e.cpf_conjuge     && { conjuge: { ...(ex.conjuge||{}), cpf:  e.cpf_conjuge  } }),
        }
        return { ...prev, [roleKey]: arr }
      })
    }
  }

  function renderSection(role: 'locador' | 'locatario' | 'fiador', title: ReactNode, sCards: PersonCard[], required = false) {
    const meta = ROLE_META[role]
    return (
      <div className="j-card" style={{ borderTop: `3px solid ${meta.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div className="j-card-title" style={{ marginBottom: 2 }}>{title}</div>
            {required && <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 700 }}>● Obrigatório para este modelo</span>}
          </div>
        </div>

        {sCards.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--ink-f)', fontStyle: 'italic', marginBottom: 12 }}>
            Nenhum {meta.label.toLowerCase()} adicionado.
          </div>
        )}

        {sCards.map((card, i) => (
          <div key={card.id} style={{ border: `1.5px solid ${meta.border}`, borderRadius: 10, padding: '14px', marginBottom: 12, background: meta.bg + '44' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>
                {meta.label} {sCards.length > 1 ? i + 1 : ''}
              </span>
              {sCards.length > 1 && (
                <button onClick={() => removeCard(card.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-f)', fontSize: 14 }}>✕</button>
              )}
            </div>
            {meta.slots.map(slot => (
              <SlotRow
                key={slot.docType}
                label={slot.label}
                state={card.slots[slot.docType] || { status: 'idle' }}
                onUpload={file => runOCR(card.id, slot.docType, file)}
                onManualSave={data => handleManualSave(card.id, card.role, card.index - 1, slot.docType, data)}
                manualFields={MANUAL_PESSOA[slot.docType] || []}
              />
            ))}
          </div>
        ))}

        <button onClick={() => addCard(role)} style={{
          width: '100%', padding: '13px 0', borderRadius: 10, marginTop: 2,
          border: `2px dashed ${meta.border}`, background: 'transparent',
          color: meta.color, fontWeight: 700, fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
          onMouseOver={e => (e.currentTarget.style.background = meta.bg + '66')}
          onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}
        >
          <Plus size={14} /> Adicionar {meta.label}
        </button>
      </div>
    )
  }

  const locadores  = cards.filter(c => c.role === 'locador')
  const locatarios = cards.filter(c => c.role === 'locatario')
  const fiadores   = cards.filter(c => c.role === 'fiador')

  return (
    <div>
      <div className="j-eyebrow">Passo 1 de 4</div>
      <h1 className="j-title">Modelo e Documentos</h1>
      <p className="j-desc">Selecione o modelo de contrato e faça upload ou preencha manualmente os documentos de cada parte.</p>

      {/* ── Modelo ── */}
      <div className="j-card" style={{ borderTop: '3px solid var(--tenant-primary)' }}>
        <div className="j-card-title"><Shield size={15} /> Modelo de Contrato — Tipo de Garantia</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {GNT_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setGnt(opt.id as FormState['gnt'])} style={{
              padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
              border: `2px solid ${form.gnt === opt.id ? 'var(--tenant-primary)' : 'var(--border-s)'}`,
              background: form.gnt === opt.id ? 'var(--tenant-primary-p)' : '#fff',
              position: 'relative', transition: 'all .15s',
            }}>
              {form.gnt === opt.id && (
                <span style={{
                  position: 'absolute', top: 6, right: 8, width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--tenant-primary)', color: '#fff', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✓</span>
              )}
              <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-f)', marginTop: 2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Partes ── */}
      {renderSection('locador',   <><Home size={15} /> Locadores</>,   locadores)}
      {renderSection('locatario', <><Users size={15} /> Locatários</>, locatarios)}
      {form.gnt === 'fiador'
        ? renderSection('fiador', <><Handshake size={15} /> Fiadores</>,            fiadores, true)
        : renderSection('fiador', <><Handshake size={15} /> Fiadores (opcional)</>, fiadores, false)
      }

      {/* ── Imóvel ── */}
      <div className="j-card" style={{ borderTop: '3px solid #86EFAC' }}>
        <div className="j-card-title"><MapPin size={15} /> Imóvel</div>
        {SLOTS_IMOVEL.map(slot => (
          <SlotRow
            key={slot.docType}
            label={slot.label}
            state={imovelSlots[slot.docType] || { status: 'idle' }}
            onUpload={file => runOCR('imovel', slot.docType, file)}
            onManualSave={data => handleManualSave('imovel', 'imovel', 0, slot.docType, data)}
            manualFields={MANUAL_IMOVEL[slot.docType] || []}
          />
        ))}
      </div>

      <div className="j-btn-row">
        <span />
        <button onClick={onNext} className="j-btn j-btn-gold">Revisar Dados →</button>
      </div>
    </div>
  )
}
