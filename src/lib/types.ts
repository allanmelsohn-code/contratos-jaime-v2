// Tipos compartilhados entre componentes e páginas

export type ExtractedDoc = {
  filename: string
  classification: { type: string; role: string; index: number; extractFields: string[] }
  extracted: Record<string, any>
  status: 'pending' | 'loading' | 'done' | 'error'
  error?: string
}

export type FormState = {
  modalidade: 'locacao' | 'compra-venda' | 'escritura' | null
  admJaime: boolean
  gnt: 'fiador' | 'seguro' | 'caucao' | 'titulo' | 'imovel-cau' | null
  locadores: any[]
  locatarios: any[]
  fiadores: any[]
  imovel: any
  valor: any
  garantia: any
  comissao: any
  clausulas: any
  testemunhas: any[]
  vendedores: any[]
  compradores: any[]
  negocio: any
}

export type FileInfo = {
  id: string; name: string; size: number
  mimeType: string; downloadUrl: string; lastModified: string
}

// Tenant config carregado do Supabase
export type TenantConfig = {
  id: string
  slug: string
  nome: string
  cnpj?: string
  creci?: string
  logo_url?: string
  cor_primaria: string
  cor_secundaria: string
  plano: 'trial' | 'starter' | 'pro' | 'business'
  contratos_usados: number
  contratos_limite: number
  status: 'trial' | 'active' | 'suspended'
  trial_ends_at?: string
}

export type PapaiaUser = {
  id: string
  email: string
  nome?: string
  tenant_id?: string
  role: 'superadmin' | 'admin' | 'user'
}
