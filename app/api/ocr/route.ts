// app/api/ocr/route.ts
// Receives a file (base64 or download URL) + filename hint
// Returns structured fields extracted by Claude Vision

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * ─────────────────────────────────────────────────────────────────
 *  CONVENÇÃO DE NOMES DE ARQUIVO — JAIME IMOBILIÁRIA
 * ─────────────────────────────────────────────────────────────────
 *
 *  Formato: [tipo-doc]-[papel][numero].[ext]
 *  O número é opcional para o primeiro de cada papel.
 *  Extensões aceitas: .jpg .jpeg .png .pdf
 *
 *  PARTES PESSOAS FÍSICAS
 *  ──────────────────────
 *  RG-locador1.jpg          RG do locador 1
 *  RG-locador2.jpg          RG do locador 2 (se houver mais de um)
 *  RG-locatario1.jpg        RG do locatário 1
 *  RG-locatario2.jpg        RG do locatário 2 (cônjuge/companheiro)
 *  RG-fiador1.jpg           RG do fiador 1
 *  RG-fiador2.jpg           RG do fiador 2
 *  RG-conjuge-fiador1.jpg   RG do cônjuge/convivente do fiador 1
 *  CNH-locador1.jpg         CNH do locador (alternativa ao RG)
 *  CNH-locatario1.jpg       CNH do locatário
 *  CNH-fiador1.jpg          CNH do fiador
 *  passaporte-locatario1.jpg  Passaporte (estrangeiros)
 *  passaporte-locador1.jpg
 *
 *  PARTES PESSOAS JURÍDICAS
 *  ────────────────────────
 *  CNPJ-locatario1.pdf      Cartão CNPJ do locatário PJ
 *  CNPJ-locador1.pdf        Cartão CNPJ do locador PJ
 *  contrato-social-locatario1.pdf   Contrato Social / Estatuto
 *  contrato-social-locador1.pdf
 *  procuracao-locatario1.pdf  Procuração do representante legal
 *  procuracao-locador1.pdf
 *  RG-rep-locatario1.jpg    RG do representante legal (locatário PJ)
 *  RG-rep-locador1.jpg      RG do representante legal (locador PJ)
 *
 *  COMPROVANTES DE ENDEREÇO
 *  ────────────────────────
 *  comprovante-locador1.jpg     Comprovante de endereço do locador
 *  comprovante-locatario1.jpg   Comprovante de endereço do locatário
 *  comprovante-fiador1.jpg      Comprovante de endereço do fiador
 *
 *  DADOS BANCÁRIOS
 *  ───────────────
 *  banco-locador1.jpg       Print/foto dos dados bancários do locador
 *  banco-locatario1.jpg     Dados bancários do locatário
 *
 *  IMÓVEL
 *  ──────
 *  matricula-imovel.pdf     Certidão de matrícula atualizada
 *  iptu-imovel.pdf          Carnê/guia do IPTU (extrai dados do imóvel)
 *  planta-imovel.pdf        Planta do imóvel (informativo, não extrai dados)
 *
 *  GARANTIA — CAUÇÃO
 *  ─────────────────
 *  caucao-comprovante.jpg   Comprovante de depósito da caução
 *
 *  GARANTIA — TÍTULO DE CAPITALIZAÇÃO
 *  ────────────────────────────────────
 *  titulo-capitalizacao.pdf   Proposta/apólice do título
 *
 *  GARANTIA — SEGURO FIANÇA
 *  ─────────────────────────
 *  apolice-seguro.pdf       Apólice do seguro fiança
 *
 *  OUTROS
 *  ──────
 *  vistoria.pdf             Laudo de vistoria do imóvel (anexo ao contrato)
 *  aditivo.pdf              Aditivo contratual anterior (referência)
 * ─────────────────────────────────────────────────────────────────
 */
function classifyDocument(filename: string): {
  type: string
  role: string
  index: number
  extractFields: string[]
} {
  const lower = filename.toLowerCase().replace(/[^a-z0-9]/g, '-')

  // ── Role detection (order matters — more specific first) ──
  const roleMap: Array<[string, string]> = [
    ['conjuge-fiador',  'conjuge'],
    ['rep-locatario',   'rep_locatario'],  // representante legal PJ
    ['rep-locador',     'rep_locador'],
    ['locatario',       'locatario'],
    ['locador',         'locador'],
    ['fiador',          'fiador'],
    ['imovel',          'imovel'],
  ]

  // ── Document type detection ──
  const docTypeMap: Record<string, { type: string; fields: string[] }> = {
    rg: {
      type: 'RG',
      fields: ['nome', 'cpf', 'rg', 'orgao_expedidor', 'data_nascimento', 'naturalidade', 'filiacao_mae', 'filiacao_pai'],
    },
    cnh: {
      type: 'CNH',
      fields: ['nome', 'cpf', 'rg', 'data_nascimento', 'validade', 'categoria', 'numero_registro'],
    },
    cpf: {
      type: 'Cartão CPF',
      fields: ['nome', 'cpf', 'data_nascimento'],
    },
    passaporte: {
      type: 'Passaporte',
      fields: ['nome', 'nacionalidade', 'numero_passaporte', 'data_nascimento', 'validade', 'pais_emissao'],
    },
    cnpj: {
      type: 'Cartão CNPJ',
      fields: ['razao_social', 'cnpj', 'endereco', 'numero', 'complemento', 'bairro', 'cep', 'cidade', 'uf', 'representante_legal', 'natureza_juridica', 'data_abertura'],
    },
    'contrato-social': {
      type: 'Contrato Social',
      fields: ['razao_social', 'cnpj', 'socios', 'representante_legal', 'cpf_representante', 'endereco', 'objeto_social'],
    },
    procuracao: {
      type: 'Procuração',
      fields: ['outorgante', 'outorgado', 'cpf_outorgante', 'cpf_outorgado', 'poderes', 'data_emissao', 'validade'],
    },
    matricula: {
      type: 'Matrícula do Imóvel',
      fields: ['numero_matricula', 'comarca', 'cartorio', 'endereco_imovel', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep', 'proprietario', 'area_total', 'area_util', 'fracao_ideal'],
    },
    iptu: {
      type: 'IPTU',
      fields: ['endereco_imovel', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep', 'inscricao_fiscal', 'proprietario', 'valor_iptu'],
    },
    comprovante: {
      type: 'Comprovante de Endereço',
      fields: ['nome', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep'],
    },
    banco: {
      type: 'Dados Bancários',
      fields: ['banco', 'agencia', 'conta', 'tipo_conta', 'titular', 'cpf_titular', 'cnpj_titular', 'pix'],
    },
    'titulo-capitalizacao': {
      type: 'Título de Capitalização',
      fields: ['numero_titulo', 'valor_nominal', 'instituicao', 'data_emissao', 'vigencia', 'titular', 'cpf_titular'],
    },
    apolice: {
      type: 'Apólice de Seguro Fiança',
      fields: ['numero_apolice', 'seguradora', 'pac', 'vigencia_inicio', 'vigencia_fim', 'segurado', 'valor_segurado'],
    },
    vistoria: {
      type: 'Laudo de Vistoria',
      fields: ['data_vistoria', 'endereco_imovel', 'responsavel', 'observacoes'],
    },
  }

  // Extract role and index from filename
  let role = 'desconhecido'
  let index = 1
  for (const [key, val] of roleMap) {
    if (lower.includes(key.replace('-', '-?'))) {
      role = val
      // extract trailing number
      const escaped = key.replace(/-/g, '-?')
      const match = lower.match(new RegExp(escaped + '-?(\\d+)'))
      if (match) index = parseInt(match[1])
      break
    }
  }

  // Extract document type — try multi-word keys first
  let docType = { type: 'Documento', fields: ['nome', 'cpf', 'rg', 'endereco', 'cidade', 'uf', 'cep'] }
  // Sort keys descending by length so "titulo-capitalizacao" matches before "titulo"
  const sortedKeys = Object.keys(docTypeMap).sort((a, b) => b.length - a.length)
  for (const key of sortedKeys) {
    if (lower.includes(key.replace(/-/g, '-?'))) {
      docType = docTypeMap[key]
      break
    }
  }

  return {
    type: docType.type,
    role,
    index,
    extractFields: docType.fields,
  }
}

import { createClient } from '@/../../lib/supabase/server'

export async function POST(request: Request) {
  try {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { filename, imageBase64, mimeType, downloadUrl, explicitRole, explicitDocType, extractFields } = body

  if (!filename) {
    return Response.json({ error: 'Missing filename' }, { status: 400 })
  }

  const classification = explicitRole
    ? {
        type: explicitDocType ?? 'Documento',
        role: explicitRole,
        index: 1,
        extractFields: extractFields ?? [],
      }
    : classifyDocument(filename)
  const fieldsJson = classification.extractFields.join('", "')

  const systemPrompt = `Você é um sistema OCR especializado em documentos brasileiros.
Extraia APENAS os dados solicitados. Responda SOMENTE com JSON válido, sem markdown, sem explicações.
Se um campo não estiver visível ou legível, retorne null para esse campo.
Para CPF, retorne no formato 000.000.000-00.
Para CNPJ, retorne no formato 00.000.000/0000-00.
Para campos de data (data_nascimento, validade, data_emissao, data_abertura, vigencia_inicio, vigencia_fim, data_vistoria), retorne no formato DD/MM/AAAA.
Para RG e número_registro, retorne EXATAMENTE como aparece no documento, sem reformatar.
Para CEP, retorne no formato 00000-000.`

  const userPrompt = `Este é um documento do tipo: ${classification.type}
Papel no contrato: ${classification.role}${classification.index > 1 ? ` ${classification.index}` : ''}

Extraia os seguintes campos e retorne como JSON:
{
  "${fieldsJson.split('", "').join('": null,\n  "')}: null
}`

  // Prepare image/document content
  let imageContent: any

  function normalizeMime(mime: string, name?: string): string {
    if (mime.includes('pdf') || name?.toLowerCase().endsWith('.pdf')) return 'application/pdf'
    if (mime.includes('png') || name?.toLowerCase().endsWith('.png')) return 'image/png'
    if (mime.includes('webp') || name?.toLowerCase().endsWith('.webp')) return 'image/webp'
    if (mime.includes('gif') || name?.toLowerCase().endsWith('.gif')) return 'image/gif'
    return 'image/jpeg'
  }

  function buildContent(data: string, rawMime: string, name?: string) {
    const mime = normalizeMime(rawMime, name)
    const isPdf = mime === 'application/pdf'
    return isPdf
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } }
      : { type: 'image', source: { type: 'base64', media_type: mime, data } }
  }

  if (imageBase64 && mimeType) {
    imageContent = buildContent(imageBase64, mimeType, filename)
  } else if (downloadUrl) {
    const imgRes = await fetch(downloadUrl)
    const imgBuffer = await imgRes.arrayBuffer()
    const imgBase64 = Buffer.from(imgBuffer).toString('base64')
    const imgMime = imgRes.headers.get('content-type') || 'image/jpeg'
    imageContent = buildContent(imgBase64, imgMime, filename)
  } else {
    return Response.json({ error: 'Missing imageBase64+mimeType or downloadUrl' }, { status: 400 })
  }

  // ── Anthropic (primary + fallback conta 2) ───────────────────────────────────
  const anthropicKeys = [
    process.env.ANTHROPIC_API_KEY,
    process.env.ANTHROPIC_API_KEY_2,
  ].filter(Boolean) as string[]

  const errors: string[] = []

  for (const key of anthropicKeys) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: [imageContent, { type: 'text', text: userPrompt }] }],
      }),
    })

    if (res.ok) {
      const data = await res.json()
      const rawText = data.content?.[0]?.text || '{}'
      let extracted: Record<string, any> = {}
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      try { extracted = JSON.parse(jsonMatch ? jsonMatch[0] : rawText.replace(/```json|```/g, '').trim()) }
      catch { extracted = { _raw: rawText } }
      if (extracted._raw !== undefined && Object.keys(extracted).length === 1) {
        return Response.json({ error: 'Não foi possível extrair os dados do documento. Tente preencher manualmente.' }, { status: 422 })
      }
      return Response.json({ filename, classification, extracted, tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens, provider: 'anthropic' })
    }

  }

  return Response.json({ error: 'Sem créditos disponíveis. Adicione créditos na conta Anthropic.' }, { status: 402 })

  } catch (err: any) {
    return Response.json({ error: err.message || 'Erro interno no OCR' }, { status: 500 })
  }
}
