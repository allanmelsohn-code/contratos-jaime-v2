// src/lib/corretores.ts
// Tipos e utilitários de corretor — dados são buscados via /api/corretores (Supabase)

export type Corretor = {
  apelido: string
  nome: string
  cpf?: string
  cnpj?: string
  creci: string
  banco: string
  agencia: string
  conta: string
  pix?: string
  pixTipo?: string
  obs?: string
}

/**
 * Formata o corretor para exibição na cláusula de comissão do contrato
 */
export function formatarCorretorClausula(c: Corretor, pct: string, valor: string): string {
  const doc = c.cnpj
    ? `inscrita no CNPJ nº ${c.cnpj}`
    : `inscrito(a) no CPF nº ${c.cpf}`

  const creci = c.creci && c.creci !== '—' && c.creci !== '###'
    ? ` e no CRECI/SP nº ${c.creci}`
    : ''

  const banco = `Banco ${c.banco} – Agência: ${c.agencia} – Conta Corrente: ${c.conta}`
  const pix = c.pix ? `, Chave PIX (${c.pixTipo}): ${c.pix}` : ''

  return `${pct}% equivalente a R$ ${valor}, para ${c.nome}, ${doc}${creci} – ${banco}${pix}.`
}
