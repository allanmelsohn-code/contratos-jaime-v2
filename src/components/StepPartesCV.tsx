'use client'

import { useState } from 'react'
import { Tag, Handshake } from 'lucide-react'
import type { FormState } from '@/lib/types'

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
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-2.5 py-1.5 border border-black/15 rounded-lg text-sm bg-[#F5F0E8] focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 text-[#1A1612]"
      />
    </div>
  )
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-[#4A3F35] tracking-wide">{label}</label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="px-2.5 py-1.5 border border-black/15 rounded-lg text-sm bg-[#F5F0E8] focus:outline-none focus:border-[#B8860B] appearance-none text-[#1A1612]"
      >
        {options.map(([v, l]: [string, string]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  )
}

function Card({ title, icon, children }: any) {
  return (
    <div className="bg-white border border-black/10 rounded-xl p-5 shadow-sm mb-4">
      <div className="font-serif text-base font-semibold text-[#1A1612] mb-4 pb-3 border-b border-black/8 flex items-center gap-2">
        {icon}{title}
      </div>
      {children}
    </div>
  )
}

const BLANK_PERSON = {
  tipo: 'PF',
  nome: '', nacionalidade: '', estadoCivil: '', profissao: '',
  rg: '', cpf: '', cnpj: '', razaoSocial: '',
  endereco: '', numero: '', complemento: '', bairro: '', cep: '', cidade: '', uf: '',
  email: '',
  temConjuge: false,
  conjuge: { nome: '', cpf: '', rg: '', estadoCivil: '', regime: '' },
}

function PersonCard({ person, onChange, onRemove, label, index }: any) {
  const up = (field: string, val: any) => onChange({ ...person, [field]: val })
  const upConj = (field: string, val: string) => onChange({ ...person, conjuge: { ...person.conjuge, [field]: val } })

  return (
    <div className="border border-black/10 rounded-lg p-4 mb-4 bg-[#F5F0E8]">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-[#1A1612]">{label} {index + 1}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-[#4A3F35]">
            <button
              onClick={() => up('tipo', 'PF')}
              className={`px-2.5 py-1 rounded-md transition-all ${person.tipo !== 'PJ' ? 'bg-[#B8860B] text-[#1A1612] font-semibold' : 'bg-white border border-black/15 hover:bg-black/5'}`}
            >PF</button>
            <button
              onClick={() => up('tipo', 'PJ')}
              className={`px-2.5 py-1 rounded-md transition-all ${person.tipo === 'PJ' ? 'bg-[#B8860B] text-[#1A1612] font-semibold' : 'bg-white border border-black/15 hover:bg-black/5'}`}
            >PJ</button>
          </div>
          <button
            onClick={onRemove}
            className="text-[11px] text-[#8A7A6A] hover:text-red-600 transition-colors"
          >Remover</button>
        </div>
      </div>

      {person.tipo === 'PJ' ? (
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Field label="Razão Social *" value={person.razaoSocial} onChange={(v: string) => up('razaoSocial', v)} />
          <Field label="CNPJ *" value={person.cnpj} onChange={(v: string) => up('cnpj', v)} placeholder="00.000.000/0001-00" />
          <Field label="E-mail" value={person.email} onChange={(v: string) => up('email', v)} placeholder="email@empresa.com.br" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Field label="Nome completo *" value={person.nome} onChange={(v: string) => up('nome', v)} />
          <Field label="Nacionalidade" value={person.nacionalidade} onChange={(v: string) => up('nacionalidade', v)} placeholder="brasileiro(a)" />
          <Select
            label="Estado civil"
            value={person.estadoCivil}
            onChange={(v: string) => up('estadoCivil', v)}
            options={[
              ['', 'Selecione...'],
              ['solteiro(a)', 'Solteiro(a)'],
              ['casado(a)', 'Casado(a)'],
              ['divorciado(a)', 'Divorciado(a)'],
              ['viúvo(a)', 'Viúvo(a)'],
              ['separado(a) judicialmente', 'Separado(a) judicialmente'],
              ['em união estável', 'Em união estável'],
            ]}
          />
          <Field label="Profissão" value={person.profissao} onChange={(v: string) => up('profissao', v)} />
          <Field label="RG" value={person.rg} onChange={(v: string) => up('rg', v)} placeholder="00.000.000-0" />
          <Field label="CPF *" value={person.cpf} onChange={(v: string) => up('cpf', v)} placeholder="000.000.000-00" />
          <Field label="E-mail" value={person.email} onChange={(v: string) => up('email', v)} placeholder="email@exemplo.com.br" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="col-span-2">
          <Field label="Endereço" value={person.endereco} onChange={(v: string) => up('endereco', v)} placeholder="Rua / Av." />
        </div>
        <Field label="Número" value={person.numero} onChange={(v: string) => up('numero', v)} />
        <Field label="Complemento" value={person.complemento} onChange={(v: string) => up('complemento', v)} placeholder="Apto, Bloco..." />
        <Field label="Bairro" value={person.bairro} onChange={(v: string) => up('bairro', v)} />
        <Field label="CEP" value={person.cep} onChange={(v: string) => up('cep', v)} placeholder="00000-000" />
        <Field label="Cidade" value={person.cidade} onChange={(v: string) => up('cidade', v)} placeholder="São Paulo" />
        <Field label="UF" value={person.uf} onChange={(v: string) => up('uf', v)} placeholder="SP" />
      </div>

      {person.tipo !== 'PJ' && (
        <div className="mt-3 pt-3 border-t border-black/8">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#4A3F35] font-medium">
            <input
              type="checkbox"
              checked={!!person.temConjuge}
              onChange={e => up('temConjuge', e.target.checked)}
              className="accent-[#B8860B]"
            />
            Possui Cônjuge / Convivente
          </label>
          {person.temConjuge && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-black/8">
              <div className="text-[11px] font-medium tracking-widest uppercase text-[#8A7A6A] mb-2">Cônjuge / Convivente</div>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Nome completo" value={person.conjuge?.nome} onChange={(v: string) => upConj('nome', v)} />
                <Field label="CPF" value={person.conjuge?.cpf} onChange={(v: string) => upConj('cpf', v)} placeholder="000.000.000-00" />
                <Field label="RG" value={person.conjuge?.rg} onChange={(v: string) => upConj('rg', v)} />
                <Select
                  label="Estado civil"
                  value={person.conjuge?.estadoCivil}
                  onChange={(v: string) => upConj('estadoCivil', v)}
                  options={[
                    ['', 'Selecione...'],
                    ['casado(a)', 'Casado(a)'],
                    ['em união estável', 'Em união estável'],
                  ]}
                />
                <Select
                  label="Regime de bens"
                  value={person.conjuge?.regime}
                  onChange={(v: string) => upConj('regime', v)}
                  options={[
                    ['', 'Selecione...'],
                    ['Comunhão Parcial de Bens', 'Comunhão Parcial de Bens'],
                    ['Comunhão Universal de Bens', 'Comunhão Universal de Bens'],
                    ['Separação Total de Bens', 'Separação Total de Bens'],
                    ['Participação Final nos Aquestos', 'Participação Final nos Aquestos'],
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function StepPartesCV({ form, setForm, onNext, onPrev }: Props) {
  const isEscritura = form.modalidade === 'escritura'
  const vendLabel = isEscritura ? 'Outorgante(s) Vendedor(es)' : 'Vendedor(es)'
  const compLabel = isEscritura ? 'Outorgado(s) Comprador(es)' : 'Comprador(es)'
  const vendSingle = isEscritura ? 'Outorgante' : 'Vendedor'
  const compSingle = isEscritura ? 'Outorgado' : 'Comprador'

  function addVendedor() {
    setForm({ ...form, vendedores: [...(form.vendedores || []), { ...BLANK_PERSON }] })
  }

  function removeVendedor(i: number) {
    setForm({ ...form, vendedores: (form.vendedores || []).filter((_: any, j: number) => j !== i) })
  }

  function updateVendedor(i: number, val: any) {
    const arr = [...(form.vendedores || [])]
    arr[i] = val
    setForm({ ...form, vendedores: arr })
  }

  function addComprador() {
    setForm({ ...form, compradores: [...(form.compradores || []), { ...BLANK_PERSON }] })
  }

  function removeComprador(i: number) {
    setForm({ ...form, compradores: (form.compradores || []).filter((_: any, j: number) => j !== i) })
  }

  function updateComprador(i: number, val: any) {
    const arr = [...(form.compradores || [])]
    arr[i] = val
    setForm({ ...form, compradores: arr })
  }

  return (
    <div>
      <div className="mb-7">
        <div className="text-[11px] font-medium tracking-widest uppercase text-[#B8860B] mb-2">Passo 1 de 3</div>
        <h1 className="font-serif text-2xl text-[#1A1612] mb-2">Qualificação das Partes</h1>
        <p className="text-sm text-[#4A3F35] leading-relaxed">
          Preencha os dados completos de {vendLabel.toLowerCase()} e {compLabel.toLowerCase()}.
        </p>
      </div>

      <Card title={vendLabel} icon={<Tag size={15} />}>
        {(form.vendedores || []).length === 0 && (
          <p className="text-sm text-[#8A7A6A] mb-4">Nenhum {vendSingle.toLowerCase()} adicionado.</p>
        )}
        {(form.vendedores || []).map((v: any, i: number) => (
          <PersonCard
            key={i}
            person={v}
            onChange={(val: any) => updateVendedor(i, val)}
            onRemove={() => removeVendedor(i)}
            label={vendSingle}
            index={i}
          />
        ))}
        <button
          onClick={addVendedor}
          className="text-sm text-[#B8860B] hover:text-[#D4A017] font-medium transition-colors"
        >
          + Adicionar {vendSingle.toLowerCase()}
        </button>
      </Card>

      <Card title={compLabel} icon={<Handshake size={15} />}>
        {(form.compradores || []).length === 0 && (
          <p className="text-sm text-[#8A7A6A] mb-4">Nenhum {compSingle.toLowerCase()} adicionado.</p>
        )}
        {(form.compradores || []).map((c: any, i: number) => (
          <PersonCard
            key={i}
            person={c}
            onChange={(val: any) => updateComprador(i, val)}
            onRemove={() => removeComprador(i)}
            label={compSingle}
            index={i}
          />
        ))}
        <button
          onClick={addComprador}
          className="text-sm text-[#B8860B] hover:text-[#D4A017] font-medium transition-colors"
        >
          + Adicionar {compSingle.toLowerCase()}
        </button>
      </Card>

      <div className="j-btn-row">
        <button onClick={onPrev} className="j-btn j-btn-out">← Voltar</button>
        <button onClick={onNext} className="j-btn j-btn-gold">Continuar →</button>
      </div>
    </div>
  )
}
