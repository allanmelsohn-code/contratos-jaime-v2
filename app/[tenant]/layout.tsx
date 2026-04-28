import { createClient } from '@lib/supabase/server'
import { notFound } from 'next/navigation'
import { Lock, Clock } from 'lucide-react'
import type { TenantConfig } from '@/lib/types'

// Injeta as cores do tenant como CSS vars no <style>
function TenantStyles({ tenant }: { tenant: TenantConfig }) {
  const p = tenant.cor_primaria || '#E8735A'
  // Gera versão escura e pastel a partir da cor primária
  return (
    <style>{`
      :root {
        --tenant-primary: ${p};
        --tenant-primary-d: color-mix(in srgb, ${p} 85%, #000);
        --tenant-primary-p: color-mix(in srgb, ${p} 12%, #fff);
        --tenant-secondary: ${tenant.cor_secundaria || '#8BAD8B'};
      }
    `}</style>
  )
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { tenant: string }
}) {
  const supabase = createClient()

  const { data: tenant } = await supabase
    .from('papaia_tenants')
    .select('*')
    .eq('slug', params.tenant)
    .single()

  if (!tenant) notFound()

  // Conta suspensa
  if (tenant.status === 'suspended') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}><Lock size={40} /></div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Conta suspensa</h2>
          <p style={{ fontSize: 14, color: 'var(--ink-m)' }}>
            O plano da sua conta está suspenso. Entre em contato com o suporte Papaia para reativar.
          </p>
        </div>
      </div>
    )
  }

  // Trial expirado
  if (tenant.status === 'trial' && tenant.trial_ends_at) {
    const expired = new Date(tenant.trial_ends_at) < new Date()
    if (expired) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}><Clock size={40} /></div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Trial encerrado</h2>
            <p style={{ fontSize: 14, color: 'var(--ink-m)' }}>
              Seu período de avaliação encerrou. Entre em contato com a Papaia para continuar usando.
            </p>
          </div>
        </div>
      )
    }
  }

  return (
    <>
      <TenantStyles tenant={tenant as TenantConfig} />
      {children}
    </>
  )
}
