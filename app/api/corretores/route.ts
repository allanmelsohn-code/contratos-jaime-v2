// GET /api/corretores?tenant_id=xxx&q=busca
// Retorna corretores do tenant filtrados por query

import { createClient } from '@/../../lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id')
  const q = searchParams.get('q') || ''

  if (!tenantId) {
    return Response.json({ error: 'Missing tenant_id' }, { status: 400 })
  }

  const supabase = createClient()

  // Verifica autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Verifica que o usuário pertence ao tenant (ou é superadmin)
  const { data: papUser } = await supabase
    .from('papaia_users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = papUser?.role === 'superadmin'
  const belongsToTenant = papUser?.tenant_id === tenantId

  if (!isSuperAdmin && !belongsToTenant) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let query = supabase
    .from('papaia_corretores')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('ativo', true)
    .order('nome')

  if (q.length >= 2) {
    query = query.or(`nome.ilike.%${q}%,apelido.ilike.%${q}%,cpf.ilike.%${q}%,cnpj.ilike.%${q}%`)
  }

  const { data, error } = await query.limit(50)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json(data)
}
