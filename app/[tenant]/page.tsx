'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/../../lib/supabase/client'
import StepUpload from '@/components/StepUpload'
import StepReview from '@/components/StepReview'
import StepContrato from '@/components/StepContrato'
import StepGerar from '@/components/StepGerar'
import type { ExtractedDoc, FormState, TenantConfig } from '@/lib/types'

const STEPS = ['Documentos', 'Revisão', 'Contrato', 'Gerar']

const FORM_PADRAO: FormState = {
  admJaime: true, gnt: null,
  locadores: [], locatarios: [], fiadores: [],
  imovel: {},
  valor: { indice: 'IGP-M da FGV', multa: '10% (dez por cento)', reajuste: 'a cada 12 meses', vencimento: '01', prazo: '30' },
  garantia: {},
  comissao: { pctJaime: '60', corretores: [] },
  clausulas: {},
  testemunhas: [],
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

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

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
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontSize: 12 }}>
            Sair
          </button>
        </div>
      </header>

      <div className="j-steps-bar">
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => i <= step && setStep(i)}
              className={`j-step-btn${i === step ? ' active' : i < step ? ' done' : ''}`}
            >
              <span className="j-step-num">{i < step ? '✓' : i + 1}</span>
              {s}
            </button>
            {i < STEPS.length - 1 && <div className="j-step-sep" />}
          </div>
        ))}
      </div>

      <div className="j-progress">
        <div className="j-progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      {/* Aviso de trial */}
      {tenant?.status === 'trial' && tenant.trial_ends_at && (
        <div style={{ background: '#FFF3CD', borderBottom: '1px solid #FFE083', padding: '8px 32px', fontSize: 12, color: '#856404', textAlign: 'center' }}>
          ⏰ Trial ativo até {new Date(tenant.trial_ends_at).toLocaleDateString('pt-BR')} ·{' '}
          {Math.max(0, tenant.contratos_limite - tenant.contratos_usados)} contratos restantes
        </div>
      )}

      {/* Aviso de limite atingido */}
      {tenant && tenant.contratos_usados >= tenant.contratos_limite && (
        <div style={{ background: '#FEE2DC', borderBottom: '1px solid #F5A090', padding: '8px 32px', fontSize: 12, color: '#C0392B', textAlign: 'center' }}>
          🔒 Limite de contratos atingido este mês. Entre em contato com o suporte Papaia para ampliar.
        </div>
      )}

      <main className="j-main">
        <div className={`j-page${step === 0 ? ' active' : ''}`}>
          <StepUpload docs={docs} setDocs={setDocs} onNext={next} />
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
    </>
  )
}
