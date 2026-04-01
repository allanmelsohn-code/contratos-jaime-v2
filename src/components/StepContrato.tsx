'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { FormState } from '@/lib/types'
import CorretorSearch from '@/components/CorretorSearch'
import { formatarCorretorClausula, type Corretor } from '@/lib/corretores'
import { Building, Landmark, ClipboardList, Shield, Handshake, FileText, Banknote, DollarSign, BarChart3, Home, MapPin, Briefcase, AlertCircle, FileEdit } from 'lucide-react'

interface Props {
  form: FormState
  setForm: (v: FormState) => void
  onNext: () => void
  onPrev: () => void
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-[#4A3F35] tracking-wide">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="px-2.5 py-1.5 border border-black/15 rounded-lg text-sm bg-[#F5F0E8] focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 text-[#1A1612]"
      />
    </div>
  )
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-[#4A3F35] tracking-wide">{label}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="px-2.5 py-1.5 border border-black/15 rounded-lg text-sm bg-[#F5F0E8] focus:outline-none focus:border-[#B8860B] appearance-none text-[#1A1612]"
      >
        {options.map(([v, l]: [string, string]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}

function Card({ title, icon, children }: any) {
  return (
    <div className="bg-white border border-black/10 rounded-xl p-5 shadow-sm mb-4">
      <div className="font-serif text-base font-semibold text-[#1A1612] mb-4 pb-3 border-b border-black/8 flex items-center gap-2">
        <span>{icon}</span>{title}
      </div>
      {children}
    </div>
  )
}

function ChoiceCard({ id, selected, onSelect, icon, label, desc }: { id: any; selected: any; onSelect: (id: any) => void; icon: ReactNode; label: string; desc?: string }) {
  return (
    <button onClick={() => onSelect(id)}
      className={`border-2 rounded-xl p-4 text-left transition-all relative ${selected === id ? 'border-[#B8860B] bg-[#B8860B]/5' : 'border-black/10 hover:border-[#B8860B]/50 bg-white'}`}
    >
      {selected === id && <span className="absolute top-2 right-2 w-5 h-5 bg-[#B8860B] rounded-full text-[#1A1612] text-[10px] font-bold flex items-center justify-center">✓</span>}
      <div className="mb-1 text-[#4A3F35]">{icon}</div>
      <div className="font-semibold text-sm text-[#1A1612]">{label}</div>
      {desc && <div className="text-[11px] text-[#8A7A6A] mt-1 leading-snug">{desc}</div>}
    </button>
  )
}

export default function StepContrato({ form, setForm, onNext, onPrev }: Props) {
  const up = (key: keyof FormState, val: any) => setForm({ ...form, [key]: val })
  const upVal = (field: string, val: string) => up('valor', { ...form.valor, [field]: val })
  const upGnt = (field: string, val: string) => up('garantia', { ...form.garantia, [field]: val })
  const upCom = (field: string, val: any) => up('comissao', { ...form.comissao, [field]: val })
  const upCla = (field: string, val: any) => up('clausulas', { ...form.clausulas, [field]: val })

  function calcTermino() {
    const d = form.valor?.inicio
    const m = parseInt(form.valor?.prazo || '30')
    if (!d || !m) return ''
    const dt = new Date(d)
    dt.setMonth(dt.getMonth() + m)
    return dt.toLocaleDateString('pt-BR')
  }

  function calcValorComissao(pct: string) {
    const a = parseFloat((form.valor?.aluguel || '0').replace(/\./g, '').replace(',', '.'))
    const p = parseFloat(pct || '0')
    if (!a || !p) return ''
    return (a * p / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  }

  const [corretorCount, setCorretorCount] = useState(form.comissao?.corretores?.length || 0)

  function addCorretor() {
    const c = [...(form.comissao.corretores || []), { nome: '', cpf: '', cnpj: '', creci: '', pct: '', valor: '', banco: '', agencia: '', conta: '', pix: '', pixTipo: '' }]
    upCom('corretores', c)
    setCorretorCount(c.length)
  }

  function upCorretor(i: number, field: string, val: string) {
    const c = [...(form.comissao.corretores || [])]
    c[i] = { ...c[i], [field]: val }
    if (field === 'pct') c[i].valor = calcValorComissao(val)
    upCom('corretores', c)
  }

  function preencherCorretor(i: number, corretor: Corretor) {
    const c = [...(form.comissao.corretores || [])]
    const pct = c[i]?.pct || ''
    c[i] = {
      ...c[i],
      nome: corretor.nome,
      cpf: corretor.cpf || '',
      cnpj: corretor.cnpj || '',
      creci: corretor.creci,
      banco: corretor.banco,
      agencia: corretor.agencia,
      conta: corretor.conta,
      pix: corretor.pix || '',
      pixTipo: corretor.pixTipo || '',
      valor: calcValorComissao(pct),
    }
    upCom('corretores', c)
  }

  return (
    <div>
      <div className="mb-7">
        <div className="text-[11px] font-medium tracking-widest uppercase text-[#B8860B] mb-2">Passo 3 de 4</div>
        <h1 className="font-serif text-2xl text-[#1A1612] mb-2">Dados do Contrato</h1>
        <p className="text-sm text-[#4A3F35] leading-relaxed">Configure administração, modalidade de garantia, valores e cláusulas.</p>
      </div>

      {/* Administração */}
      <Card title="Tipo de Administração" icon={<Building size={15} />}>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceCard id={true} selected={form.admJaime} onSelect={(v: any) => up('admJaime', v === true || v === 'true')}
            icon={<Landmark size={15} />} label="Jaime Administradora" desc="Inclui cláusula de 6% na venda · CNPJ 65.082.380/0001-04" />
          <ChoiceCard id={false} selected={form.admJaime} onSelect={(v: any) => up('admJaime', false)}
            icon={<ClipboardList size={15} />} label="Sem Administração Jaime" desc="Intermediação apenas" />
        </div>
      </Card>

      {/* Imóvel complemento */}
      <Card title="Imóvel — Dados Complementares" icon={<MapPin size={15} />}>
        <div className="grid grid-cols-3 gap-3">
          <Select label="Tipo do imóvel" value={form.imovel?.tipo} onChange={(v: string) => up('imovel', { ...form.imovel, tipo: v })}
            options={[['Apartamento','Apartamento'],['Casa','Casa'],['Sala/Conjunto Comercial','Sala/Conjunto Comercial'],['Galpão','Galpão'],['Loja','Loja'],['Terreno','Terreno'],['Outro','Outro']]} />
          <Field label="Complemento (Apto, Conj., etc)" value={form.imovel?.complemento} onChange={(v: string) => up('imovel', { ...form.imovel, complemento: v })} />
          <Field label="Vagas de garagem" value={form.imovel?.vaga} onChange={(v: string) => up('imovel', { ...form.imovel, vaga: v })} placeholder="01 (uma) vaga" />
          <Select label="Finalidade" value={form.imovel?.finalidade} onChange={(v: string) => up('imovel', { ...form.imovel, finalidade: v })}
            options={[['RESIDENCIAIS', 'Residencial'], ['comerciais', 'Comercial']]} />
        </div>
        <div className="mt-4 pt-4 border-t border-black/8">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#8A7A6A] mb-3">Códigos de Consumo (opcional)</div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Energia elétrica" value={form.imovel?.consEnergia} onChange={(v: string) => up('imovel', { ...form.imovel, consEnergia: v })} placeholder="Ex: 7001234567" />
            <Field label="Gás" value={form.imovel?.consGas} onChange={(v: string) => up('imovel', { ...form.imovel, consGas: v })} placeholder="Ex: 0123456789" />
            <Field label="Água" value={form.imovel?.consAgua} onChange={(v: string) => up('imovel', { ...form.imovel, consAgua: v })} placeholder="Ex: 012345678-9" />
          </div>
        </div>
      </Card>

      {/* Valor */}
      <Card title="Valor, Prazo e Reajuste" icon={<DollarSign size={15} />}>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Aluguel mensal (R$) *" value={form.valor?.aluguel} onChange={(v: string) => upVal('aluguel', v)} placeholder="7.500,00" />
          <Select label="Dia de vencimento" value={form.valor?.vencimento} onChange={(v: string) => upVal('vencimento', v)}
            options={[['01','Dia 01'],['05','Dia 05'],['10','Dia 10'],['15','Dia 15'],['20','Dia 20'],['25','Dia 25']]} />
          <Field label="Multa por atraso" value={form.valor?.multa} onChange={(v: string) => upVal('multa', v)} placeholder="10% (dez por cento)" />
          <Field label="Início da locação *" type="date" value={form.valor?.inicio} onChange={(v: string) => upVal('inicio', v)} />
          <Field label="Prazo (meses) *" type="number" value={form.valor?.prazo} onChange={(v: string) => upVal('prazo', v)} placeholder="30" />
          <Field label="Término (calculado)" value={calcTermino()} onChange={() => {}} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <Select label="Índice de reajuste" value={form.valor?.indice} onChange={(v: string) => upVal('indice', v)}
            options={[['IGP-M da FGV','IGP-M'],['IPCA','IPCA'],['IPC-FIPE','IPC-FIPE'],['Outro','Outro']]} />
          <Select label="Periodicidade" value={form.valor?.reajuste} onChange={(v: string) => upVal('reajuste', v)}
            options={[['a cada 12 meses','Anual'],['a cada 6 meses','Semestral']]} />
        </div>
        <div className="mt-4 pt-4 border-t border-black/8">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-[11px] font-medium tracking-widest uppercase text-[#8A7A6A]">Carência</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.valor?.carencia} onChange={e => upVal('carencia', e.target.checked ? 'sim' : '')} className="accent-[#B8860B]" />
              <span className="text-xs text-[#4A3F35]">Há período de carência</span>
            </label>
          </div>
          {form.valor?.carencia && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prazo de carência (meses)" type="number" value={form.valor?.carenciaPrazo} onChange={(v: string) => upVal('carenciaPrazo', v)} placeholder="2" />
              <Field label="Motivo da carência" value={form.valor?.carenciaMotivo} onChange={(v: string) => upVal('carenciaMotivo', v)} placeholder="Ex: Reforma do imóvel pelo locatário" />
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-black/8">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#8A7A6A] mb-3">Conta para pagamento do aluguel</div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Banco *" value={form.valor?.banco} onChange={(v: string) => upVal('banco', v)} placeholder="Itaú (341)" />
            <Field label="Agência" value={form.valor?.agencia} onChange={(v: string) => upVal('agencia', v)} placeholder="0186" />
            <Field label="Conta Corrente" value={form.valor?.conta} onChange={(v: string) => upVal('conta', v)} placeholder="98808-5" />
            <Select label="Tipo PIX" value={form.valor?.pixTipo} onChange={(v: string) => upVal('pixTipo', v)}
              options={[['CPF','CPF'],['CNPJ','CNPJ'],['e-mail','E-mail'],['celular','Celular']]} />
            <Field label="Chave PIX" value={form.valor?.pix} onChange={(v: string) => upVal('pix', v)} placeholder="000.000.000-00" />
          </div>
        </div>
      </Card>

      {/* Garantia detalhes */}
      {form.gnt === 'caucao' && (
        <Card title="Depósito Caução" icon={<Banknote size={15} />}>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Valor da caução (R$) *" value={form.garantia?.valor} onChange={(v: string) => upGnt('valor', v)} />
            <Field label="Banco *" value={form.garantia?.banco} onChange={(v: string) => upGnt('banco', v)} placeholder="Banco do depósito" />
            <Field label="Agência" value={form.garantia?.agencia} onChange={(v: string) => upGnt('agencia', v)} />
            <Field label="Conta Corrente" value={form.garantia?.conta} onChange={(v: string) => upGnt('conta', v)} />
            <Select label="Tipo PIX" value={form.garantia?.pixTipo} onChange={(v: string) => upGnt('pixTipo', v)}
              options={[['CPF','CPF'],['CNPJ','CNPJ'],['e-mail','E-mail'],['celular','Celular']]} />
            <Field label="Chave PIX" value={form.garantia?.pix} onChange={(v: string) => upGnt('pix', v)} />
          </div>
        </Card>
      )}

      {form.gnt === 'titulo' && (
        <Card title="Título de Capitalização" icon={<BarChart3 size={15} />}>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Instituição" value={form.garantia?.instituicao} onChange={(v: string) => upGnt('instituicao', v)}
              options={[['Porto Seguro Capitalização S.A','Porto Seguro Capitalização S.A'],['Outra','Outra']]} />
            {form.garantia?.instituicao === 'Outra' && (
              <Field label="Nome da instituição" value={form.garantia?.outraInstituicao} onChange={(v: string) => upGnt('outraInstituicao', v)} />
            )}
            <Field label="Nº Proposta/Formulário *" value={form.garantia?.numero} onChange={(v: string) => upGnt('numero', v)} placeholder="XXXXXXXXX" />
            <Field label="Valor nominal (R$) *" value={form.garantia?.valor} onChange={(v: string) => upGnt('valor', v)} />
            <Field label="Data de emissão" type="date" value={form.garantia?.dataEmissao} onChange={(v: string) => upGnt('dataEmissao', v)} />
          </div>
        </Card>
      )}

      {form.gnt === 'seguro' && (
        <Card title="Seguro Fiança" icon={<FileText size={15} />}>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Seguradora" value={form.garantia?.seguradora} onChange={(v: string) => upGnt('seguradora', v)}
              options={[['Porto Seguro','Porto Seguro'],['Tokio Marine','Tokio Marine'],['Too Seguros','Too Seguros'],['Outra','Outra']]} />
            <Field label="Nº da Apólice *" value={form.garantia?.apolice} onChange={(v: string) => upGnt('apolice', v)} />
            <Field label="PAC" value={form.garantia?.pac} onChange={(v: string) => upGnt('pac', v)} />
            <Select label="Cobertura" value={form.garantia?.cobertura} onChange={(v: string) => upGnt('cobertura', v)}
              options={[
                ['Aluguel + Encargos','Aluguel + Encargos'],
                ['Aluguel + Encargos + Danos ao Imóvel','Aluguel + Encargos + Danos ao Imóvel'],
                ['Personalizado','Personalizado'],
              ]} />
            <Field label="Vigência" type="date" value={form.garantia?.vigencia} onChange={(v: string) => upGnt('vigencia', v)} />
          </div>
        </Card>
      )}

      {form.gnt === 'imovel-cau' && (
        <Card title="Imóvel Caucionado" icon={<Home size={15} />}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Nº da Matrícula *" value={form.garantia?.matricula} onChange={(v: string) => upGnt('matricula', v)} placeholder="12.345" />
            <Field label="Comarca" value={form.garantia?.comarca} onChange={(v: string) => upGnt('comarca', v)} placeholder="São Paulo" />
            <Field label="Cartório (Nº/Nome) *" value={form.garantia?.cartorio} onChange={(v: string) => upGnt('cartorio', v)} placeholder="15º RI São Paulo" />
            <Field label="Descrição do imóvel" value={form.garantia?.descricao} onChange={(v: string) => upGnt('descricao', v)} placeholder="Ap. 12, Rua..." />
          </div>
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#8A7A6A] mb-3">Caucionantes</div>
          {((form.garantia?.caucionantes || []) as any[]).map((c: any, i: number) => (
            <div key={i} className="border border-black/10 rounded-lg p-3 mb-3 bg-[#F5F0E8]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#1A1612]">Caucionante {i + 1}</span>
                <button onClick={() => { const arr = (form.garantia?.caucionantes || []).filter((_: any, j: number) => j !== i); up('garantia', { ...form.garantia, caucionantes: arr }) }}
                  className="text-[11px] text-[#8A7A6A] hover:text-red-600">Remover</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[['Nome completo', 'nome', 'text', ''], ['CPF', 'cpf', 'text', '000.000.000-00'], ['RG', 'rg', 'text', '']].map(([label, field, type, ph]) => (
                  <Field key={field} label={label} type={type} placeholder={ph}
                    value={c[field] || ''} onChange={(v: string) => {
                      const arr = [...(form.garantia?.caucionantes || [])]
                      arr[i] = { ...arr[i], [field]: v }
                      up('garantia', { ...form.garantia, caucionantes: arr })
                    }} />
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => { const arr = [...(form.garantia?.caucionantes || []), { nome: '', cpf: '', rg: '' }]; up('garantia', { ...form.garantia, caucionantes: arr }) }}
            className="text-sm text-[#B8860B] hover:text-[#D4A017] font-medium">+ Adicionar caucionante</button>
        </Card>
      )}

      {/* Comissão */}
      <Card title="Comissão de Intermediação" icon={<Briefcase size={15} />}>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Field label="Vencimento (data)" type="date" value={form.comissao?.vencimento} onChange={(v: string) => upCom('vencimento', v)} />
          <Field label="% Jaime" value={form.comissao?.pctJaime} onChange={(v: string) => {
            const val = calcValorComissao(v)
            upCom('pctJaime', v); setForm({ ...form, comissao: { ...form.comissao, pctJaime: v, valorJaime: val } })
          }} placeholder="60" />
          <Field label="Valor Jaime (R$)" value={form.comissao?.valorJaime || calcValorComissao(form.comissao?.pctJaime)} onChange={() => {}} />
        </div>
        <div className="space-y-3">
          {(form.comissao?.corretores || []).map((c: any, i: number) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 10, background: 'var(--cream)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>Corretor {i + 1}</span>
                <button onClick={() => { const arr = form.comissao.corretores.filter((_: any, j: number) => j !== i); upCom('corretores', arr) }}
                  style={{ fontSize: 11, color: 'var(--ink-f)', background: 'none', border: 'none', cursor: 'pointer' }}>Remover</button>
              </div>
              <div className="j-grid j-grid-2" style={{ marginBottom: 10 }}>
                <div className="j-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="j-label">Nome / Buscar corretor</label>
                  <CorretorSearch
                    value={c.nome || ''}
                    onChange={v => upCorretor(i, 'nome', v)}
                    onSelect={corretor => preencherCorretor(i, corretor)}
                    placeholder="Digite o apelido ou nome..."
                  />
                </div>
                <div className="j-field">
                  <label className="j-label">CPF / CNPJ</label>
                  <input className="j-input" value={c.cpf || c.cnpj || ''} onChange={e => upCorretor(i, 'cpf', e.target.value)} placeholder="Auto-preenchido" />
                </div>
                <div className="j-field">
                  <label className="j-label">CRECI</label>
                  <input className="j-input" value={c.creci || ''} onChange={e => upCorretor(i, 'creci', e.target.value)} placeholder="Auto-preenchido" />
                </div>
                <div className="j-field">
                  <label className="j-label">% Comissão</label>
                  <input className="j-input" value={c.pct || ''} onChange={e => upCorretor(i, 'pct', e.target.value)} placeholder="Ex: 40" />
                </div>
                <div className="j-field">
                  <label className="j-label">Valor (R$)</label>
                  <input className="j-input" value={c.valor || ''} readOnly style={{ background: '#f0ebe0' }} />
                </div>
              </div>
              <div className="j-grid j-grid-3">
                <div className="j-field">
                  <label className="j-label">Banco</label>
                  <input className="j-input" value={c.banco || ''} onChange={e => upCorretor(i, 'banco', e.target.value)} placeholder="Auto-preenchido" />
                </div>
                <div className="j-field">
                  <label className="j-label">Agência</label>
                  <input className="j-input" value={c.agencia || ''} onChange={e => upCorretor(i, 'agencia', e.target.value)} />
                </div>
                <div className="j-field">
                  <label className="j-label">Conta Corrente</label>
                  <input className="j-input" value={c.conta || ''} onChange={e => upCorretor(i, 'conta', e.target.value)} />
                </div>
                {c.pix && (
                  <div className="j-field">
                    <label className="j-label">Chave PIX</label>
                    <input className="j-input" value={c.pix || ''} onChange={e => upCorretor(i, 'pix', e.target.value)} />
                  </div>
                )}
              </div>
              {c.obs && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--rust)', background: 'rgba(139,58,26,.06)', padding: '6px 10px', borderRadius: 6 }} className="flex items-center gap-1"><AlertCircle size={11} /> {c.obs}</div>}
            </div>
          ))}
        </div>
        <button onClick={addCorretor} className="mt-3 text-sm text-[#B8860B] hover:text-[#D4A017] font-medium">+ Adicionar corretor</button>
      </Card>

      {/* Cláusulas especiais */}
      <Card title="Cláusulas Especiais" icon={<FileEdit size={15} />}>
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={!!form.clausulas?.isencaoMeses} onChange={e => upCla('isencaoMeses', e.target.checked ? '12' : '')}
              className="mt-1 accent-[#B8860B]" />
            <div>
              <div className="text-sm font-medium text-[#1A1612]">Isenção de multa por desocupação antecipada</div>
              <div className="text-[11px] text-[#8A7A6A]">Após determinado período, sem penalidade</div>
              {form.clausulas?.isencaoMeses && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Field label="Após (meses)" type="number" value={form.clausulas.isencaoMeses} onChange={(v: string) => upCla('isencaoMeses', v)} />
                  <Field label="Aviso prévio (dias)" type="number" value={form.clausulas.isencaoAviso || '30'} onChange={(v: string) => upCla('isencaoAviso', v)} />
                </div>
              )}
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={!!form.clausulas?.abono} onChange={e => upCla('abono', e.target.checked ? { valor: '', mes: '2', obs: '' } : null)}
              className="mt-1 accent-[#B8860B]" />
            <div className="flex-1">
              <div className="text-sm font-medium text-[#1A1612]">Abono em dinheiro para reforma</div>
              <div className="text-[11px] text-[#8A7A6A]">Locador concede desconto para obras pelo locatário</div>
              {form.clausulas?.abono && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Field label="Valor (R$)" value={form.clausulas.abono.valor} onChange={(v: string) => upCla('abono', { ...form.clausulas.abono, valor: v })} />
                  <Field label="A partir do mês" type="number" value={form.clausulas.abono.mes} onChange={(v: string) => upCla('abono', { ...form.clausulas.abono, mes: v })} />
                  <Field label="Destinação" value={form.clausulas.abono.obs} onChange={(v: string) => upCla('abono', { ...form.clausulas.abono, obs: v })} placeholder="Reforma, pintura..." />
                  <Field label="Nº de parcelas de abono" type="number" value={form.clausulas.abono.parcelas} onChange={(v: string) => upCla('abono', { ...form.clausulas.abono, parcelas: v })} placeholder="1" />
                  <Field label="Prazo para obras (meses)" type="number" value={form.clausulas.abono.prazo} onChange={(v: string) => upCla('abono', { ...form.clausulas.abono, prazo: v })} placeholder="3" />
                </div>
              )}
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={!!form.clausulas?.iptuLocador} onChange={e => upCla('iptuLocador', e.target.checked)}
              className="mt-1 accent-[#B8860B]" />
            <div>
              <div className="text-sm font-medium text-[#1A1612]">IPTU pago pelo locador</div>
              <div className="text-[11px] text-[#8A7A6A]">Por padrão, todos encargos (IPTU, condomínio, luz, água, gás) são do locatário. Marque para transferir IPTU e condomínio ao locador.</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={!!form.clausulas?.iptuProporcional} onChange={e => upCla('iptuProporcional', e.target.checked)}
              className="mt-1 accent-[#B8860B]" />
            <div>
              <div className="text-sm font-medium text-[#1A1612]">IPTU e condomínio proporcionais no início</div>
              <div className="text-[11px] text-[#8A7A6A]">No mês de início da locação, encargos calculados proporcionalmente aos dias de ocupação</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={!!form.clausulas?.moradores} onChange={e => upCla('moradores', e.target.checked ? ' ' : null)}
              className="mt-1 accent-[#B8860B]" />
            <div className="flex-1">
              <div className="text-sm font-medium text-[#1A1612]">Moradores adicionais</div>
              <div className="text-[11px] text-[#8A7A6A]">Cônjuge, filhos ou dependentes que residirão no imóvel</div>
              {form.clausulas?.moradores !== undefined && form.clausulas?.moradores !== null && (
                <textarea value={form.clausulas.moradores} onChange={e => upCla('moradores', e.target.value)} rows={2}
                  placeholder="Ex: cônjuge Fulana de Tal, CPF 000.000.000-00, e filhos menores"
                  className="mt-2 w-full px-3 py-2 border border-black/15 rounded-lg text-sm bg-[#F5F0E8] focus:outline-none focus:border-[#B8860B] resize-none" />
              )}
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={!!form.clausulas?.comunicacaoEmail} onChange={e => upCla('comunicacaoEmail', e.target.checked)}
              className="mt-1 accent-[#B8860B]" />
            <div>
              <div className="text-sm font-medium text-[#1A1612]">Comunicação preferencial por e-mail</div>
              <div className="text-[11px] text-[#8A7A6A]">Notificações, avisos e comunicações entre as partes preferencialmente por e-mail</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={form.clausulas?.prefVenda !== false} onChange={e => upCla('prefVenda', e.target.checked)}
              className="mt-1 accent-[#B8860B]" defaultChecked />
            <div>
              <div className="text-sm font-medium text-[#1A1612]">Cláusula de preferência na venda com comissão Jaime</div>
              <div className="text-[11px] text-[#8A7A6A]">6% sobre valor da venda à Jaime Administração de Bens · CNPJ 65.082.380/0001-04</div>
            </div>
          </label>
          <div>
            <div className="text-[11px] font-medium text-[#4A3F35] tracking-wide mb-1">Cláusulas livres</div>
            <textarea value={form.clausulas?.livre || ''} onChange={e => upCla('livre', e.target.value)} rows={3}
              placeholder="Insira aqui cláusulas específicas deste contrato..."
              className="w-full px-3 py-2 border border-black/15 rounded-lg text-sm bg-[#F5F0E8] focus:outline-none focus:border-[#B8860B] resize-none" />
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-5 border-t border-black/10">
        <button onClick={onPrev} className="px-5 py-2.5 border border-black/15 rounded-lg text-sm text-[#4A3F35] hover:bg-black/5 transition-all">← Voltar</button>
        <button onClick={onNext} className="px-6 py-2.5 bg-[#B8860B] text-[#1A1612] rounded-lg text-sm font-semibold hover:bg-[#D4A017] transition-all">Gerar Contrato →</button>
      </div>
    </div>
  )
}
