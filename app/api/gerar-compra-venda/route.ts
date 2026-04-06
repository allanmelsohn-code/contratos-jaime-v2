// app/api/gerar-compra-venda/route.ts
// Generates a Compra e Venda or Escritura DOCX from form state

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, Footer,
} from 'docx'

export const runtime = 'nodejs'
export const maxDuration = 30

import { createClient } from '@/../../lib/supabase/server'

// ── Helpers ──────────────────────────────────────────────────────────────────

function p(text: string, opts: any = {}): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, font: 'Arial', size: 22, ...opts })],
  })
}

function heading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text: text.toUpperCase(), font: 'Arial', size: 22, bold: true })],
  })
}

function qualificarPessoa(pessoa: any): string {
  if (!pessoa) return '###'
  if (pessoa.tipo === 'PJ') {
    const parts = [
      pessoa.razaoSocial || '###',
      pessoa.cnpj ? `inscrita no CNPJ sob nº ${pessoa.cnpj}` : '',
      pessoa.endereco
        ? `com sede na ${pessoa.endereco}, nº ${pessoa.numero || 's/n'}${pessoa.complemento ? `, ${pessoa.complemento}` : ''}${pessoa.bairro ? `, ${pessoa.bairro}` : ''}, CEP ${pessoa.cep || '###'}, ${pessoa.cidade || '###'} – ${pessoa.uf || 'SP'}`
        : '',
    ].filter(Boolean)
    return parts.join(', ')
  }
  const parts = [
    pessoa.nome || '###',
    pessoa.nacionalidade,
    pessoa.estadoCivil
      ? `${pessoa.estadoCivil}${pessoa.conjuge?.regime ? ` sob o regime da ${pessoa.conjuge.regime}` : ''}`
      : '',
    pessoa.profissao,
    pessoa.rg ? `portador(a) da Cédula de Identidade RG nº ${pessoa.rg}` : '',
    pessoa.cpf ? `inscrito(a) no CPF/MF sob nº ${pessoa.cpf}` : '',
    pessoa.endereco
      ? `residente e domiciliado(a) na ${pessoa.endereco}, nº ${pessoa.numero || 's/n'}${pessoa.complemento ? `, ${pessoa.complemento}` : ''}${pessoa.bairro ? `, ${pessoa.bairro}` : ''}, CEP ${pessoa.cep || '###'}, ${pessoa.cidade || '###'} – ${pessoa.uf || 'SP'}`
      : '',
  ].filter(Boolean)
  return parts.join(', ')
}

function signatureTable(signatarios: Array<{ nome: string; role: string }>): Table {
  const pairs: Array<[any, any]> = []
  for (let i = 0; i < signatarios.length; i += 2) {
    pairs.push([signatarios[i], signatarios[i + 1] || null])
  }

  const border = { style: BorderStyle.NONE }
  const borders = { top: border, bottom: border, left: border, right: border }

  const makeCell = (sig: { nome: string; role: string } | null) =>
    new TableCell({
      borders,
      width: { size: 4500, type: WidthType.DXA },
      margins: { top: 200, bottom: 100, left: 200, right: 200 },
      children: sig
        ? [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '1A1612', space: 1 } },
              spacing: { before: 600, after: 60 },
              children: [new TextRun({ text: '' })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: sig.nome, font: 'Arial', size: 18, bold: true })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: sig.role, font: 'Arial', size: 18, color: '666666' })],
            }),
          ]
        : [new Paragraph({ children: [new TextRun('')] })],
    })

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4500, 360, 4500],
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: pairs.map(([a, b]) =>
      new TableRow({
        children: [
          makeCell(a),
          new TableCell({
            borders,
            width: { size: 360, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun('')] })],
          }),
          makeCell(b),
        ],
      })
    ),
  })
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await request.json()
  const {
    modalidade,
    vendedores = [],
    compradores = [],
    negocio = {},
    testemunhas = [],
    admJaime,
  } = data

  const isEscritura = modalidade === 'escritura'
  const hoje = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

  const titulo = isEscritura
    ? 'ESCRITURA DE COMPRA E VENDA'
    : 'INSTRUMENTO PARTICULAR DE COMPROMISSO DE COMPRA E VENDA'

  const vendLabel = isEscritura ? 'OUTORGANTE(S) VENDEDOR(ES)' : 'VENDEDOR(ES)'
  const compLabel = isEscritura ? 'OUTORGADO(S) COMPRADOR(ES)' : 'COMPRADOR(ES)'
  const vendSingle = isEscritura ? 'OUTORGANTE(A)' : 'VENDEDOR(A)'
  const compSingle = isEscritura ? 'OUTORGADO(A)' : 'COMPRADOR(A)'

  // Qualificação das partes paragraphs
  const partesParas: Paragraph[] = [
    heading('Qualificação das Partes'),
    p(`${vendLabel}:`),
    ...vendedores.map((v: any, i: number) =>
      p(`${i + 1}) ${qualificarPessoa(v)}.`)
    ),
    p(`${compLabel}:`),
    ...compradores.map((c: any, i: number) =>
      p(`${i + 1}) ${qualificarPessoa(c)}.`)
    ),
  ]

  // Imóvel description
  const neg = negocio
  const imStr = [
    neg.tipo,
    neg.endereco ? `situado na ${neg.endereco}` : '',
    neg.numero ? `nº ${neg.numero}` : '',
    neg.complemento,
    neg.bairro,
    neg.cep ? `CEP ${neg.cep}` : '',
    neg.cidade && neg.uf ? `${neg.cidade}/${neg.uf}` : (neg.cidade || neg.uf || ''),
    neg.matricula ? `inscrito na matrícula nº ${neg.matricula}` : '',
    neg.cartorio ? `do ${neg.cartorio}` : '',
    neg.comarca ? `${neg.comarca}` : '',
    neg.area ? `com área de ${neg.area} m²` : '',
  ].filter(Boolean).join(', ')

  // Payment description
  let pagamento = `O preço total da presente transação é de R$ ${neg.valorTotal || '###'}.`
  if (neg.sinal) {
    const dataStr = neg.dataSinal
      ? ` em ${new Date(neg.dataSinal).toLocaleDateString('pt-BR')}`
      : ' na data de assinatura deste instrumento'
    pagamento += ` Sinal de R$ ${neg.sinal}${dataStr}.`
  }
  if (neg.modalidadePagamento && neg.modalidadePagamento !== 'À vista') {
    const prazo = neg.prazoEscritura ? ` no prazo de ${neg.prazoEscritura} dias para lavratura da escritura definitiva` : ''
    const banco = neg.banco ? ` via ${neg.banco}` : ''
    pagamento += ` Restante via ${neg.modalidadePagamento}${banco}${prazo}.`
  }

  // Posse clause
  const posseText =
    neg.posseNaEscritura !== false
      ? 'A posse do imóvel será transferida ao(à) COMPRADOR(A) na data da assinatura da escritura definitiva de compra e venda.'
      : 'A posse do imóvel será transferida ao(à) COMPRADOR(A) na data da assinatura do presente instrumento.'

  // Intermediação
  const comissaoQuitada = neg.comissaoQuitada !== false ? 'já quitada' : 'a ser quitada'
  const intermediacaoParas: Paragraph[] = admJaime
    ? [
        heading('Da Intermediação'),
        p(
          `A presente transação foi intermediada pela JAIMERX IMOBILIÁRIA LTDA, CNPJ 63.271.809/0001-78, CRECI/SP nº 51586-J. A comissão de intermediação é de responsabilidade do(a) ${vendSingle} e encontra-se ${comissaoQuitada}.`
        ),
      ]
    : []

  // Cláusula livre
  const clausulaLivreParas: Paragraph[] = neg.clausulaLivre
    ? [heading('Disposições Especiais'), p(neg.clausulaLivre)]
    : []

  // Signatários
  const signatarios: Array<{ nome: string; role: string }> = [
    ...vendedores.map((v: any) => ({
      nome: v.tipo === 'PJ' ? (v.razaoSocial || 'VENDEDOR') : (v.nome || 'VENDEDOR'),
      role: isEscritura ? 'OUTORGANTE(A) VENDEDOR(A)' : 'VENDEDOR(A)',
    })),
    ...compradores.map((c: any) => ({
      nome: c.tipo === 'PJ' ? (c.razaoSocial || 'COMPRADOR') : (c.nome || 'COMPRADOR'),
      role: isEscritura ? 'OUTORGADO(A) COMPRADOR(A)' : 'COMPRADOR(A)',
    })),
    ...testemunhas.map((t: any, i: number) => ({
      nome: t.nome || `TESTEMUNHA ${i + 1}`,
      role: 'TESTEMUNHA',
    })),
    { nome: 'JAIMERX IMOBILIÁRIA LTDA', role: 'CNPJ 63.271.809/0001-78 · Intermediadora' },
  ]

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'JAIMERX IMOBILIÁRIA LTDA · CNPJ 63.271.809/0001-78 · CRECI/SP 51586-J',
                    font: 'Arial',
                    size: 16,
                    color: '888888',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Título
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 160 },
            children: [new TextRun({ text: titulo, font: 'Arial', size: 28, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 80 },
            children: [
              new TextRun({
                text: `Intermediação: JAIMERX IMOBILIÁRIA LTDA · CNPJ 63.271.809/0001-78 · CRECI/SP nº 51586-J`,
                font: 'Arial',
                size: 18,
                color: '666666',
              }),
            ],
          }),

          // Cidade e data
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 120 },
            children: [new TextRun({ text: `São Paulo, ${hoje}`, font: 'Arial', size: 22 })],
          }),

          // Qualificação das Partes
          ...partesParas,

          // Do Objeto
          heading('Do Objeto'),
          p(
            `Os ${vendLabel} têm justo e acordado com os ${compLabel} a venda do seguinte imóvel: ${imStr}.`
          ),

          // Do Preço
          heading('Do Preço e Forma de Pagamento'),
          p(pagamento),

          // Do ITBI
          heading('Do Imposto de Transmissão'),
          neg.itbiComprador !== false
            ? p(
                `O ITBI (Imposto de Transmissão de Bens Imóveis) incidente na presente transação será de responsabilidade do(a) ${compSingle}, nos termos do artigo 156, II da Constituição Federal.`
              )
            : p(
                `O ITBI (Imposto de Transmissão de Bens Imóveis) e demais custas de transferência serão de responsabilidade conforme acordado entre as partes.`
              ),

          // Da Posse
          heading('Da Posse'),
          p(posseText),

          // Das Declarações dos Vendedores
          heading('Das Declarações dos Vendedores'),
          p(
            `O(A) ${vendSingle} declara, sob as penas da lei: (a) que é o(a) legítimo(a) proprietário(a) do imóvel; (b) que o imóvel está livre e desembaraçado de quaisquer ônus, dívidas, hipotecas, penhoras, ações reais ou pessoais reipersecutórias; (c) que não existem débitos de IPTU, condomínio ou outros encargos pendentes sobre o imóvel; (d) que responde pela evicção do imóvel, nos termos dos artigos 447 e seguintes do Código Civil.`
          ),

          // Das Multas
          heading('Das Multas e Penalidades'),
          p(
            `Em caso de desistência ou descumprimento injustificado de qualquer das cláusulas do presente instrumento, a parte infratora pagará à outra, a título de multa, o equivalente a 10% (dez por cento) do valor total da transação, sem prejuízo das perdas e danos eventualmente apurados.`
          ),

          // Da Intermediação
          ...intermediacaoParas,

          // Cláusula livre
          ...clausulaLivreParas,

          // Do Foro
          heading('Do Foro'),
          p(
            `Fica eleito o Foro Central da Comarca da Capital de São Paulo para dirimir quaisquer controvérsias oriundas do presente instrumento, com expressa renúncia a qualquer outro, por mais privilegiado que seja.`
          ),

          // Fechamento
          new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun('')] }),
          p(
            `E, por estarem assim, justos e contratados, assinam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença das testemunhas abaixo identificadas.`
          ),

          // Cidade/data e assinaturas
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 200 },
            children: [new TextRun({ text: `São Paulo, ${hoje}`, font: 'Arial', size: 22 })],
          }),

          signatureTable(signatarios),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="contrato-cv.docx"`,
    },
  })
}
