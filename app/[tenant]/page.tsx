'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/../../lib/supabase/client'
import StepUpload from '@/components/StepUpload'
import StepReview from '@/components/StepReview'
import StepContrato from '@/components/StepContrato'
import StepGerar from '@/components/StepGerar'
import StepModalidade from '@/components/StepModalidade'
import StepPartesCV from '@/components/StepPartesCV'
import StepNegocioCV from '@/components/StepNegocioCV'
import StepGerarCV from '@/components/StepGerarCV'
import { LogOut, Clock, Lock } from 'lucide-react'
import type { ExtractedDoc, FormState, TenantConfig } from '@/lib/types'

const STEPS = ['Documentos', 'Revisão', 'Contrato', 'Gerar']
const STEPS_CV = ['Partes', 'Negócio', 'Gerar']

const FORM_PADRAO: FormState = {
  modalidade: null,
  admJaime: true,
  gnt: null,
  locadores: [],
  locatarios: [],
  fiadores: [],
  imovel: {},
  valor: { indice: 'IGP-M da FGV', multa: '10% (dez por cento)', reajuste: 'a cada 12 meses', vencimento: '01', prazo: '30' },
  garantia: {},
  comissao: { pctJaime: '60', corretores: [] },
  clausulas: {},
  testemunhas: [],
  vendedores: [],
  compradores: [],
  negocio: {},
}

export default function TenantApp({ params }: { params: { tenant: string } }) {
  const [step, setStep] = useState(0)
  const [docs, setDocs] = useState<ExtractedDoc[]>([])
  const [tenant, setTenant] = useState<TenantConfig | null>(null)
  const [form, setForm] = useState<FormState>(FORM_PADRAO)

  // Carrega config do tenant e aplica defaults do template
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: t } = await supabase
        .from('papaia_tenants')
        .select('*')
        .eq('slug', params.tenant)
        .single()

      if (!t) return
      setTenant(t as TenantConfig)

      // Busca template ativo para defaults
      const { data: template } = await supabase
        .from('papaia_contract_templates')
        .select('campos_padrao')
        .eq('tenant_id', t.id)
        .eq('ativo', true)
        .order('created_at')
        .limit(1)
        .single()

      const cp = template?.campos_padrao || {}
      setForm(prev => ({
        ...prev,
        testemunhas: cp.testemunhas?.map((n: string) => ({ nome: n })) || [],
        comissao: { ...prev.comissao, ...cp.comissao },
      }))
    }
    load()
  }, [params.tenant])

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const prev = () => setStep(s => Math.max(s - 1, 0))

  const nextCV = () => setStep(s => Math.min(s + 1, STEPS_CV.length - 1))
  const prevCV = () => setStep(s => Math.max(s - 1, 0))

  function resetModalidade() {
    setForm(f => ({ ...f, modalidade: null }))
    setStep(0)
  }

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const activeSteps = form.modalidade === 'locacao' ? STEPS : form.modalidade ? STEPS_CV : []

  return (
    <>
      <header className="j-header">
        <div className="j-logo">
          {tenant?.logo_url
            ? <img src={tenant.logo_url} alt="" style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover' }} />
            : <div className="j-logo-sq">{tenant?.nome?.[0] || '?'}</div>
          }
          {tenant?.nome || 'Carregando...'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="j-badge">Jurídico · Contratos</span>
          <button onClick={logout} className="j-btn-ghost">
            <LogOut size={12} /> Sair
          </button>
        </div>
      </header>

      {/* Tela de seleção de modalidade — sem steps bar */}
      {form.modalidade === null && (
        <StepModalidade
          onSelect={(m) => {
            setForm(f => ({ ...f, modalidade: m }))
            setStep(0)
          }}
        />
      )}

      {/* Flow com modalidade selecionada */}
      {form.modalidade !== null && (
        <>
          <div className="j-steps-bar">
            <button
              onClick={resetModalidade}
              style={{
                background: 'none',
                border: 'none',
                color: '#B8860B',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                marginRight: 12,
                padding: '4px 0',
                whiteSpace: 'nowrap',
              }}
            >
              ‹ Trocar modalidade
            </button>
            <div style={{ width: 1, height: 20, background: 'var(--border)', marginRight: 12 }} />
            {activeSteps.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => i <= step && setStep(i)}
                  className={`j-step-btn${i === step ? ' active' : i < step ? ' done' : ''}`}
                >
                  <span className="j-step-num">{i < step ? '✓' : i + 1}</span>
                  {s}
                </button>
                {i < activeSteps.length - 1 && (
                  <div className={`j-step-sep${i < step ? ' done' : ''}`} />
                )}
              </div>
            ))}
          </div>

          <div className="j-progress">
            <div className="j-progress-fill" style={{ width: `${((step + 1) / activeSteps.length) * 100}%` }} />
          </div>

          {/* Aviso de trial */}
          {tenant?.status === 'trial' && tenant.trial_ends_at && (
            <div className="j-banner-trial">
              <Clock size={13} />
              Trial ativo até {new Date(tenant.trial_ends_at).toLocaleDateString('pt-BR')} ·{' '}
              {Math.max(0, tenant.contratos_limite - tenant.contratos_usados)} contratos restantes
            </div>
          )}

          {/* Aviso de limite atingido */}
          {tenant && tenant.contratos_usados >= tenant.contratos_limite && (
            <div className="j-banner-limit">
              <Lock size={13} />
              Limite de contratos atingido este mês. Entre em contato com o suporte Papaia para ampliar.
            </div>
          )}

          {/* Locação */}
          {form.modalidade === 'locacao' && (
            <main className="j-main">
              <div className={`j-page${step === 0 ? ' active' : ''}`}>
                <StepUpload docs={docs} setDocs={setDocs} form={form} setForm={setForm} onNext={next} />
              </div>
              <div className={`j-page${step === 1 ? ' active' : ''}`}>
                <StepReview docs={docs} setDocs={setDocs} form={form} setForm={setForm} onNext={next} onPrev={prev} />
              </div>
              <div className={`j-page${step === 2 ? ' active' : ''}`}>
                <StepContrato form={form} setForm={setForm} onNext={next} onPrev={prev} />
              </div>
              <div className={`j-page${step === 3 ? ' active' : ''}`}>
                <StepGerar form={form} onPrev={prev} tenantId={tenant?.id} />
              </div>
            </main>
          )}

          {/* Compra e Venda / Escritura */}
          {(form.modalidade === 'compra-venda' || form.modalidade === 'escritura') && (
            <main className="j-main">
              <div className={`j-page${step === 0 ? ' active' : ''}`}>
                <StepPartesCV form={form} setForm={setForm} onNext={nextCV} onPrev={resetModalidade} />
              </div>
              <div className={`j-page${step === 1 ? ' active' : ''}`}>
                <StepNegocioCV form={form} setForm={setForm} onNext={nextCV} onPrev={prevCV} />
              </div>
              <div className={`j-page${step === 2 ? ' active' : ''}`}>
                <StepGerarCV form={form} onPrev={prevCV} />
              </div>
            </main>
          )}
        </>
      )}
    </>
  )
}
