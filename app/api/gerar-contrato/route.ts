// app/api/gerar-contrato/route.ts
// Receives complete form state, generates .docx using docx-js
// Returns the file as a download

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel,
  PageNumber, Footer, Header, TabStopType, TabStopPosition,
} from 'docx'

export const runtime = 'nodejs' // docx needs Node runtime
export const maxDuration = 30

import { createClient } from '@lib/supabase/server'

// ── Helpers ──────────────────────────────────────────────────────────────────

function p(text: string, opts: any = {}): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 120, line: 360 }, // Better spacing
    children: [new TextRun({ text, font: 'Arial', size: 22, ...opts })],
  })
}

function heading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: text.toUpperCase(), font: 'Arial', size: 22, bold: true })],
  })
}

function b(text: string, opts: any = {}): TextRun {
  return new TextRun({ text, font: 'Arial', size: 22, bold: true, ...opts })
}

function r(text: string, opts: any = {}): TextRun {
  return new TextRun({ text, font: 'Arial', size: 22, ...opts })
}

function qrRow(label: string, value: string): TableRow {
  const cellStyle = {
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    margins: { top: 60, bottom: 40, left: 100, right: 60 },
  }
  return new TableRow({
    children: [
      new TableCell({
        ...cellStyle,
        width: { size: 2200, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: label, font: 'Arial', size: 20, bold: true })] })],
      }),
      new TableCell({
        ...cellStyle,
        width: { size: 7160, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: value, font: 'Arial', size: 20 })] })],
      }),
    ],
  })
}

function quadroResumo(data: any): Table {
  const { locadores, locatarios, fiadores, imovel, garantia, valor, gnt } = data

  const locNomes = locadores.map((l: any) => qualificarPessoa(l)).join('; e, ')
  const ltNomes = locatarios.map((l: any) => qualificarPessoa(l)).join('; e, ')

  const imStr = [
    [imovel.tipo, imovel.complemento?.toUpperCase()].filter(Boolean).join(' — '),
    `${imovel.endereco}, nº ${imovel.numero}`,
    imovel.bairro,
    `CEP ${imovel.cep} – ${imovel.cidade}/${imovel.uf}`,
    imovel.vaga ? `com direito ao uso de ${imovel.vaga} de garagem` : '',
  ].filter(Boolean).join(', ')

  const prazoMeses = parseInt(valor.prazo) || 30
  const prazoExt = prazoExtenso(prazoMeses)
  const inicio = formatDate(valor.inicio)
  const termino = calcTermino(valor.inicio, prazoMeses)

  const gntStr = formatGarantia(gnt, garantia)

  const hasFiadorRow = gnt === 'fiador' && fiadores?.length
  const hasImovelCauRow = gnt === 'imovel-cau' && garantia?.caucionantes?.length
  const rows = [
    ['I — Locador(a):', locNomes || '###'],
    ['II — Locatário(a):', ltNomes || '###'],
    ...(hasFiadorRow
      ? [['III — Fiador(es):', fiadores.map((f: any) => qualificarPessoa(f)).join('; e, ')]]
      : []),
    ...(hasImovelCauRow
      ? [['III — Caucionante(s):', garantia.caucionantes.map((c: any) => c.nome || '###').join('; e, ')]]
      : []),
    [`${hasFiadorRow || hasImovelCauRow ? 'IV' : 'III'} — Imóvel:`, imStr],
    [`${hasFiadorRow || hasImovelCauRow ? 'V' : 'IV'} — Garantia:`, gntStr],
    [`${hasFiadorRow || hasImovelCauRow ? 'VI' : 'V'} — Finalidade:`, `Exclusivamente para fins ${imovel.finalidade === 'comerciais' ? 'comerciais' : 'RESIDENCIAIS dos Locatários'}`],
    [`${hasFiadorRow || hasImovelCauRow ? 'VII' : 'VI'} — Prazo:`, `De ${prazoExt} (${prazoMeses}) meses a partir de ${inicio} e término em ${termino}`],
    [`${hasFiadorRow || hasImovelCauRow ? 'VIII' : 'VII'} — Aluguel:`, `R$ ${valor.aluguel} MENSAL`],
    [`${hasFiadorRow || hasImovelCauRow ? 'IX' : 'VIII'} — Vencimento:`, `Todo dia ${valor.vencimento} de cada mês`],
    [`${hasFiadorRow || hasImovelCauRow ? 'X' : 'IX'} — Multa por atraso:`, valor.multa || '10% (dez por cento)'],
    [`${hasFiadorRow || hasImovelCauRow ? 'XI' : 'X'} — Reajuste:`, valor.reajuste || 'a cada 12 meses'],
    [`${hasFiadorRow || hasImovelCauRow ? 'XII' : 'XI'} — Índice de correção:`, valor.indice || 'IGP-M da FGV'],
  ]

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2200, 7160],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '1A1612' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '1A1612' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '1A1612' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '1A1612' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 2,
            shading: { fill: '1A1612', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 160, right: 160 },
            width: { size: 9360, type: WidthType.DXA },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'QUADRO RESUMO', font: 'Arial', size: 22, bold: true, color: 'F5F0E8' })],
            })],
          }),
        ],
      }),
      ...rows.map(([label, value]) => qrRow(label, value)),
    ],
  })
}

function qualificarPessoa(p: any): string {
  if (!p?.nome) return '###'
  const parts = [
    p.nome,
    p.nacionalidade,
    p.estadoCivil ? `${p.estadoCivil}${p.regime ? ` sob o regime da ${p.regime}` : ''}` : '',
    p.profissao,
    p.rg ? `portador(a) da Cédula de Identidade RG nº ${p.rg}${p.orgao ? `-${p.orgao}` : ''}` : '',
    p.cpf ? `inscrito(a) no CPF/MF sob nº ${p.cpf}` : (p.cnpj ? `inscrita no CNPJ sob nº ${p.cnpj}` : ''),
    p.endereco ? `residente e domiciliado(a) na ${p.endereco}, nº ${p.numero || 's/n'}${p.complemento ? `, ${p.complemento}` : ''}${p.bairro ? `, ${p.bairro}` : ''}, CEP ${p.cep || '###'}, ${p.cidade || '###'} – ${p.uf || 'SP'}` : '',
  ].filter(Boolean)
  return parts.join(', ')
}

function formatGarantia(gnt: string, garantia: any): string {
  switch (gnt) {
    case 'caucao':
      return `CAUÇÃO no valor de R$ ${garantia.valor}, creditados na conta bancária indicada pelo(a) LOCADOR(A) – Banco ${garantia.banco} – Agência ${garantia.agencia} – C/C ${garantia.conta} – PIX (${garantia.pixTipo}): ${garantia.pix}`
    case 'titulo': {
      const inst = garantia.instituicao === 'Outra' ? (garantia.outraInstituicao || '###') : (garantia.instituicao || 'Porto Seguro Capitalização S.A')
      return `TÍTULO DE CAPITALIZAÇÃO no valor nominal de R$ ${garantia.valor} subscrito(s) pela ${inst}, proposta/formulário nº ${garantia.numero}`
    }
    case 'seguro':
      return `SEGURO FIANÇA – ${garantia.seguradora}, Apólice nº ${garantia.apolice}${garantia.pac ? `, PAC: ${garantia.pac}` : ''}${garantia.cobertura ? ` – Cobertura: ${garantia.cobertura}` : ''}`
    case 'fiador':
      return 'Conforme qualificação no item III do Quadro Resumo'
    case 'imovel-cau': {
      const cNomes = (garantia.caucionantes || []).map((c: any) => c.nome).filter(Boolean).join('; e, ') || '###'
      return `CAUÇÃO DE IMÓVEL – Matrícula nº ${garantia.matricula || '###'} do ${garantia.cartorio || '###'} – Caucionantes: ${cNomes}`
    }
    default:
      return '###'
  }
}

function prazoExtenso(n: number): string {
  const map: Record<number, string> = { 12: 'doze', 18: 'dezoito', 24: 'vinte e quatro', 30: 'trinta', 36: 'trinta e seis', 48: 'quarenta e oito', 60: 'sessenta' }
  return map[n] || String(n)
}

function formatDate(iso: string): string {
  if (!iso) return '###'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

function calcTermino(iso: string, meses: number): string {
  if (!iso) return '###'
  const d = new Date(iso)
  d.setMonth(d.getMonth() + meses)
  return d.toLocaleDateString('pt-BR')
}

function garantiaClause(gnt: string, garantia: any, fiadores: any[]): Paragraph[] {
  const clauses: Paragraph[] = [heading('Da Garantia Locatícia')]

  if (gnt === 'fiador') {
    const fNomes = fiadores.map((f: any) => f.nome || '###').join('; e, ')
    clauses.push(
      p(`O(s) FIADOR(ES) — ${fNomes} — assinam o presente contrato como principal(is) pagador(es) solidário(s) com o(a) LOCATÁRIO(A) pelas obrigações aqui assumidas, tanto pelos aluguéis e encargos locatícios, inclusive pela multa contratual e eventuais danos causados ao imóvel locado, como também pela majoração e revisão de aluguéis decorrentes inclusive de acordos judiciais e extrajudiciais e pela exatidão das qualificações deste constantes, cuja responsabilidade subsistirá até a entrega real e efetiva das chaves do imóvel, dando quitação plena, mesmo que isso venha a ocorrer após o término do prazo da locação.`),
      p(`13.1 — O(s) FIADOR(ES) renuncia(m) expressamente ao direito de exoneração previsto nos artigos 835, 836, 837, 838 e seguintes do Código Civil Brasileiro (Lei 10.406/02), bem como, ao benefício de ordem previsto no artigo 827 e seguintes do mesmo diploma legal.`),
      p(`13.2 — A garantia ora prestada pelo(s) FIADOR(ES) permanecerá válida e efetiva até a data em que o(a) LOCADOR(A), ou seu procurador(a) ou ainda seu representante legal, passar recibo das chaves, dando quitação plena ao(à) LOCATÁRIO(A), mesmo que isso venha a ocorrer após o término do prazo de locação.`),
      p(`13.3 — O(A) LOCATÁRIO(A) e FIADOR(ES), devidamente qualificados nos itens II e III do quadro resumo deste contrato, neste ato, e por instrumento, outorgam reciprocamente, amplos e gerais poderes para, em seu nome, receberem individualmente ou conjuntamente, intimações, notificações, mediante correspondência com aviso de recebimento, interpelações e citações judiciais ou extrajudiciais referentes a eventuais lides decorrentes da locação ora contratada.`),
      p(`13.4 — Quaisquer alterações de endereço no curso do contrato deverão ser comunicadas por escrito por uma parte a outra.`),
      p(`13.5 — A imobiliária e Administradora do imóvel são meramente intermediadoras da relação locatícia, não havendo por parte destas nenhumas retenções de valores e, portanto, não tem responsabilidade sob os atos praticados pelo(a) LOCADOR(A), LOCATÁRIO(A) e ou FIADOR(ES).`),
      heading('Morte, recuperação judicial, falência, insolvência e mudanças'),
      p(`No caso de morte, recuperação judicial, falência, ou comprovada insolvência, mudança de Estado ou de País do(s) FIADOR(ES), ou em qualquer outra hipótese prevista no artigo 40, da Lei 8.245/91, com a nova redação dada pela Lei 12.112/09, o(a) LOCATÁRIO(A) obriga-se no prazo improrrogável de 30 (trinta) dias a contar do evento, a dar-lhes substitutos idôneos ou, a juízo da LOCADOR(A), oferecer uma das demais garantias estabelecidas no artigo 37, da Lei 8245/91, sob pena de incorrer na multa contratual e ensejando a rescisão contratual em razão da infração cometida.`)
    )
  } else if (gnt === 'caucao') {
    clauses.push(
      p(`A garantia ora prestada pelo(a) LOCATÁRIO(A) é o valor constante no item IV do quadro resumo, para cobertura de aluguéis, encargos e/ou danos ao imóvel, depositado em conta corrente do(a) LOCADOR(A) e permanecerá válida e efetiva até a data em que o(a) LOCADOR(A) passar recibo das chaves, dando quitação plena ao(à) LOCATÁRIO(A), mesmo que isso venha a ocorrer após o término do prazo de locação. A responsabilidade de devolução da caução é exclusiva do(a) LOCADOR(A).`),
      p(`13.1 — Uma vez efetuada vistoria no imóvel e respectivo recibo de entrega de chaves, portanto, não havendo por parte do(a) LOCADOR(A) nada a reclamar, fica este, obrigado(a) a proceder a imediata devolução do valor da caução, devidamente atualizado pelo índice da Caderneta de Poupança (ou 100% do CDI, se assim pactuado), mediante depósito em conta corrente do(a) LOCATÁRIO(A).`),
      p(`13.2 — Após efetuada a vistoria, apontando eventuais danos e problemas correlacionados ao imóvel, o(a) LOCADOR(A) deverá notificar o(a) LOCATÁRIO(A) com cópia anexa da vistoria para que este no prazo de 5 (cinco) dias, inicie a correção dos danos, sob pena de não fazendo, o(a) LOCADOR(A) providenciará às suas expensas a devida correção. Até a solução dos problemas apontados, a caução ficará retida em poder do(a) LOCADOR(A).`),
      p(`13.3 — A imobiliária e administradora do imóvel são meramente intermediadoras da relação locatícia, não havendo por parte destas nenhumas retenções de valores e, portanto, não tem responsabilidade sob os atos praticados pelo(a) LOCADOR(A) e ou LOCATÁRIO(A).`)
    )
  } else if (gnt === 'titulo') {
    const inst = garantia.instituicao === 'Outra' ? (garantia.outraInstituicao || '###') : (garantia.instituicao || 'Porto Seguro Capitalização S.A')
    clauses.push(
      p(`Para garantir as obrigações assumidas neste contrato, o(a) LOCATÁRIO(A) dá em Caução ao(à) LOCADOR(A), o(s) Título(s) de Capitalização no valor nominal de R$ ${garantia.valor || '###'} subscrito(s) pela ${inst}, representado pela proposta/formulário nº ${garantia.numero || '###'}.`),
      p(`13.1 — Ao término do prazo de vigência do(s) Título(s), o(a) LOCATÁRIO(A) autoriza a reaplicação do valor de resgate, permanecendo como caução até a efetiva desocupação do imóvel e entrega das chaves.`),
      p(`13.2 — Se o(a) LOCATÁRIO(A) não observar quaisquer das cláusulas do presente contrato, fica o(a) LOCADOR(A) autorizado(a) a resgatar o(s) Título(s) caucionado(s), a qualquer momento, mesmo antes do prazo final, a fim de quitar eventuais débitos.`),
      p(`13.3 — A imobiliária e administradora do imóvel são meramente intermediadoras, não tendo responsabilidade sobre a liquidação ou resgate do título junto à seguradora.`)
    )
  } else if (gnt === 'seguro') {
    clauses.push(
      p(`O seguro de Fiança Locatícia contratado pelo(a) LOCATÁRIO(A) junto à seguradora ${garantia.seguradora || 'TOKIO MARINE'}, garantirá esta locação, nos termos do inciso III, do artigo 37 da Lei do Inquilinato.`),
      p(`13.1 — Os prêmios iniciais e renovações serão pagos pelo(a) LOCATÁRIO(A), de acordo com o inciso XI do artigo 23 da Lei do Inquilinato, sob pena de rescisão desta locação.`),
      p(`13.2 — Eventuais débitos decorrentes do presente contrato, não pagos pelo(a) LOCATÁRIO(A) após regularmente instado(a) a tanto, serão comunicados às entidades mantenedoras de bancos de dados de proteção ao crédito (Serasa, SPC, etc.), quer pelo(a) LOCADOR(A), quer pela Seguradora.`),
      p(`13.3 — O(A) LOCATÁRIO(A) declara estar ciente de que, não devolvendo o imóvel pintado internamente, a Seguradora indenizará o(a) LOCADOR(A) pelo ônus da pintura, e terá direito de reaver o valor que tiver sido pago.`)
    )
  } else if (gnt === 'imovel-cau') {
    const caucionantes: any[] = garantia.caucionantes || []
    const cqual = caucionantes.map((c: any) =>
      [c.nome, c.rg ? `RG nº ${c.rg}` : '', c.cpf ? `CPF nº ${c.cpf}` : ''].filter(Boolean).join(', ')
    )
    clauses.push(
      p(`As partes têm entre si ajustada a caução do bem imóvel descrito na matrícula nº ${garantia.matricula || '###'} do ${garantia.cartorio || '###'}.`),
      p(`13.1 — Os(As) CAUCIONANTE(S) — ${cqual.join('; e, ') || '###'} — oferecem ao(à) LOCADOR(A), que desde já aceita como garantia real de suas obrigações solidárias, o imóvel objeto da matrícula supra, AUTORIZANDO EXPRESSAMENTE O REGISTRO DE GRAVAME EM SEUS ASSENTAMENTOS, na modalidade de caução locatícia complementar e extraordinária, nos termos do art. 38 §1º da Lei 8.245/91.`),
      p(`13.2 — A caução imobiliária ora prestada permanecerá válida e efetiva até a data em que o(a) LOCADOR(A) passar recibo das chaves, dando quitação plena ao(à) LOCATÁRIO(A), mesmo que isso venha a ocorrer após o término do prazo de locação.`),
      p(`13.3 — A averbação da caução e seu cancelamento, após a quitação de todas as obrigações contratuais, são de responsabilidade e custo do(a) LOCATÁRIO(A).`)
    )
  }

  return clauses
}

function anexoI(data: any): Paragraph[] {
  const { locatarios } = data
  const ltNomes = locatarios.map((l: any) => l.nome || '###').join('; e, ')
  return [
    new Paragraph({
      pageBreakBefore: true,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: 'ANEXO I', font: 'Arial', size: 22, bold: true })],
    }),
    heading('PROTEÇÃO DE DADOS PESSOAIS'),
    p(`Para os fins deste contrato, são considerados, conforme a LGPD – Lei Geral de Proteção de Dados Pessoais (Lei 13.709/18):`),
    p(`DADOS PESSOAIS | qualquer dado ou informação relativa a uma pessoa natural identificada ou identificável (TITULAR ou TITULAR DOS DADOS);`),
    p(`CONTROLADOR | agente de tratamento, parte que determina as finalidades e os meios de tratamento de dados pessoais. No caso do presente contrato, o CONTROLADOR é o LOCADOR e a Administradora da Locação;`),
    p(`TITULAR | é o dono dos dados pessoais, LOCATÁRIO ou representante legal da empresa LOCATÁRIA;`),
    p(`TRATAMENTO | toda e qualquer operação ou conjunto de operações efetuadas sobre dados pessoais, tais como a coleta, o registro, a organização, a estruturação, a conservação, a adaptação ou alteração, a recuperação, a consulta, a utilização, a divulgação por transmissão, difusão ou qualquer outra forma de disponibilização, a comparação ou interconexão, a limitação, a eliminação ou a destruição (LGPD, art. 5º, X);`),
    p(`2. Em decorrência do presente contrato, o(a) LOCADOR(A) tratará os dados envolvidos para a consecução do presente contrato, os eventuais dados de titulares do(a) LOCATÁRIO(A) serão tratados pelo(a) LOCADOR(A) com a finalidade de locação de imóveis e sua administração, por relação contratual, nos limites legais.`),
    p(`3. Ao final do presente contrato, o(a) LOCADOR(A) eliminará todos os dados pessoais recebidos do(a) LOCATÁRIO(A) para a realização do presente contrato, exceto os que se fizerem necessários para cumprimento de deveres legais, bem como, exercício regular de direito.`),
    p(`4. O(A) LOCADOR(A) somente realizará os tratamentos de dados pessoais, sempre nos limites expressamente autorizados pela lei e pelo titular de dados pessoais que é o(a) LOCATÁRIO(A), nos limites do objeto do contrato.`),
    p(`5. AS PARTES declaram, por este instrumento, que cumprem toda a legislação aplicável sobre privacidade e proteção de dados pessoais, inclusive a Constituição Federal, o Código de Defesa do Consumidor, o Código Civil, o Marco Civil da Internet e a Lei Geral de Proteção de Dados Pessoais (Lei 13.709/18).`),
    p(`6. O(A) LOCADOR(A) se compromete a tratar os dados pessoais que possam estar relacionados ao objeto do presente contrato somente nos estritos limites aqui previstos, não devendo praticar qualquer tipo de ato que envolva os dados pessoais transmitidos sem a prévia e expressa autorização do(a) LOCATÁRIO(A).`),
    p(`7. Durante o armazenamento de dados pessoais os agentes de tratamento respeitarão os padrões de segurança, como controle estrito sobre o acesso, mecanismos de autenticação e inventário de acesso aos registros.`),
    p(`8. Os agentes de tratamento deverão manter sigilo em relação os dados pessoais tratados em virtude deste contrato, assegurando confidencialidade.`),
    p(`9. Os agentes de tratamento atenderão os direitos dos TITULARES DE DADOS Pessoais (confirmação, acesso, correção, anonimização, bloqueio, eliminação, portabilidade, revogação do consentimento, etc.), conforme os artigos 17 a 22 da LGPD.`),
  ]
}

function signatureTable(signatarios: Array<{ nome: string; role: string }>): Table {
  const pairs: Array<[any, any]> = []
  for (let i = 0; i < signatarios.length; i += 2) {
    pairs.push([signatarios[i], signatarios[i + 1] || null])
  }

  const border = { style: BorderStyle.NONE }
  const borders = { top: border, bottom: border, left: border, right: border }

  const makeCell = (sig: { nome: string; role: string } | null) => new TableCell({
    borders,
    width: { size: 4500, type: WidthType.DXA },
    margins: { top: 200, bottom: 100, left: 200, right: 200 },
    children: sig ? [
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
    ] : [new Paragraph({ children: [new TextRun('')] })],
  })

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4500, 360, 4500],
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: pairs.map(([a, b]) => new TableRow({
      children: [
        makeCell(a),
        new TableCell({ borders, width: { size: 360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun('')] })] }),
        makeCell(b),
      ],
    })),
  })
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await request.json()
  const { locadores, locatarios, fiadores = [], imovel, valor, garantia, gnt, comissao, clausulas, testemunhas, admJaime } = data

  const hoje = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  const bkStr = `Banco ${valor.banco} – Agência ${valor.agencia} – C/C ${valor.conta} – PIX (${valor.pixTipo}): ${valor.pix}`

  // ── Comissão paragraphs ──
  const comLinhas = [
    `${comissao.pctJaime}% equivalente a R$ ${comissao.valorJaime}, para a imobiliária JAIMERX IMOBILIÁRIA LTDA, CNPJ 63.271.809/0001-78, CRECI/SP nº 51586-J – Banco: Itaú (341) – Agência: 0186 – C/C: 98808-5, Chave PIX (CNPJ): 63.271.809/0001-78;`,
    ...(comissao.corretores || []).map((c: any) =>
      `${c.pct}% equivalente a R$ ${c.valor}, para o(a) corretor(a) ${c.nome}, CPF nº ${c.cpf}${c.creci ? `, CRECI/SP nº ${c.creci}` : ''} – Banco ${c.banco} – Agência: ${c.agencia} – Conta Corrente: ${c.conta}${c.pix ? `, Chave PIX: ${c.pix}` : ''}.`
    ),
  ]

  // ── Signatários ──
  const signatarios: Array<{ nome: string; role: string }> = [
    ...locadores.map((l: any) => ({ nome: l.nome || 'LOCADOR', role: 'LOCADOR(A)' })),
    ...locatarios.map((l: any) => ({ nome: l.nome || 'LOCATÁRIO', role: 'LOCATÁRIO(A)' })),
    ...(gnt === 'fiador' ? fiadores.flatMap((f: any) => {
      const sigs = [{ nome: f.nome || 'FIADOR', role: 'FIADOR(A)' }]
      if (f.conjuge?.nome) sigs.push({ nome: f.conjuge.nome, role: 'CÔNJUGE / OUTORGANTE' })
      return sigs
    }) : []),
    ...(gnt === 'imovel-cau' ? (garantia?.caucionantes || []).map((c: any) => ({
      nome: c.nome || 'CAUCIONANTE', role: 'CAUCIONANTE'
    })) : []),
    ...testemunhas.map((t: any, i: number) => ({ nome: t.nome || `TESTEMUNHA ${i + 1}`, role: 'TESTEMUNHA' })),
    { nome: 'JAIMERX IMOBILIÁRIA LTDA', role: 'CNPJ 63.271.809/0001-78 · Intermediadora' },
  ]
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22 } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'JAIMERX IMOBILIÁRIA LTDA · CNPJ 63.271.809/0001-78 · CRECI/SP 51586-J', font: 'Arial', size: 16, color: '888888' })],
          })],
        }),
      },
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 160 },
          children: [new TextRun({ text: 'CONTRATO DE LOCAÇÃO', font: 'Arial', size: 28, bold: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: `Intermediação: JAIMERX IMOBILIÁRIA LTDA · CNPJ 63.271.809/0001-78 · CRECI/SP nº 51586-J${admJaime ? ' | Administração: JAIME ADMINISTRAÇÃO DE BENS E CONDOMÍNIOS LTDA · CNPJ 65.082.380/0001-04' : ''}`, font: 'Arial', size: 18, color: '666666' })],
        }),
        new Paragraph({ spacing: { before: 120, after: 120 }, children: [new TextRun('')] }),

        // Quadro Resumo
        quadroResumo({ locadores, locatarios, fiadores, imovel, garantia, valor, gnt }),

        new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun('')] }),

        // Main Text Start
        heading('CONTRATO DE LOCAÇÃO'),
        p(`Os signatários devidamente qualificados nos itens I e II do quadro resumo contido neste instrumento têm entre si justo e contratado a locação do imóvel constante no item III do quadro resumo, conforme cláusulas abaixo.`),
        p(`CONSIDERANDO que as PARTES, ou são os titulares de dados pessoais ou são empresas, obrigadas a cumprir as exigências da Lei 13.709/18 – Lei Geral de Proteção de Dados Pessoais – LGPD, como agentes de tratamento de Dados Pessoais, especialmente pelos princípios institucionais que contemplam a privacidade de dados pessoais como um de seus valores, para tanto trazem no presente contrato a expressa atenção ao princípio da boa-fé objetiva, atendem a privacidade como padrão e agem com transparência quanto às finalidades do tratamento dos dados pessoais.`),

        heading('Cláusula 1ª — Do Prazo da Locação'),
        p(`O prazo da locação é o estipulado no item VI do quadro resumo, onde, ao término do presente contrato o(a) LOCATÁRIO(A) se obriga a restituir as chaves do aludido imóvel ao(à) LOCADOR(A), ou a seu procurador ou ainda a seu representante legal, no estado em que o recebeu, independentemente de Notificação ou Interpelação Judicial, deixando-o livre, vago e desembaraçado de pessoas e coisas.`),
        p(`1.1 — O(A) LOCADOR(A) declara expressamente ser o(a) legítimo(a) proprietário(a) do imóvel objeto do presente instrumento, assumindo a responsabilidade civil e criminal por esta declaração, isentando a imobiliária intermediadora de toda e qualquer responsabilidade.`),
        p(`1.2 — Caso o(a) LOCATÁRIO(A) não restitua o imóvel no fim do prazo contratual, pagará enquanto estiver na posse do mesmo, o aluguel mensal reajustado nos termos da Cláusula Segunda, até a efetiva desocupação.`),
        ...(valor.carencia && valor.carenciaPrazo ? [
          p(`1.3 — Fica pactuado um período de carência de ${valor.carenciaPrazo} meses a contar do início da locação${valor.carenciaMotivo ? `, destinado a: ${valor.carenciaMotivo}` : ''}, durante o qual fica isento o pagamento do aluguel mensal.`),
        ] : []),

        heading('Cláusula 2ª — Do Pagamento'),
        p(`O(A) LOCATÁRIO(A) se compromete a pagar, pontualmente até a data do vencimento especificada no item VIII do quadro resumo, o valor do aluguel mencionado no item VII, por meio de boleto bancário emitido pela administradora ou depósito na conta: ${bkStr}.`),
        p(`2.1 — O valor do aluguel mensal será reajustado a cada 12 meses, mediante aplicação da variação positiva do índice ${valor.indice || 'IGP-M da FGV'}. Caso este seja negativo, o contrato permanecerá com o valor atual ou será aplicado o IPCA, conforme legislação vigente.`),
        p(`2.2 — Na hipótese do índice acima eleito vier a ser extinto, suprimido ou congelado, as PARTES convencionam que os reajustes serão calculados pelo IPC (FIPE) ou pelo índice legalmente determinado para reajuste das locações.`),
        p(`2.3 — Se em virtude de Lei subsequente vier a ser admitida a correção em periodicidade inferior, concordam as PARTES que o reajuste será feito no menor prazo permitido, independente de aviso prévio.`),
        
        heading('Cláusula 3ª — Da Comissão e Intermediação'),
        p(`Tendo em vista a intermediação realizada pela JAIMERX IMOBILIÁRIA LTDA, CNPJ 63.271.809/0001-78, o(a) LOCADOR(A) desde já reconhece e autoriza o(a) LOCATÁRIO(A) a pagar o valor correspondente ao primeiro aluguel integral, no valor de R$ ${valor.aluguel}, no vencimento de ${formatDate(comissao.vencimento)}, conforme as proporções descritas abaixo:`),
        p(comLinhas.join('\n')),
        p(`3.1 — A falta de pagamento dos aluguéis e encargos acarretará ao(à) LOCATÁRIO(A) a multa moratória de ${valor.multa || '10% (dez por cento)'} sobre o valor devido e, se o atraso for superior a 30 dias, juros de mora de 1% ao mês e atualização monetária.`),

        heading('Cláusula 4ª — Da Finalidade da Locação'),
        p(`O imóvel destina-se exclusivamente para o fim descrito no item V do quadro resumo, o que não ocorrendo ficará configurado como infração contratual, operando-se automaticamente a rescisão.`),
        p(`4.1 — O(A) LOCATÁRIO(A) declara ter conhecimento da Convenção e Regulamento Interno do Condomínio, obrigando-se a respeitá-lo e responder por eventuais multas impostas.`),

        ...(clausulas.moradores?.trim() ? [
          heading('Cláusula 5ª — Dos Moradores'),
          p(`Além do(a) LOCATÁRIO(A), residirão no imóvel: ${clausulas.moradores.trim()}. Qualquer alteração deverá ser comunicada por escrito no prazo de 30 dias.`),
        ] : []),

        heading('Cláusula 6ª — Do Imóvel, Conservação, Manutenção e Vistorias'),
        p(`O(A) LOCATÁRIO(A) declara receber o imóvel no estado de conservação conforme vistoria, obrigando-se a mantê-lo em perfeito estado de higiene e limpeza, restituindo-o pintado na cor original.`),
        p(`6.1 — Efetuar todas as obras e reparos necessários (exceto estruturais), trazendo em perfeito estado as instalações elétricas, hidráulicas, sanitários e acessórios em geral.`),
        p(`6.2 — Não ceder, sublocar ou emprestar o imóvel sem prévia autorização escrita do(a) LOCADOR(A).`),
        ...((imovel.consEnergia || imovel.consGas || imovel.consAgua) ? [
          p(`6.3 — Códigos de consumo: Energia: ${imovel.consEnergia || '—'} | Gás: ${imovel.consGas || '—'} | Água: ${imovel.consAgua || '—'}.`),
        ] : []),

        heading('Cláusula 7ª — Dos Encargos e Obrigações'),
        p(clausulas.iptuLocador
          ? `O IPTU e taxas condominiais ordinárias serão pagos pelo(a) LOCADOR(A), permanecendo a obrigação do(a) LOCATÁRIO(A) quanto às despesas de luz, gás, água e demais encargos.`
          : `Todos os impostos (IPTU), taxas condominiais, despesas de luz, gás, água e demais encargos serão de responsabilidade integral do(a) LOCATÁRIO(A).`
        ),
        p(`7.1 — O(A) LOCATÁRIO(A) obriga-se a transferir as contas de consumo para seu nome no prazo de 30 dias após o início da locação.`),
        p(`7.2 — O(A) LOCADOR(A) efetuará um seguro do imóvel contra riscos de incêndio, cujo pagamento deverá ser efetuado pelo(a) LOCATÁRIO(A).`),

        heading('Cláusula 8ª — Modificações e Reformas'),
        p(`O(A) LOCATÁRIO(A) não poderá fazer modificações ou transformações que alterem a estrutura do imóvel sem consentimento prévio por escrito do(a) LOCADOR(A).`),
        p(`8.1 — Toda e qualquer benfeitoria feita no imóvel ficará incorporada ao mesmo, sem direito à indenização ou retenção.`),

        heading('Cláusula 9ª — Do Direito de Preferência'),
        p(`O(A) LOCADOR(A) deverá notificar o(a) LOCATÁRIO(A) para que este possa exercer seu direito de preferência na aquisição do imóvel, no prazo de 30 dias.`),

        heading('Cláusula 10ª — Das Comunicações'),
        p(`O(A) LOCATÁRIO(A) obriga-se a fazer chegar às mãos do(a) LOCADOR(A) os avisos e comunicações oficiais ou não, que digam respeito à coisa locada, sob pena de responder pelos prejuízos e danos que causar sua desídia, independentemente de qualquer outra compensação que neste se estipula, para fins gerais ou especiais.`),

        heading('Cláusula 11ª — Da Desapropriação, do Abandono e da Desocupação'),
        p(`Em caso de desapropriação, parcial ou total, do imóvel, a locação será considerada rescindida, não cabendo ao(à) LOCADOR(A), ressarcir os prejuízos daí decorrentes ou que porventura venham a ser alegados.`),
        p(`11.1 — Na hipótese do(a) LOCATÁRIO(A) abandonar o imóvel, fica o(a) LOCADOR(A) autorizado(a) a se imitir na posse imediatamente sem aviso prévio, a fim de evitar a depredação ou invasão do mesmo.`),
        p(`11.2 — O termo de entrega das chaves será substituído por uma Declaração De Imissão De Posse, firmado pelo(a) LOCADOR(A) e 02 (duas) testemunhas idôneas, sem que o(a) LOCATÁRIO(A) possa reclamar qualquer tipo de indenização.`),
        p(`11.3 — Na vigência da locação, ou após o vencimento do Contrato de Locação e prorrogado por prazo indeterminado, o(a) LOCATÁRIO(A) deverá, em qualquer destas hipóteses, comunicar por escrito o(a) LOCADOR(A), ou representante legal, com mínimo de 30 dias de antecedência a sua intenção de desocupar e entregar as chaves do imóvel.`),
        p(`11.4 — Em caso de danos ao imóvel, não haverá ônus de produção de prova pericial às PARTES, valendo o conjunto de fotos, vistorias, orçamentos de 3 empresas idôneas e demonstrativo de pagamento de conserto como prova suficiente à indenização, que poderá ser inclusive objeto de execução de título extrajudicial.`),
        p(`11.5 — Durante o prazo necessário ao conserto dos danos, ainda que o imóvel já tenha sido entregue pelo(a) LOCATÁRIO(A), permanecerá o mesmo obrigado ao pagamento dos aluguéis e encargos no período.`),

        ...(clausulas.isencaoMeses ? [
          heading('Cláusula 12ª — Isenção de Multa Rescisória'),
          p(`As PARTES concordam que, após ${clausulas.isencaoMeses} meses de locação, o(a) LOCATÁRIO(A) poderá desocupar o imóvel isento da multa rescisória, com aviso prévio de ${clausulas.isencaoAviso || 30} dias.`),
        ] : []),

        // Garantia (Clause 13 in this version)
        ...garantiaClause(gnt, garantia, fiadores).map(par => {
          // Adjust heading for Garantia
          if (par.root[1]?.children?.[0]?.text === 'DA GARANTIA LOCATÍCIA') {
             return heading('Cláusula 13ª — Da Garantia Locatícia');
          }
          return par;
        }),

        heading('Cláusula 14ª — Das Multas'),
        p(`A parte que infringir qualquer cláusula pagará à outra a multa de 3 (três) vezes o valor locativo mensal, proporcionalmente ao período de cumprimento do contrato no caso de devolução antecipada.`),

        heading('Cláusula 15ª — Das Ações de Despejo'),
        p(`Se o(a) LOCATÁRIO(A) der causa ao ajuizamento de 3 ações de despejo por falta de pagamento em 24 meses, ficará caracterizado o abuso de direito, acarretando rescisão imediata.`),

        heading('Cláusula 16ª — Das Assinaturas Digitais'),
        p(`As PARTES ajustam que o contrato e aditivos poderão ser assinados digital ou eletronicamente, produzindo todos os efeitos legais nos termos da MP 2.200-2/01 e Decreto 8.539/15.`),

        heading('Cláusula 17ª — Proteção de Dados (LGPD)'),
        p(`Durante a vigência deste contrato, as PARTES observarão as disposições do Anexo I de Proteção de Dados Pessoais, assegurando o cumprimento da Lei 13.709/2018.`),

        heading('Cláusula 18ª — Obrigações das Partes'),
        p(`A eventual prorrogação tácita, expressa ou legal da locação abrangerá todas as obrigações neste constante.`),
        p(`18.1 — As PARTES convencionam que o presente contrato tem como condição essencial a observância do princípio pacta sunt servanda, visando preservar o valor real monetário do locativo, livre de medidas governamentais que impeçam a forma de correção pactuada.`),
        p(`18.2 — Em qualquer ação decorrente deste contrato, todos os atos de citação, intimação ou notificação encaminhados aos endereços das partes constantes do contrato serão tidos como válidos.`),

        heading('Cláusula 19ª — Das Normas de Segurança e Ética'),
        p(`As PARTES se obrigam a observar as disposições da legislação anticorrupção em vigor (Lei nº 12.846/2013) e se comprometem a não utilizar trabalho infantil ou irregular perante a legislação.`),

        heading('Cláusula 20ª — Disposições Gerais'),
        p(`O presente contrato é celebrado com fundamento no princípio da boa-fé objetiva (Art. 422 CC), regendo-se pela Lei 8.245/91 e Código Civil.`),

        heading('Cláusula 21ª — Do Foro'),
        p(`Fica eleito o Foro Central da Capital de São Paulo para dirimir dúvidas, com renúncia a qualquer outro. As partes poderão utilizar-se de juízo arbitral conforme Lei 9.307/96.`),

        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 400, after: 400 },
          children: [new TextRun({ text: `São Paulo, ${hoje}`, font: 'Arial', size: 22 })],
        }),

        // Signatures
        heading('ASSINATURAS'),
        signatureTable(signatarios),

        // Anexo I
        ...anexoI({ locatarios }),
      ],
    }],
  })

  const buffer = await Packer.toBuffer(doc)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Contrato-Locacao-Jaime.docx"`,
    },
  })
}
