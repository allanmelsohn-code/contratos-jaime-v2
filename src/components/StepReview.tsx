'use client'

import { useEffect } from 'react'
import { Home, KeyRound, Handshake, Users, MapPin, HelpCircle, Paperclip } from 'lucide-react'
import type { ExtractedDoc, FormState } from '@/lib/types'

interface Props {
  docs: ExtractedDoc[]
  setDocs: (v: ExtractedDoc[]) => void
  form: FormState
  setForm: (v: FormState | ((prev: FormState) => FormState)) => void
  onNext: () => void
  onPrev: () => void
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-[#4A3F35] tracking-wide">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="px-2.5 py-1.5 border border-black/15 rounded-lg text-sm bg-[#F5F0E8] focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 text-[#1A1612]"
      />
    </div>
  )
}

const roleLabel: Record<string, React.ReactNode> = {
  locador:      <><Home size={13} /> Locador</>,
  locatario:    <><KeyRound size={13} /> Locatário</>,
  fiador:       <><Handshake size={13} /> Fiador</>,
  conjuge:      <><Users size={13} /> Cônjuge</>,
  imovel:       <><MapPin size={13} /> Imóvel</>,
  desconhecido: <><HelpCircle size={13} /> Desconhecido</>,
}

const fieldLabels: Record<string, string> = {
  nome: 'Nome completo',
  razao_social: 'Razão Social',
  cpf: 'CPF',
  cnpj: 'CNPJ',
  rg: 'RG',
  orgao_expedidor: 'Órgão expedidor',
  data_nascimento: 'Data de nascimento',
  nacionalidade: 'Nacionalidade',
  naturalidade: 'Naturalidade',
  profissao: 'Profissão',
  filiacao_mae: 'Mãe',
  filiacao_pai: 'Pai',
  estado_civil: 'Estado civil',
  regime: 'Regime de bens',
  endereco: 'Endereço',
  numero: 'Número',
  complemento: 'Complemento',
  bairro: 'Bairro',
  cidade: 'Cidade',
  uf: 'UF',
  cep: 'CEP',
  // Imóvel
  numero_matricula: 'Nº da matrícula',
  comarca: 'Comarca',
  cartorio: 'Cartório',
  endereco_imovel: 'Endereço do imóvel',
  area_total: 'Área total (m²)',
  area_util: 'Área útil (m²)',
  proprietario: 'Proprietário registrado',
  // Passaporte
  numero_passaporte: 'Nº do passaporte',
  pais_emissao: 'País de emissão',
  validade: 'Validade',
  // CNH
  numero_registro: 'Nº de registro',
  categoria: 'Categoria',
}

export default function StepReview({ docs, setDocs, form, setForm, onNext, onPrev }: Props) {

  // Build form from docs on mount / when docs change
  useEffect(() => {
    if (docs.length === 0) return

    const locadores: any[] = []
    const locatarios: any[] = []
    const fiadores: any[] = []
    let imovel: any = {}

    docs.forEach(doc => {
      if (doc.status !== 'done') return
      const { role, index } = doc.classification
      const e = doc.extracted

      const pessoa = {
        nome: e.nome || e.razao_social || '',
        cpf: e.cpf || '',
        cnpj: e.cnpj || '',
        rg: e.rg || '',
        orgao: e.orgao_expedidor || '',
        dataNasc: e.data_nascimento || '',
        nacionalidade: e.nacionalidade || 'brasileiro(a)',
        naturalidade: e.naturalidade || '',
        profissao: e.profissao || '',
        estadoCivil: e.estado_civil || '',
        regime: e.regime || '',
        maternidade: e.filiacao_mae || '',
        paternidade: e.filiacao_pai || '',
        // endereço
        endereco: e.endereco || e.logradouro || '',
        numero: e.numero || '',
        complemento: e.complemento || '',
        bairro: e.bairro || '',
        cidade: e.cidade || '',
        uf: e.uf || '',
        cep: e.cep || '',
        // passaporte
        passaporte: e.numero_passaporte || '',
        paisEmissao: e.pais_emissao || '',
        // contact (usually not in doc — filled manually)
        email: '',
        telefone: '',
        // bank (filled manually)
        banco: '', agencia: '', conta: '', pix: '', pixTipo: 'CPF',
        _docType: doc.classification.type,
        _source: doc.filename,
      }

      if (role === 'locador') {
        while (locadores.length < index) locadores.push({})
        locadores[index - 1] = { ...locadores[index - 1], ...pessoa }
      } else if (role === 'locatario') {
        while (locatarios.length < index) locatarios.push({})
        locatarios[index - 1] = { ...locatarios[index - 1], ...pessoa }
      } else if (role === 'fiador') {
        while (fiadores.length < index) fiadores.push({})
        fiadores[index - 1] = { ...fiadores[index - 1], ...pessoa }
      } else if (role === 'imovel') {
        imovel = {
          ...imovel,
          matricula: e.numero_matricula || '',
          comarca: e.comarca || '',
          cartorio: e.cartorio || '',
          endereco: e.endereco_imovel || e.endereco || '',
          numero: e.numero || '',
          complemento: e.complemento || '',
          bairro: e.bairro || '',
          cidade: e.cidade || 'São Paulo',
          uf: e.uf || 'SP',
          cep: e.cep || '',
          areaTotal: e.area_total || '',
          areaUtil: e.area_util || '',
          proprietario: e.proprietario || '',
          _source: doc.filename,
        }
      }
    })

    setForm(prev => ({
      ...prev,
      locadores: locadores.length ? locadores : prev.locadores,
      locatarios: locatarios.length ? locatarios : prev.locatarios,
      fiadores: fiadores.length ? fiadores : prev.fiadores,
      imovel: Object.keys(imovel).length ? { ...prev.imovel, ...imovel } : prev.imovel,
    }))
  }, [docs])

  function updatePessoa(arr: any[], setArr: (v: any[]) => void, idx: number, field: string, value: string) {
    const next = [...arr]
    next[idx] = { ...next[idx], [field]: value }
    setArr(next)
  }

  function PessoaCard({ pessoas, setPessoas, title, singleLabel }: { pessoas: any[]; setPessoas: (v: any[]) => void; title: React.ReactNode; singleLabel: string }) {
    if (!pessoas.length) return (
      <div className="text-sm text-[#8A7A6A] italic px-1">Nenhum documento detectado — preencha manualmente no passo seguinte.</div>
    )
    return (
      <>
        {pessoas.map((p, i) => (
          <div key={i} className="border border-black/10 rounded-xl p-4 bg-[#F5F0E8] mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-[#1A1612]">{title}{pessoas.length > 1 ? ` ${i + 1}` : ''}</span>
              {p._source && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-[#B8860B]/15 text-[#B8860B] px-2 py-0.5 rounded-full">
                  <Paperclip size={11} /> {p._source}
                </span>
              )}
              {p._docType && <span className="text-[10px] bg-black/8 text-[#4A3F35] px-2 py-0.5 rounded-full">{p._docType}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['nome', 'cpf', 'cnpj', 'rg', 'orgao', 'nacionalidade', 'dataNasc', 'profissao', 'estadoCivil', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep', 'email', 'telefone'].map(field => (
                (field === 'cnpj' ? p.cnpj : true) && (
                  <Field
                    key={field}
                    label={fieldLabels[field] || field}
                    value={p[field] || ''}
                    onChange={v => updatePessoa(pessoas, setPessoas, i, field, v)}
                  />
                )
              ))}
            </div>
          </div>
        ))}
      </>
    )
  }

  const sections = [
    { title: <><Home size={15} /> Locadores</>, singleLabel: 'Locador', pessoas: form.locadores, set: (v: any[]) => setForm({ ...form, locadores: v }) },
    { title: <><KeyRound size={15} /> Locatários</>, singleLabel: 'Locatário', pessoas: form.locatarios, set: (v: any[]) => setForm({ ...form, locatarios: v }) },
    { title: <><Handshake size={15} /> Fiadores</>, singleLabel: 'Fiador', pessoas: form.fiadores, set: (v: any[]) => setForm({ ...form, fiadores: v }) },
  ]

  return (
    <div>
      <div className="mb-7">
        <div className="text-[11px] font-medium tracking-widest uppercase text-[#B8860B] mb-2">Passo 2 de 4</div>
        <h1 className="font-serif text-2xl text-[#1A1612] mb-2">Revisão dos Dados Extraídos</h1>
        <p className="text-sm text-[#4A3F35] leading-relaxed">
          Confira e corrija os dados extraídos pelo Claude Vision. Os campos em branco podem ser preenchidos manualmente.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((s, idx) => (
          <div key={idx} className="bg-white border border-black/10 rounded-xl p-5 shadow-sm">
            <div className="inline-flex items-center gap-1.5 font-serif text-base font-semibold text-[#1A1612] mb-4 pb-3 border-b border-black/8 w-full">{s.title}</div>
            <PessoaCard pessoas={s.pessoas} setPessoas={s.set} title={s.title} singleLabel={s.singleLabel} />
          </div>
        ))}

        {/* Imóvel */}
        <div className="bg-white border border-black/10 rounded-xl p-5 shadow-sm">
          <div className="inline-flex items-center gap-1.5 font-serif text-base font-semibold text-[#1A1612] mb-4 pb-3 border-b border-black/8 w-full">
            <MapPin size={15} /> Imóvel
          </div>
          {form.imovel._source && (
            <div className="text-[10px] bg-[#B8860B]/15 text-[#B8860B] px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-3">
              <Paperclip size={11} /> {form.imovel._source}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {['matricula', 'comarca', 'cartorio', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep', 'areaTotal', 'areaUtil'].map(field => (
              <Field
                key={field}
                label={field === 'matricula' ? 'Nº da matrícula' : field === 'areaTotal' ? 'Área total (m²)' : field === 'areaUtil' ? 'Área útil (m²)' : fieldLabels[field] || field}
                value={(form.imovel as any)[field] || ''}
                onChange={v => setForm({ ...form, imovel: { ...form.imovel, [field]: v } })}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="j-btn-row">
        <button onClick={onPrev} className="j-btn j-btn-out">← Voltar</button>
        <button onClick={onNext} className="j-btn j-btn-gold">Preencher Contrato →</button>
      </div>
    </div>
  )
}
