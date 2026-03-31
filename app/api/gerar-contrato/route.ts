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
    imovel.complemento?.toUpperCase(),
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
      return `SEGURO FIANÇA – ${garantia.seguradora}, Apólice nº ${garantia.apolice}${garantia.pac ? `, PAC: ${garantia.pac}` : ''}`
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
      p(`12.1 — O(s) FIADOR(ES) renuncia(m) expressamente ao direito de exoneração previsto nos artigos 835, 836, 837, 838 e seguintes do Código Civil Brasileiro (Lei 10.406/02), bem como, ao benefício de ordem previsto no artigo 827 e seguintes do mesmo diploma legal.`),
      p(`12.2 — A garantia ora prestada pelo(s) FIADOR(ES) permanecerá válida e efetiva até a data em que o(a) LOCADOR(A), ou seu procurador(a) ou ainda seu representante legal, passar recibo das chaves, dando quitação plena ao(à) LOCATÁRIO(A), mesmo que isso venha a ocorrer após o término do prazo de locação.`)
    )
  } else if (gnt === 'caucao') {
    clauses.push(
      p(`A garantia ora prestada pelo(a) LOCATÁRIO(A) é o valor constante no item IV do quadro resumo, para cobertura de aluguéis, encargos e/ou danos ao imóvel, depositado em conta corrente do(a) LOCADOR(A) e permanecerá válida e efetiva até a data em que o(a) LOCADOR(A) passar recibo das chaves, dando quitação plena ao(à) LOCATÁRIO(A), mesmo que isso venha a ocorrer após o término do prazo de locação.`),
      p(`12.1 — A Lei do Inquilinato estabelece que o índice de correção da caução locatícia deve observar a caderneta de poupança; no entanto, as partes — por mera liberalidade — estabelecem que os valores da caução serão aplicados a 100% (cem por cento) do CDI.`)
    )
  } else if (gnt === 'titulo') {
    const inst = garantia.instituicao === 'Outra' ? (garantia.outraInstituicao || '###') : (garantia.instituicao || 'Porto Seguro Capitalização S.A')
    clauses.push(
      p(`Para garantir as obrigações assumidas neste contrato, o(a) LOCATÁRIO(A), por ser de seu interesse, dá neste ato, em Caução ao(à) LOCADOR(A), o(s) Título(s) de Capitalização no valor nominal de R$ ${garantia.valor || '###'} subscrito(s) pela ${inst}, representado pela proposta/formulário nº ${garantia.numero || '###'}.`),
      p(`12.1 — Ao término do prazo de vigência do(s) Título(s), o(a) LOCATÁRIO(A) autoriza a ${inst} a reaplicar o valor de resgate, sempre em seu nome, dando origem a um novo Título com as mesmas Condições Gerais do Título inicialmente adquirido, sendo que este permanecerá como caução à locação até a efetiva desocupação do imóvel e entrega das chaves.`),
      p(`12.2 — O(A) LOCATÁRIO(A) se responsabiliza em comunicar qualquer alteração cadastral ou então se manifestar contrariamente à reaplicação do título, com no mínimo 15 (quinze) dias de antecedência da data do vencimento do título.`),
      p(`12.3 — Se o(a) LOCATÁRIO(A) não observar quaisquer das cláusulas do presente contrato, fica, desde já, o(a) LOCADOR(A) autorizado(a) a resgatar o(s) Título(s) caucionado(s), a qualquer momento, mesmo antes do prazo final de capitalização, a fim de quitar eventual importância devida em razão de débitos oriundos deste contrato.`)
    )
  } else if (gnt === 'seguro') {
    clauses.push(
      p(`A garantia da presente locação é o SEGURO FIANÇA junto à seguradora ${garantia.seguradora || '###'}, Apólice nº ${garantia.apolice || '###'}${garantia.pac ? `, PAC: ${garantia.pac}` : ''}, com vigência até ${garantia.vigencia ? formatDate(garantia.vigencia) : '###'}.`),
      p(`12.1 — Os prêmios iniciais e renovações, calculados conforme normas vigentes, serão pagos pelo(a) LOCATÁRIO(A), de acordo com o inciso XI do artigo 23 da Lei do Inquilinato, sob pena de rescisão desta locação, com o consequente despejo e cancelamento da apólice.`),
      p(`12.2 — Eventuais débitos decorrentes do presente contrato, não pagos pelo(a) LOCATÁRIO(A) após regularmente instado(a) a tanto, serão comunicados às entidades mantenedoras de bancos de dados de proteção ao crédito (Serasa, SPC, etc.), quer pelo(a) LOCADOR(A), quer pela Seguradora.`)
    )
  } else if (gnt === 'imovel-cau') {
    const caucionantes: any[] = garantia.caucionantes || []
    const cqual = caucionantes.map((c: any) =>
      [c.nome, c.rg ? `RG nº ${c.rg}` : '', c.cpf ? `CPF nº ${c.cpf}` : ''].filter(Boolean).join(', ')
    )
    clauses.push(
      p(`As partes têm entre si ajustada a caução do bem imóvel descrito na matrícula nº ${garantia.matricula || '###'} do ${garantia.cartorio || '###'}${garantia.descricao ? `, relativo a "${garantia.descricao}"` : ''}.`),
      p(`12.1 — Os(As) CAUCIONANTE(S) — ${cqual.join('; e, ') || '###'} — oferecem ao(à) LOCADOR(A), que desde já aceita como garantia real de suas obrigações solidárias, o imóvel objeto da matrícula supra, AUTORIZANDO EXPRESSAMENTE O REGISTRO DE GRAVAME EM SEUS ASSENTAMENTOS, na modalidade de caução locatícia complementar e extraordinária, em virtude do valor considerável do aluguel, nos termos do art. 38 §1º da Lei 8.245/91.`),
      p(`12.2 — A caução imobiliária ora prestada permanecerá válida e efetiva até a data em que o(a) LOCADOR(A) passar recibo das chaves, dando quitação plena ao(à) LOCATÁRIO(A), mesmo que isso venha a ocorrer após o término do prazo de locação.`),
      p(`12.3 — A averbação da caução e seu cancelamento, após a quitação de todas as obrigações contratuais, são de responsabilidade e custo do(a) LOCATÁRIO(A), devendo ser providenciados no prazo de 30 (trinta) dias após a entrega das chaves.`)
    )
  }

  return clauses
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

  // ── Document ──
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

        // Intro
        p(`Os signatários devidamente qualificados nos itens I${gnt === 'fiador' ? ', II e III' : ' e II'} do quadro resumo contido neste instrumento têm entre si justo e contratado a locação do imóvel constante no item III do quadro resumo, conforme cláusulas abaixo.`),
        p(`CONSIDERANDO que as PARTES, ou são os titulares de dados pessoais ou são empresas, obrigadas a cumprir as exigências da Lei 13.709/18 – Lei Geral de Proteção de Dados Pessoais – LGPD, como agentes de tratamento de Dados Pessoais, especialmente pelos princípios institucionais contemplam a privacidade de dados pessoais como um de seus valores, para tanto traz no presente contrato a expressa atenção ao princípio da boa-fé objetiva.`),

        heading('Do Prazo da Locação'),
        p(`O prazo da locação é o estipulado no item VI do quadro resumo, onde, ao término do presente contrato o(a) LOCATÁRIO(A) se obriga a restituir as chaves do aludido imóvel ao(à) LOCADOR(A), ou a seu procurador ou ainda a seu representante legal, no estado em que o recebeu, independentemente de Notificação ou Interpelação Judicial, deixando-o livre, vago e desembaraçado de pessoas e coisas.`),
        p(`O(A) LOCADOR(A) declara expressamente ser o(a) legítimo(a) proprietário(a) do imóvel objeto do presente instrumento, assumindo a responsabilidade civil e criminal por esta declaração, isentando a empresa intermediadora de toda e qualquer responsabilidade.`),

        heading('Do Pagamento'),
        p(`O(A) LOCATÁRIO(A) se compromete a pagar, pontualmente até a data do vencimento especificada no item VIII do quadro resumo de cada mês subsequente ao vencido, o valor do aluguel mencionado no item VII do quadro resumo, na conta bancária indicada: ${bkStr}.`),
        p(`Tendo em vista a intermediação realizada pela JAIMERX IMOBILIÁRIA LTDA, CNPJ 63.271.809/0001-78, o(a) LOCADOR(A) desde já reconhece e autoriza o(a) LOCATÁRIO(A) a pagar o valor correspondente ao primeiro aluguel integral, no valor de R$ ${valor.aluguel}, no vencimento de ${formatDate(comissao.vencimento)}, observando as proporções descritas abaixo:`),
        p(comLinhas.join('\n')),
        p(`A falta de pagamento dos aluguéis e encargos dentro do prazo avençado acarretará ao(à) LOCATÁRIO(A) a multa moratória de ${valor.multa || '10% (dez por cento)'} sobre o valor devido e, se o atraso for superior a 30 (trinta) dias, acrescer-se-á de atualização monetária e juros de mora de 1% (um por cento) ao mês.`),

        heading('Do Reajuste do Aluguel'),
        p(`O valor do aluguel mensal será reajustado ${valor.reajuste || 'a cada 12 meses'}, mediante aplicação da variação positiva do índice ${valor.indice || 'IGP-M da FGV'}. Caso este seja negativo, o contrato permanecerá com o valor atual. Na hipótese do índice acima eleito vier a ser extinto, suprimido, substituído, congelado ou por qualquer forma deixar de refletir a inflação, as PARTES convencionam que os reajustes serão calculados pelo IPC (FIPE) ou pelo índice legalmente determinado.`),

        heading('Da Finalidade da Locação'),
        p(`O imóvel, objeto deste contrato, destina-se exclusivamente para o fim descrito no item V do quadro resumo do(a) LOCATÁRIO(A), o que não ocorrendo ficará configurado como infração contratual, operando-se automaticamente a rescisão do presente contrato.`),

        heading('Do Imóvel, Conservação, Manutenção e Vistorias'),
        p(`O(A) LOCATÁRIO(A) declara receber o imóvel no estado de conservação conforme vistoria em anexo, obrigando-se a: (a) manter o imóvel no mais perfeito estado de higiene, conservação e limpeza, restituindo-o pintado na cor original, limpo e livre de pessoas e coisas; (b) efetuar todas as obras e reparos necessários, excetuados os estruturais; (c) não ceder, sublocar ou emprestar o imóvel sem prévia autorização escrita do(a) LOCADOR(A); (d) atender às exigências dos Poderes Públicos; (e) transferir as ligações de energia elétrica, água e gás para seu nome no prazo de 30 (trinta) dias.`),
        ...((imovel.consEnergia || imovel.consGas || imovel.consAgua) ? [
          p(`5.1 — Códigos das contas de consumo do imóvel:${imovel.consEnergia ? ` Energia elétrica: ${imovel.consEnergia}.` : ''}${imovel.consGas ? ` Gás: ${imovel.consGas}.` : ''}${imovel.consAgua ? ` Água: ${imovel.consAgua}.` : ''}`),
        ] : []),

        heading('Dos Encargos e Obrigações em Relação ao Imóvel'),
        p(clausulas.iptuLocador
          ? `De mútuo e comum acordo, as PARTES convencionam que o IPTU (Imposto Predial e Territorial Urbano) e as taxas condominiais ordinárias serão pagos pelo(a) LOCADOR(A) durante a vigência deste contrato, permanecendo a obrigação do(a) LOCATÁRIO(A) quanto às despesas de luz, gás, água, tarifas bancárias e demais encargos incidentes sobre o imóvel.`
          : `De mútuo e comum acordo, as PARTES convencionam que todos os impostos, especialmente o IPTU (Imposto Predial e Territorial Urbano), taxas condominiais ordinárias, despesas de luz, gás, água, tarifas bancárias e demais encargos incidentes sobre o imóvel serão de responsabilidade integral do(a) LOCATÁRIO(A), devendo efetuar o pagamento até a respectiva data de vencimento.`
        ),
        p(`O(A) LOCADOR(A) efetuará um seguro do imóvel contra riscos de incêndio, cujo pagamento deverá ser efetuado pelo(a) LOCATÁRIO(A), com seguradora de livre escolha do(a) LOCADOR(A), com base no valor real do imóvel.`),

        // Garantia clause (dynamic)
        ...garantiaClause(gnt, garantia, fiadores),

        // Cláusulas especiais
        ...(clausulas.isencaoMeses ? [
          heading('Da Isenção de Multa por Desocupação Antecipada'),
          p(`As PARTES concordam antecipadamente que, após o período locatício de ${clausulas.isencaoMeses} (${clausulas.isencaoMeses}) meses o(a) LOCATÁRIO(A) poderá desocupar o imóvel isento da multa rescisória, bastando para tanto notificar o(a) LOCADOR(A) com ${clausulas.isencaoAviso || 30} (${clausulas.isencaoAviso || 'trinta'}) dias de antecedência, por escrito.`),
        ] : []),

        ...(clausulas.abono ? [
          heading('Do Abono para Obras'),
          p(`Fica pactuado que o(a) LOCADOR(A) concederá um abono no valor total de R$ ${clausulas.abono.valor} em benefício do(a) LOCATÁRIO(A), aplicados a partir do ${clausulas.abono.mes}º mês de locação, para que este(a) efetue ${clausulas.abono.obs || 'obras de adequação do imóvel'}.`),
        ] : []),

        ...(clausulas.livre ? [
          heading('Disposições Especiais'),
          p(clausulas.livre),
        ] : []),

        heading('Das Multas'),
        p(`A parte que infringir qualquer das cláusulas deste contrato, pagará a outra a multa de 3 (três) vezes o valor locativo mensal devido à época em que se verificar a infração, com a faculdade, para a parte inocente, de exigir o cumprimento do contrato ou de considerá-lo rescindido.`),
        p(`Durante o prazo estipulado para a duração do contrato, não poderá o(a) LOCADOR(A) reaver o imóvel alugado. O(A) LOCATÁRIO(A), todavia, poderá devolvê-lo, pagando a multa acima pactuada, proporcionalmente ao período de cumprimento do contrato.`),

        heading('Do Direito de Preferência'),
        p(`O(A) LOCADOR(A) deverá notificar o(a) LOCATÁRIO(A) para que este possa exercer seu direito de preferência na aquisição do imóvel, nas mesmas condições em que for oferecido a terceiros, no prazo de 30 (trinta) dias.`),
        ...(admJaime ? [p(`Fica pactuado que, exercido o direito de preferência pelo(a) LOCATÁRIO(A), o(a) LOCADOR(A) pagará a título de comissão de 6% (seis por cento) sobre o valor da venda que se concretizar à JAIME ADMINISTRAÇÃO DE BENS E CONDOMÍNIOS LTDA., inscrita no CNPJ sob o número 65.082.380/0001-04, pela intermediação.`)] : []),

        heading('Das Assinaturas Digitais e Eletrônicas'),
        p(`As PARTES ajustam que o Contrato, anexos e os documentos correlatos, bem como eventuais aditivos poderão ser assinados digital ou eletronicamente, produzindo todos os efeitos legais. Nos termos do art. 10, § 2º, da Medida Provisória nº 2.200-2, as PARTES expressamente concordam em utilizar e reconhecem como válida qualquer forma de comprovação de anuência aos termos ora acordados em formato eletrônico.`),

        heading('Da Proteção dos Dados Pessoais'),
        p(`Durante a vigência deste Contrato, as PARTES observarão as disposições do Anexo I de Proteção de Dados Pessoais, parte integrante deste instrumento, assegurando o cumprimento da LGPD (Lei nº 13.709/2018) e demais normas vigentes sobre a matéria.`),

        heading('Das Disposições Gerais'),
        p(`O presente contrato é celebrado com fundamento no princípio da boa-fé objetiva, nos termos dos artigos 113 e 422 do Código Civil, obrigando as PARTES a agir com lealdade, cooperação, transparência e probidade durante toda a vigência da relação contratual. O presente Contrato de Locação rege-se pela Lei 8.245/91, inclusive com as alterações previstas na Lei 12.112/09, e nos casos omissos pelo Código Civil Brasileiro (Lei 10.406/02).`),

        heading('Do Foro'),
        p(`Com expressa renúncia de qualquer outro, por mais especial que seja, fica eleito o Foro Central da Capital de São Paulo, para dirimir eventuais dúvidas ou controvérsias que deste instrumento possam advir, ficando por conta da parte vencida, em qualquer caso, o pagamento de honorários advocatícios, na base de 20% (vinte por cento), custas e despesas judiciais e extrajudiciais, bem como atualização monetária e juros de mora dos débitos existentes entre as PARTES. As PARTES, independente de comum acordo, poderão utilizar-se do juízo arbitral, em conformidade com a Lei 9.307/96.`),

        p(`E, por estarem assim, justos e contratados, firmam o presente contrato digital que será assinado pelas PARTES digital ou eletronicamente, assim como as 2 (duas) testemunhas para todos os fins de direito.`),

        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 400, after: 400 },
          children: [new TextRun({ text: `São Paulo, ${hoje}`, font: 'Arial', size: 22 })],
        }),

        // Signatures
        new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun({ text: 'ASSINATURAS', font: 'Arial', size: 22, bold: true })] }),
        signatureTable(signatarios),
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
