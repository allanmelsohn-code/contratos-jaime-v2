'use server'

import { createAdminClient } from '@/../../lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── Criar tenant ──────────────────────────────────────────
export async function criarTenant(formData: FormData) {
  const supabase = createAdminClient()
  const slug = (formData.get('slug') as string).toLowerCase().trim()
  const { error } = await supabase.from('papaia_tenants').insert({
    slug,
    nome: formData.get('nome'),
    cnpj: formData.get('cnpj') || null,
    creci: formData.get('creci') || null,
    cor_primaria: formData.get('cor_primaria') || '#E8735A',
    cor_secundaria: formData.get('cor_secundaria') || '#8BAD8B',
    plano: formData.get('plano') || 'trial',
    contratos_limite: Number(formData.get('contratos_limite')) || 10,
    status: 'trial',
    trial_ends_at: null,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

// ── Liberar trial ─────────────────────────────────────────
export async function liberarTrial(tenantId: string, dias: number) {
  const supabase = createAdminClient()
  const trial_ends_at = new Date(Date.now() + dias * 86_400_000).toISOString()
  const { error } = await supabase
    .from('papaia_tenants')
    .update({ status: 'trial', trial_ends_at })
    .eq('id', tenantId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

// ── Ativar conta ──────────────────────────────────────────
export async function ativarTenant(tenantId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('papaia_tenants')
    .update({ status: 'active', trial_ends_at: null })
    .eq('id', tenantId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

// ── Suspender conta ───────────────────────────────────────
export async function suspenderTenant(tenantId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('papaia_tenants')
    .update({ status: 'suspended' })
    .eq('id', tenantId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

// ── Editar contador de contratos ──────────────────────────
export async function editarContador(tenantId: string, usados: number, limite: number) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('papaia_tenants')
    .update({ contratos_usados: usados, contratos_limite: limite })
    .eq('id', tenantId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

// ── Resetar contador mensal ───────────────────────────────
export async function resetarContador(tenantId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('papaia_tenants')
    .update({ contratos_usados: 0 })
    .eq('id', tenantId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

// ── Associar usuário a tenant (após criar no Supabase Auth) ─
export async function associarUsuario(email: string, tenantId: string, role: 'admin' | 'user' = 'user') {
  const supabase = createAdminClient()
  // Busca na papaia_users pelo email (usuário deve ter feito login ao menos uma vez)
  const { data: papUser, error: findError } = await supabase
    .from('papaia_users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()
  if (findError || !papUser) throw new Error('Usuário não encontrado. Ele deve fazer login ao menos uma vez antes de ser associado.')
  const { error } = await supabase
    .from('papaia_users')
    .update({ tenant_id: tenantId, role })
    .eq('id', papUser.id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}
