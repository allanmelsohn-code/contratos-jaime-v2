'use client'

import { Home, DollarSign, FileText } from 'lucide-react'
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

export default function StepNegocioCV({ form, setForm, onNext, onPrev }: Props) {
  const neg = form.negocio || {}
  const up = (field: string, val: any) => setForm({ ...form, negocio: { ...neg, [field]: val } })

  const showBanco = neg.modalidadePagamento === 'Financiamento bancário' || neg.modalidadePagamento === 'FGTS + complemento'

  return (
    <div>
      <div className="mb-7">
        <div className="text-[11px] font-medium tracking-widest uppercase text-[#B8860B] mb-2">Passo 2 de 3</div>
        <h1 className="font-serif text-2xl text-[#1A1612] mb-2">Imóvel e Negócio</h1>
        <p className="text-sm text-[#4A3F35] leading-relaxed">Descreva o imóvel, o preço e as condições de pagamento.</p>
      </div>

      {/* Imóvel */}
      <Card title="Imóvel" icon={<Home size={15} />}>
        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Tipo"
            value={neg.tipo}
            onChange={(v: string) => up('tipo', v)}
            options={[
              ['', 'Selecione...'],
              ['Apartamento', 'Apartamento'],
              ['Casa', 'Casa'],
              ['Sala Comercial', 'Sala Comercial'],
              ['Galpão', 'Galpão'],
              ['Terreno', 'Terreno'],
              ['Outro', 'Outro'],
            ]}
          />
          <div className="col-span-2">
            <Field label="Endereço *" value={neg.endereco} onChange={(v: string) => up('endereco', v)} placeholder="Rua / Av." />
          </div>
          <Field label="Número" value={neg.numero} onChange={(v: string) => up('numero', v)} />
          <Field label="Complemento" value={neg.complemento} onChange={(v: string) => up('complemento', v)} placeholder="Apto, Bloco..." />
          <Field label="Bairro" value={neg.bairro} onChange={(v: string) => up('bairro', v)} />
          <Field label="CEP" value={neg.cep} onChange={(v: string) => up('cep', v)} placeholder="00000-000" />
          <Field label="Cidade" value={neg.cidade || 'São Paulo'} onChange={(v: string) => up('cidade', v)} placeholder="São Paulo" />
          <Field label="UF" value={neg.uf || 'SP'} onChange={(v: string) => up('uf', v)} placeholder="SP" />
          <Field label="Matrícula nº" value={neg.matricula} onChange={(v: string) => up('matricula', v)} placeholder="12.345" />
          <Field label="Cartório" value={neg.cartorio} onChange={(v: string) => up('cartorio', v)} placeholder="15º RI São Paulo" />
          <Field label="Comarca" value={neg.comarca} onChange={(v: string) => up('comarca', v)} placeholder="São Paulo" />
          <Field label="Área (m²)" value={neg.area} onChange={(v: string) => up('area', v)} placeholder="65,00" />
        </div>
      </Card>

      {/* Preço e Pagamento */}
      <Card title="Preço e Forma de Pagamento" icon={<DollarSign size={15} />}>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Valor total (R$) *" value={neg.valorTotal} onChange={(v: string) => up('valorTotal', v)} placeholder="350.000,00" />
          <Field label="Sinal / Entrada (R$)" value={neg.sinal} onChange={(v: string) => up('sinal', v)} placeholder="35.000,00" />
          <Field label="Data do sinal" type="date" value={neg.dataSinal} onChange={(v: string) => up('dataSinal', v)} />
          <Select
            label="Modalidade de pagamento"
            value={neg.modalidadePagamento}
            onChange={(v: string) => up('modalidadePagamento', v)}
            options={[
              ['', 'Selecione...'],
              ['À vista', 'À vista'],
              ['Financiamento bancário', 'Financiamento bancário'],
              ['Parcelado entre as partes', 'Parcelado entre as partes'],
              ['FGTS + complemento', 'FGTS + complemento'],
            ]}
          />
          <Field
            label="Prazo para escritura (dias)"
            type="number"
            value={neg.prazoEscritura}
            onChange={(v: string) => up('prazoEscritura', v)}
            placeholder="60"
          />
          {showBanco && (
            <Field label="Banco financiador" value={neg.banco} onChange={(v: string) => up('banco', v)} placeholder="Caixa Econômica Federal" />
          )}
        </div>
      </Card>

      {/* Cláusulas Especiais */}
      <Card title="Cláusulas Especiais" icon={<FileText size={15} />}>
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={neg.posseNaEscritura !== false}
              onChange={e => up('posseNaEscritura', e.target.checked)}
              className="mt-1 accent-[#B8860B]"
              defaultChecked
            />
            <div>
              <div className="text-sm font-medium text-[#1A1612]">Transferência de posse na data da escritura</div>
              <div className="text-[11px] text-[#8A7A6A]">A posse será transferida na data da lavratura da escritura definitiva</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={neg.itbiComprador !== false}
              onChange={e => up('itbiComprador', e.target.checked)}
              className="mt-1 accent-[#B8860B]"
              defaultChecked
            />
            <div>
              <div className="text-sm font-medium text-[#1A1612]">ITBI por conta do comprador</div>
              <div className="text-[11px] text-[#8A7A6A]">O ITBI e demais custas de transferência são de responsabilidade do(a) comprador(a)</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={neg.comissaoQuitada !== false}
              onChange={e => up('comissaoQuitada', e.target.checked)}
              className="mt-1 accent-[#B8860B]"
              defaultChecked
            />
            <div>
              <div className="text-sm font-medium text-[#1A1612]">Comissão de intermediação já quitada</div>
              <div className="text-[11px] text-[#8A7A6A]">A comissão de intermediação já foi paga antes da assinatura deste instrumento</div>
            </div>
          </label>
          <div>
            <div className="text-[11px] font-medium text-[#4A3F35] tracking-wide mb-1">Cláusula livre</div>
            <textarea
              value={neg.clausulaLivre || ''}
              onChange={e => up('clausulaLivre', e.target.value)}
              rows={3}
              placeholder="Insira aqui cláusulas específicas deste negócio..."
              className="w-full px-3 py-2 border border-black/15 rounded-lg text-sm bg-[#F5F0E8] focus:outline-none focus:border-[#B8860B] resize-none"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-5 border-t border-black/10">
        <button
          onClick={onPrev}
          className="px-5 py-2.5 border border-black/15 rounded-lg text-sm text-[#4A3F35] hover:bg-black/5 transition-all"
        >← Voltar</button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-[#B8860B] text-[#1A1612] rounded-lg text-sm font-semibold hover:bg-[#D4A017] transition-all"
        >Continuar →</button>
      </div>
    </div>
  )
}
