'use server'

import { createAdminClient } from '@/../../lib/supabase/admin'
import { revalidatePath } from 'next/cache'

type ActionResult = { error?: string }

// ── Criar tenant ──────────────────────────────────────────
export async function criarTenant(formData: FormData): Promise<ActionResult> {
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
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

// ── Liberar trial ─────────────────────────────────────────
export async function liberarTrial(tenantId: string, dias: number): Promise<ActionResult> {
  const supabase = createAdminClient()
  const trial_ends_at = new Date(Date.now() + dias * 86_400_000).toISOString()
  const { error } = await supabase
    .from('papaia_tenants')
    .update({ status: 'trial', trial_ends_at })
    .eq('id', tenantId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

// ── Ativar conta ──────────────────────────────────────────
export async function ativarTenant(tenantId: string): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('papaia_tenants')
    .update({ status: 'active', trial_ends_at: null })
    .eq('id', tenantId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

// ── Suspender conta ───────────────────────────────────────
export async function suspenderTenant(tenantId: string): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('papaia_tenants')
    .update({ status: 'suspended' })
    .eq('id', tenantId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

// ── Editar contador de contratos ──────────────────────────
export async function editarContador(tenantId: string, usados: number, limite: number): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('papaia_tenants')
    .update({ contratos_usados: usados, contratos_limite: limite })
    .eq('id', tenantId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

// ── Resetar contador mensal ───────────────────────────────
export async function resetarContador(tenantId: string): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('papaia_tenants')
    .update({ contratos_usados: 0 })
    .eq('id', tenantId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return {}
}

// ── Criar usuário e associar a tenant ─────────────────────
export async function criarUsuario(email: string, senha: string, tenantId: string, role: 'admin' | 'user' = 'user'): Promise<ActionResult> {
  const supabase = createAdminClient()

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password: senha,
    email_confirm: true,
  })
  if (createError) return { error: createError.message }

  const userId = created.user.id

  await supabase.from('papaia_users').upsert(
    { id: userId, email: email.toLowerCase().trim() },
    { onConflict: 'id' }
  )

  const { error } = await supabase
    .from('papaia_users')
    .update({ tenant_id: tenantId, role })
    .eq('id', userId)
  if (error) return { error: error.message }

  revalidatePath('/admin')
  return {}
}
