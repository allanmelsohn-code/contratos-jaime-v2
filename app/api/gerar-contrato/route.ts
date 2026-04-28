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

function garantiaClause(gnt: string, garantia: any, fiadores: any[], headingText = 'Da Garantia Locatícia'): Paragraph[] {
  const clauses: Paragraph[] = [heading(headingText)]

  if (gnt === 'fiador') {
    clauses.push(
      p(`O(s) FIADOR(ES) assinam o presente contrato como principal(is) pagador(es) solidário(s) com o(a) LOCATÁRIO(A) pelas obrigações aqui assumidas, tanto pelos aluguéis e encargos locatícios, inclusive pela multa contratual e eventuais danos causados ao imóvel locado, como também pela majoração e revisão de aluguéis decorrentes inclusive de acordos judiciais e extrajudiciais e pela exatidão das qualificações deste constantes, cuja responsabilidade subsistirá até a entrega real e efetiva das chaves do imóvel, dando quitação plena, mesmo que isso venha a ocorrer após o término do prazo da locação.`),
      p(`O(s) FIADOR(ES) renuncia(m) expressamente ao direito de exoneração previsto nos artigos 835, 836, 837, 838 e seguintes do Código Civil Brasileiro (Lei 10.406/02), bem como, ao benefício de ordem previsto no artigo 827 e seguintes do mesmo diploma legal.`),
      p(`A garantia ora prestada pelo(s) FIADOR(ES) permanecerá válida e efetiva até a data em que o(a) LOCADOR(A), ou seu procurador(a) ou ainda seu representante legal, passar recibo das chaves, dando quitação plena ao(à) LOCATÁRIO(A), mesmo que isso venha a ocorrer após o término do prazo de locação.`),
      p(`O(A) LOCATÁRIO(A) e FIADOR(ES), devidamente qualificados nos itens II e III do quadro resumo deste contrato, neste ato, e por instrumento, outorgam reciprocamente, amplos e gerais poderes para, em seu nome, receberem individualmente ou conjuntamente, intimações, notificações, mediante correspondência com aviso de recebimento, interpelações e citações judiciais ou extrajudiciais referentes a eventuais lides decorrentes da locação ora contratada.`),
      p(`Em qualquer ação decorrente deste contrato, todos os atos de citação, intimação, notificação e comunicação do processo encaminhados aos endereços das PARTES constantes do contrato serão tidos como válidos.`),
      p(`As citações ou intimações praticadas por via postal ou oficial de justiça remetidas aos endereços das PARTES, ainda que recebidas por terceiro, serão tidas como plenamente válidas.`),
      p(`Quaisquer alterações de endereço no curso do contrato deverão ser comunicadas por escrito por uma parte a outra.`),
      p(`A imobiliária e Administradora do imóvel são meramente intermediadoras da relação locatícia, não havendo por parte destas nenhumas retenções de valores e, portanto, não tem responsabilidade sob os atos praticados pelo(a) LOCADOR(A), LOCATÁRIO(A) e ou FIADOR(ES).`),
      heading('Morte, Recuperação Judicial, Falência, Insolvência e Mudanças'),
      p(`No caso de morte, recuperação judicial, falência, ou comprovada insolvência, mudança de Estado ou de País do(s) FIADOR(ES), ou em qualquer outra hipótese prevista no artigo 40, da Lei 8.245/91, com a nova redação dada pela Lei 12.112/09, o(a) LOCATÁRIO(A) obriga-se no prazo improrrogável de 30 (trinta) dias a contar do evento, a dar-lhes substitutos idôneos ou, a juízo da LOCADOR(A), oferecer uma das demais garantias estabelecidas no artigo 37, da Lei 8245/91, sob pena de incorrer na multa estipulada e ensejando a rescisão contratual em razão da infração cometida.`),
    )
  } else if (gnt === 'caucao') {
    clauses.push(
      p(`A garantia ora prestada, pelo(a) LOCATÁRIO(A) é o valor constante no item IV do quadro resumo, para cobertura de alugueis, encargos e ou danos ao imóvel e que ora passa a fazer parte integrante deste contrato, será depositado em conta corrente do(a) LOCADOR(A) e permanecerá válida e efetiva até a data em que o(a) LOCADOR(A) ou seu procurador(a) ou ainda seu representante legal, passar recibo das chaves, dando quitação plena ao(à) LOCATÁRIO(A), mesmo que isso venha a ocorrer após o término do prazo de locação. A responsabilidade de devolução da caução é exclusiva do(a) LOCADOR(A).`),
      p(`Uma vez efetuada vistoria no imóvel e respectivo recibo de entrega de chaves, portanto, não havendo por parte do(a) LOCADOR(A) nada a reclamar, fica este, obrigado(a) a proceder a imediata devolução do valor da caução, devidamente atualizado pelo índice da Caderneta de Poupança, mediante depósito em conta corrente do(a) LOCATÁRIO(A).`),
      p(`Após efetuada a vistoria, apontando eventuais danos e problemas correlacionados ao imóvel, o(a) LOCADOR(A) deverá notificar o(a) LOCATÁRIO(A) com cópia anexa da vistoria para que este no prazo de 5 (cinco) dias, inicie a correção dos danos, sob pena de não fazendo, o(a) LOCADOR(A) providenciará as suas expensas a devida correção.`),
      p(`Até a solução dos problemas apontados, e nova vistoria por expensas do(a) LOCATÁRIO(A), a caução constante no item IV do quadro resumo ficará retida em poder do(a) LOCADOR(A).`),
      p(`O(A) LOCADOR(A), após a realização dos reparos, apresentará os custos e havendo saldo credor, o(a) LOCADOR(A) deverá a depositar a diferença de imediato ao(à) LOCATÁRIO(A).`),
      p(`Caso após apuração dos reparos, o saldo da caução seja insuficiente para cobertura dos danos, o(a) LOCATÁRIO(A) deverá depositar o valor da diferença a favor do(a) LOCADOR(A) em até 5 (cinco) dias da apuração.`),
      p(`Na falta do reembolso entre as partes no prazo estipulado, o valor deverá ser acrescido de 10% (dez por cento) de multa ao credor.`),
      p(`O não pagamento pelas partes após 30 (trinta) dias da apuração, dará ensejo a parte credora para ingressar com competente ação contra a parte devedora.`),
      p(`A imobiliária e administradora do imóvel são meramente intermediadoras da relação locatícia, não havendo por parte destas nenhumas retenções de valores e, portanto, não tem responsabilidade sob os atos praticados pelo(a) LOCADOR(A) e ou LOCATÁRIO(A).`),
    )
  } else if (gnt === 'titulo') {
    const inst = garantia.instituicao === 'Outra' ? (garantia.outraInstituicao || '###') : (garantia.instituicao || 'Porto Seguro Capitalização S.A')
    clauses.push(
      p(`Para garantir as obrigações assumidas neste contrato, o(a) LOCATÁRIO(A) dá em Caução ao(à) LOCADOR(A), o(s) Título(s) de Capitalização no valor nominal de R$ ${garantia.valor || '###'} subscrito(s) pela ${inst}, representado pela proposta/formulário nº ${garantia.numero || '###'}.`),
      p(`Ao término do prazo de vigência do(s) Título(s), o(a) LOCATÁRIO(A) autoriza a reaplicação do valor de resgate, permanecendo como caução até a efetiva desocupação do imóvel e entrega das chaves.`),
      p(`Se o(a) LOCATÁRIO(A) não observar quaisquer das cláusulas do presente contrato, fica o(a) LOCADOR(A) autorizado(a) a resgatar o(s) Título(s) caucionado(s), a qualquer momento, mesmo antes do prazo final, a fim de quitar eventuais débitos.`),
      p(`A imobiliária e administradora do imóvel são meramente intermediadoras, não tendo responsabilidade sobre a liquidação ou resgate do título junto à seguradora.`),
    )
  } else if (gnt === 'seguro') {
    clauses.push(
      p(`O seguro de Fiança Locatícia contratado pelo LOCADOR junto a ${garantia.seguradora || 'TOKIO MARINE'}, garantirá esta locação, nos termos do inciso III, do artigo 37 da Lei do Inquilinato, mediante pagamento de prêmio, ressalvadas as exceções previstas nas condições gerais. São de conhecimento do LOCADOR e LOCATÁRIO(S) as Condições Gerais do seguro de Fiança Locatícia. Para efeito desta garanta, os prêmios iniciais e renovações, calculados conforme NORMAS VIGENTES, serão pagos pelo(s) Locatário(s), de acordo com o inciso XI, do artigo 23 da lei do inquilinato, sob pena de rescisão desta locação, com o consequente despejo e cancelamento da apólice. A apólice garantirá exclusivamente as coberturas especificadas na proposta de seguro. Eventuais débitos decorrentes do presente contrato, não pagos pelo(s) Locatário(s) após regularmente instados a tanto serão comunicados às entidades mantenedoras de bancos de dados de proteção ao crédito (Serasa, SPC, etc.), quer pelo Locador(a), quer pela Seguradora. Tais débitos incluem todas as despesas com as medidas judiciais cabíveis.`),
      p(`Para exercer os direitos e dar cumprimento às obrigações desse contrato, os LOCATÁRIOS declaram-se solidários entre si e constituem-se reciprocamente PROCURADORES, conferindo-se mutuamente poderes especiais para receber citações, notificações e intimações, confessar, desistir, e assinar tudo quanto se tornar necessário, transigir em Juízo ou fora dele, fazer acordos, firmar compromissos judiciais ou extrajudiciais, receber e dar quitação.`),
      p(`O locatário declara para todos os fins e efeitos de direito, que recebe o imóvel locado no estado em que se encontra de conservação e uso, identificado no Laudo de Vistoria Inicial o qual é parte integrante deste contrato, assinado por todos os contratantes, obrigando-se e comprometendo-se a devolvê-lo nesse estado, independentemente de qualquer aviso ou notificação prévia e qualquer que seja o motivo de devolução, sob pena de incorrer nas cominações previstas neste contrato ou estipuladas em lei, além da obrigação de indenizar por danos ou prejuízos decorrentes da inobservância dessa obrigação, salvo as deteriorações decorrentes do uso normal do imóvel.`),
      p(`Declara o locatário, para todos os fins e efeitos de direito, que recebe o imóvel locado com Pintura Interna NOVA, e assim obriga-se, ao final da locação, a pintá-lo e devolvê-lo no mesmo estado em que recebeu, sob pena de incorrer nas cominações previstas neste contrato ou estipuladas em lei. O locatário declara ainda estar ciente de que, não devolvendo o imóvel pintado internamente, a Seguradora indenizará o locador pelo ônus da pintura, e terá direito de reaver o valor que tiver sido pago. O Segurado deverá comunicar o Sinistro a ${garantia.seguradora || 'TOKIO MARINE'} no prazo máximo de 15 (quinze) dias a contar da desocupação do imóvel.`),
    )
  } else if (gnt === 'imovel-cau') {
    const caucionantes: any[] = garantia.caucionantes || []
    const cqual = caucionantes.map((c: any) =>
      [c.nome, c.rg ? `RG nº ${c.rg}` : '', c.cpf ? `CPF nº ${c.cpf}` : ''].filter(Boolean).join(', ')
    )
    clauses.push(
      p(`As partes já qualificadas. LOCADOR(A), LOCATÁRIO(A) e CAUCIONANTES, tem entre si, justas e acertadas, o presente contrato de locação residencial de prazo determinado com caução do bem imóvel Matrícula nº ${garantia.matricula || '###'} do ${garantia.cartorio || '###'}.`),
      p(`Os(As) CAUCIONANTE(S) — ${cqual.join('; e, ') || '###'} — oferecem ao(à) LOCADOR(A), que desde já aceita como garantia real de suas obrigações solidárias, o imóvel objeto da matrícula supra, AUTORIZANDO EXPRESSAMENTE O REGISTRO DE GRAVAME EM SEUS ASSENTAMENTOS, na modalidade de caução locatícia complementar e extraordinária, em virtude do valor considerável do aluguel.`),
      p(`Os(As) CAUCIONANTE(S), assinam este contrato oferecendo de livre e espontânea vontade sem qualquer coação, inclusive averbando a caução na matrícula do imóvel, de acordo com o art. 38, parágrafo I, da Lei 8.245/91, para garantia e fiel cumprimento de todas as cláusulas ora ajustadas. Da mesma forma, fica o imóvel caucionado, garantidor de eventual majoração de impostos, taxas, e quantias aqui estabelecidas e prevalecerá até a real e efetiva entrega das chaves do imóvel locado, completamente desocupado e em perfeito estado de conservação, conforme vistoria inicial e com quitação escrita do(a) LOCADOR(A), independentemente de aviso ou notificação judicial ou extrajudicial.`),
      p(`Permanecerá intacta a caução mesmo que ultrapasse o prazo do contrato e haja reajustamento dos aluguéis, inclusive os reajustes que venham a ocorrer por força de revisão amigável ou judicial de aluguel, renunciando expressamente aos benefícios dos artigos 827, 837 e 839 do Código Civil Lei 10.406/02. O imóvel dado em caução será usado em todas as hipóteses as quais se farão necessários os recursos provenientes do(a) LOCATÁRIO(A). Finda a locação com a concretização da entrega das chaves e observados os requisitos constantes neste contrato para sua validade, o(a) LOCATÁRIO(A) realizará o cancelamento do registro de gravame em seus assentamentos.`),
      p(`Os(As) CAUCIONANTE(S) autorizam, de forma expressa e irrevogável, o(a) LOCATÁRIO(A) a promover a averbação do presente Contrato na matrícula do Imóvel objeto deste instrumento, junto ao Cartório de Registro de Imóveis competente, para todos os fins de direito, especialmente para gravar o imóvel como caução para a presente locação, nos termos do artigo 38, parágrafo I, da Lei nº 8.245/91. A obrigação de proceder e custear a averbação, bem como seu cancelamento compete ao(a) LOCATÁRIO(A).`),
    )
  }

  return clauses
}

function anexoI(_data: any): Paragraph[] {
  return [
    new Paragraph({
      pageBreakBefore: true,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: 'ANEXO I', font: 'Arial', size: 22, bold: true })],
    }),
    heading('PROTEÇÃO DE DADOS PESSOAIS'),
    p(`Para os fins deste contrato, são considerados, conforme a LGPD – Lei Geral de Proteção de Dados Pessoais (Lei 13.709/18):`),
    p(`DADOS PESSOAIS | qualquer dado ou informação relativa a uma pessoa natural identificada ou identificável (TITULAR ou TITULAR DOS DADOS); considera-se identificável uma pessoa natural que possa ser identificada, direta ou indiretamente, como por exemplo um nome, um número de identificação, dados de localização, identificadores digitais ou a um ou mais elementos específicos da identidade física, fisiológica, genética, mental, econômica, cultural ou social dessa pessoa natural. (LGPD, art. 5º);`),
    p(`REPRESENTANTE | RESPONSÁVEL LEGAL DO TITULAR DOS DADOS: Representante legal, responsável legal ou, ao menos, um dos pais, para a coleta de consentimento quando ocorrer o tratamento de dados pessoais de criança ou adolescente. (LGPD, arts. 11, I e 14, § 1º);`),
    p(`CRIANÇA | considera-se criança a pessoa natural até doze anos de idade incompletos. (ECA, art. 2º);`),
    p(`ADOLESCENTE | considera-se adolescente a pessoa natural entre doze anos completos e dezoito anos incompletos. (ECA, art. 2º);`),
    p(`CONTROLADOR | agente de tratamento, parte que determina as finalidades e os meios de tratamento de dados pessoais. No caso do presente contrato, o CONTROLADOR é a Administradora da Locação (LGPD, art. 5º, VI e IX);`),
    p(`CONTROLADOR CONJUNTO | parte que recebe os dados pessoais do CONTROLADOR, que é o LOCADOR e quem tem o proveito econômico principal do aluguel;`),
    p(`OPERADOR | agente de tratamento, parte que trata dados pessoais de acordo com as instruções do CONTROLADOR. No caso do presente contrato, o OPERADOR são terceiros que podem realizar parte da administração da locação contratada, tais como contadores, advogados. (LGPD, art. 5º, VII e IX);`),
    p(`ENCARREGADO | é o mediador, pessoa indicada pelo controlador e operador para atuar como canal de comunicação entre o controlador, os titulares dos dados pessoais e a Autoridade Nacional de Proteção de Dados – ANPD. (LGPD, arts. 5º, VIII e 41);`),
    p(`TITULAR | é o dono dos dados pessoais, LOCATÁRIO ou representante legal da empresa LOCATÁRIA (LGPD, art. 5º, V);`),
    p(`TRATAMENTO | toda e qualquer operação ou conjunto de operações efetuadas sobre dados pessoais ou sobre conjuntos de dados pessoais, por meios automatizados ou não automatizados, tais como a coleta, o registro, a organização, a estruturação, a conservação, a adaptação ou alteração, a recuperação, a consulta, a utilização, a divulgação por transmissão, difusão ou qualquer outra forma de disponibilização, a comparação ou interconexão, a limitação, a eliminação ou a destruição (LGPD, art. 5º, X);`),
    p(`ACESSO | ato de ingressar, transitar, conhecer ou consultar a informação, bem como possibilidade de usar os ativos de informação de um órgão ou entidade, observada eventual restrição que se aplique;`),
    p(`ARMAZENAMENTO | ação ou resultado de manter ou conservar em repositório um dado;`),
    p(`ARQUIVAMENTO | ato ou efeito de manter registrado um dado embora já tenha perdido a validade ou esgotado a sua vigência;`),
    p(`AVALIAÇÃO | analisar o dado com o objetivo de produzir informação;`),
    p(`CLASSIFICAÇÃO | maneira de ordenar os dados conforme algum critério estabelecido;`),
    p(`COLETA | recolhimento de dados com finalidade específica;`),
    p(`COMUNICAÇÃO | transmitir informações pertinentes a políticas de ação sobre os dados;`),
    p(`CONTROLE | ação ou poder de regular, determinar ou monitorar as ações sobre o dado;`),
    p(`DIFUSÃO | ato ou efeito de divulgação, propagação, multiplicação dos dados;`),
    p(`DISTRIBUIÇÃO | ato ou efeito de dispor de dados de acordo com algum critério estabelecido;`),
    p(`ELIMINAÇÃO | ato ou efeito de excluir ou destruir dado do repositório;`),
    p(`EXTRAÇÃO | ato de copiar ou retirar dados do repositório em que se encontrava;`),
    p(`MODIFICAÇÃO | ato ou efeito de alteração do dado;`),
    p(`PROCESSAMENTO | ato ou efeito de processar dados visando organizá-los para obtenção de um resultado determinado;`),
    p(`PRODUÇÃO | criação de bens e de serviços a partir do tratamento de dados;`),
    p(`RECEPÇÃO | ato de receber os dados ao final da transmissão;`),
    p(`REPRODUÇÃO | cópia de dado preexistente obtido por meio de qualquer processo;`),
    p(`TRANSFERÊNCIA | mudança de dados de uma área de armazenamento para outra, ou para terceiro;`),
    p(`2. Em decorrência do presente contrato, o(a) LOCADOR(A) tratará os dados envolvidos para a consecução do presente contrato, os eventuais dados de titulares do(a) LOCATÁRIO(A) serão tratados pelo(a) LOCADOR(A) com a finalidade de locação de imóveis e sua administração, por relação contratual, nos limites legais.`),
    p(`3. Ao final do presente contrato, o(a) LOCADOR(A) eliminará todos os dados pessoais recebidos do(a) LOCATÁRIO(A) para a realização do presente contrato, exceto os que se fizerem necessários para cumprimento de deveres legais, bem como, exercício regular de direito.`),
    p(`4. O(A) LOCADOR(A) somente realizará os tratamentos de dados pessoais, sempre nos limites expressamente autorizados pela lei e pelo titular de dados pessoais que é o(a) LOCATÁRIO(A), nos limites do objeto do contrato.`),
    p(`5. Caso o(a) LOCATÁRIO(A) entenda que alguma das orientações fornecidas pelo(a) LOCADOR(A) viola a legislação de proteção de dados aplicável, deverá comunicá-la o mais breve possível, apresentando as respectivas justificativas.`),
    p(`6. AS PARTES declaram, por este instrumento, que cumprem toda a legislação aplicável sobre privacidade e proteção de dados pessoais, inclusive (sempre e quando aplicáveis) a Constituição Federal, o Código de Defesa do Consumidor (Lei 8.078/90), o Código Civil (Lei 10.406/02), o Marco Civil da Internet (Lei 12.965/14), seu decreto regulamentador (Decreto 8.771/16), a Lei Geral de Proteção de Dados Pessoais (Lei 13.709/18), e demais normas setoriais ou gerais sobre o tema.`),
    p(`7. O(A) LOCADOR(A) se compromete a tratar os dados pessoais que possam estar relacionados ao objeto do presente contrato somente nos estritos limites aqui previstos, não devendo praticar qualquer tipo de ato que envolva os dados pessoais transmitidos por meio deste contrato sem a prévia e expressa autorização ou solicitação do(a) LOCATÁRIO(A), sob pena de responder pelos eventuais danos causados.`),
    p(`8. Durante o armazenamento de dados pessoais os agentes de tratamento respeitarão, dentro do possível, os seguintes padrões de segurança: o estabelecimento de controle estrito sobre o acesso aos dados pessoais mediante a definição de responsabilidades das pessoas que terão possibilidade de acesso e de privilégios de acesso exclusivo para determinados responsáveis; o estabelecimento de mecanismos de autenticação de acesso aos registros, usando, priorizando e orientando para sistemas de autenticação dupla para assegurar a individualização do responsável pelo tratamento dos registros; a criação de inventário de acesso aos registros de conexão e de acesso a aplicações.`),
    p(`9. Os agentes de tratamento deverão manter registro formal das seguintes informações, na medida do possível: Registro de todas as atividades de tratamento que pratica; Registro das transferências internacionais de dados pessoais a países terceiros (LGPD, art. 33) a informação sobre o país/organização de destino e se estão dentro dos padrões de compliance de dados do mercado.`),
    p(`10. Os agentes de tratamento deverão manter sigilo em relação os dados pessoais tratados em virtude deste contrato, atestando que todas as pessoas autorizadas a tratarem tais dados pessoais estão comprometidas, preferencialmente de forma expressa e por escrito, estão sujeitas ao dever de confidencialidade, bem como devidamente instruídas e capacitadas para o tratamento de dados pessoais.`),
    p(`11. Os agentes de tratamento atenderão os direitos dos TITULARES DE DADOS Pessoais (LGPD, art. 17 a 22), no limite das possibilidades dentro do caso concreto, se e quando aplicável: Confirmação da existência de tratamento; Acesso aos dados; Correção de dados incompletos, inexatos ou desatualizados; Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a lei; Portabilidade dos dados; Eliminação dos dados pessoais tratados com o consentimento; Informação sobre entidades públicas e privadas com as quais foi realizado uso compartilhado de dados; Informação sobre a possibilidade de não fornecimento do consentimento e sobre as consequências da negativa; Revogação do consentimento; Revisão de decisões automatizadas tomadas com base no tratamento de dados pessoais.`),
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
        p(`Os signatários devidamente qualificados nos itens I, II e III do quadro resumo contido neste instrumento têm entre si justo e contratado a locação do imóvel constante no item IV do quadro resumo, conforme cláusulas abaixo.`),
        p(`CONSIDERANDO que as PARTES, ou são os titulares de dados pessoais ou são empresas, obrigadas a cumprir as exigências da Lei 13.709/18 – Lei Geral de Proteção de Dados Pessoais – LGPD, como agentes de tratamento de Dados Pessoais, especialmente pelos princípios institucionais contemplam a privacidade de dados pessoais como um de seus valores, para tanto trazem no presente contrato a expressa atenção ao princípio da boa-fé objetiva, atendem a privacidade como padrão e agem com transparência quanto às finalidades do tratamento dos dados pessoais, para tratar de questões de privacidade de dados pessoais.`),

        heading('Cláusula 1ª — Do Prazo da Locação'),
        p(`O prazo da locação é o estipulado no item VI do quadro resumo, onde, ao término do presente contrato o(a) LOCATÁRIO(A) se obriga a restituir as chaves do aludido imóvel ao(à) LOCADOR(A), ou a seu procurador ou ainda a seu representante legal, no estado em que o recebeu, independentemente de Notificação ou Interpelação Judicial, deixando-o livre, vago e desembaraçado de pessoas e coisas.`),
        p(`O(A) LOCADOR(A) declara expressamente ser o(a) legítimo(a) proprietário(a) do imóvel objeto do presente instrumento, assumindo a responsabilidade civil e criminal por esta declaração, isentando a empresa intermediadora de toda e qualquer responsabilidade.`),
        p(`Caso o(a) LOCATÁRIO(A) não restitua o imóvel no fim do prazo contratual, pagará enquanto estiver na posse do mesmo, o aluguel mensal reajustado nos termos da Cláusula Segunda, até a efetiva desocupação do imóvel objeto deste instrumento.`),
        ...(valor.carencia && valor.carenciaPrazo ? [
          p(`Fica pactuado um período de carência de ${valor.carenciaPrazo} meses a contar do início da locação${valor.carenciaMotivo ? `, destinado a: ${valor.carenciaMotivo}` : ''}, durante o qual fica isento o pagamento do aluguel mensal.`),
        ] : []),

        heading('Cláusula 2ª — Do Pagamento'),
        p(`O(A) LOCATÁRIO(A) se compromete a pagar, pontualmente até a data do vencimento especificada no item VIII do quadro resumo de cada mês subsequente ao vencido, o valor do aluguel mencionado no item VII do quadro resumo, ou ainda, por meio de boleto bancário a ser emitido pela administradora do imóvel. Depósito na conta: ${bkStr}.`),
        p(`O valor do aluguel mensal será reajustado a cada 12 meses, mediante aplicação da variação positiva do índice mencionado no item XI do quadro resumo. Caso este seja negativo, o contrato permanecerá com o valor atual.`),
        p(`Na hipótese do índice acima eleito vier a ser extinto, suprimido, substituído, congelado ou por qualquer forma deixar de refletir a inflação, as PARTES, desde já, convencionam que os reajustes do valor do aluguel serão calculados por um dos índices seguintes, sempre respeitada a ordem de nomeação: o índice que, nos termos da legislação específica venha a ser determinado para reajuste das locações; IPC (FIPE).`),
        p(`Se em virtude de Lei subsequente, vier a ser admitida a correção do valor do aluguel em periodicidade inferior a prevista na legislação vigente, à época de sua celebração, concordam as PARTES, desde já, em caráter irrevogável, que a correção do aluguel será feita no menor prazo que for permitido pela Lei posterior e far-se-ão independentemente de qualquer aviso, notificação ou interpelação, prevalecendo referidos reajustes até a efetiva devolução do imóvel.`),

        heading('Cláusula 3ª — Da Comissão e Intermediação'),
        p(`Tendo em vista a intermediação realizada pela JAIMERX IMOBILIÁRIA LTDA, CNPJ 63.271.809/0001-78, o(a) LOCADOR(A) desde já reconhece e autoriza o(a) LOCATÁRIO(A) a pagar o valor correspondente ao primeiro aluguel integral, no valor de R$ ${valor.aluguel}, no vencimento de ${formatDate(comissao.vencimento)}, observando as proporções descritas abaixo:`),
        p(comLinhas.join('\n')),
        p(`A falta de pagamento dos aluguéis e encargos dentro do prazo avençado na cláusula 2 acarretará ao(à) LOCATÁRIO(A) a multa moratória contida no item IX do quadro resumo sobre o valor devido e, se o atraso for superior a 30 (trinta) dias, acrescer-se-á de atualização monetária e juros de mora de 1% (um por cento) ao mês, sem prejuízo no disposto na cláusula 18, ressalvando o direito do(a) LOCADOR(A) de adotar as medidas judiciais cabíveis à espécie.`),

        heading('Cláusula 4ª — Da Finalidade da Locação'),
        p(`O imóvel, objeto deste contrato, destina-se exclusivamente para o fim descrito no item V do quadro resumo do(a) LOCATÁRIO(A), o que não ocorrendo ficará configurado como infração contratual, operando-se automaticamente a rescisão do presente contrato.`),
        p(`O(A) LOCATÁRIO(A) declara, neste ato, ter conhecimento da Convenção e Regulamento Interno do Condomínio (quando o imóvel pertencer a este), obrigando-se a respeitá-lo e responder por eventuais multas que sejam impostas, sem prejuízo de sua defesa, inclusive em juízo se necessário for.`),

        ...(clausulas.moradores?.trim() ? [
          heading('Cláusula 5ª — Dos Moradores'),
          p(`Além do(a) LOCATÁRIO(A), residirão no imóvel: ${clausulas.moradores.trim()}. Qualquer alteração deverá ser comunicada por escrito no prazo de 30 dias.`),
        ] : []),

        heading('Cláusula 6ª — Do Imóvel, Conservação, Manutenção e Vistorias'),
        p(`O(A) LOCATÁRIO(A) declara receber o imóvel no estado de conservação conforme vistoria em anexo, obrigando-se ainda, a: Manter o imóvel objeto da locação, no mais perfeito estado de higiene, conservação e limpeza, para assim o restituir quando finda ou rescindida a locação o imóvel pintado na cor original, limpo e livre de pessoas e coisas.`),
        p(`Efetuar todas as obras e reparos de que necessita a coisa locada, excetuados os que digam respeito a sua própria estrutura, correndo por sua conta as despesas correspondentes devendo, também, trazer em perfeito estado de conservação, manutenção e limpeza a pintura, aparelhos sanitários, fechaduras, trincos, vidraças, instalações elétricas e hidráulicas, azulejos, ralos e quaisquer outros acessórios ou componentes em geral.`),
        p(`Não ceder, sublocar, ou emprestar, parcial ou totalmente, o imóvel locado, sem prévia autorização por escrito do(a) LOCADOR(A).`),
        p(`Na hipótese da existência de autorização expressa de que trata o item anterior, o(a) LOCATÁRIO(A) ficará com a responsabilidade de remover os ocupantes, a fim de que o imóvel venha a estar desocupado e em ordem, no momento em que for restituído ao(à) LOCADOR(A).`),
        p(`O(A) LOCATÁRIO(A) obriga-se a atender por sua conta exclusiva, a qualquer exigência dos Poderes Públicos Estaduais, Municipais e Federais, a que der causa em razão do uso do imóvel objeto da presente locação, assumindo toda a responsabilidade pelas custas e quaisquer penalidades em que incorrer a esse propósito por inobservância das determinações das autoridades.`),
        ...((imovel.consEnergia || imovel.consGas || imovel.consAgua) ? [
          p(`Códigos de consumo: Energia: ${imovel.consEnergia || '—'} | Gás: ${imovel.consGas || '—'} | Água: ${imovel.consAgua || '—'}.`),
        ] : []),

        heading('Cláusula 7ª — Dos Encargos e Obrigações em Relação ao Imóvel Locado'),
        p(clausulas.iptuLocador
          ? `De mútuo e comum acordo, as PARTES convencionam que o IPTU (Imposto Predial e Territorial Urbano) e as taxas condominiais ordinárias serão de responsabilidade do(a) LOCADOR(A), permanecendo a obrigação do(a) LOCATÁRIO(A) quanto às despesas de luz, gás, água, tarifas bancárias, despesas de postagem referentes à cobrança do aluguel e demais encargos incidentes sobre o imóvel, ou que venham a ser criados na vigência da locação, devendo este(a) efetuar o pagamento até a respectiva data de vencimento estipulada na Cláusula 2.`
          : `De mútuo e comum acordo, as PARTES convencionam que todos os impostos, especialmente o IPTU (Imposto Predial e Territorial Urbano), taxas condominiais ordinárias, despesas de luz, gás, água, tarifas bancárias, despesas de postagem referentes a cobrança do aluguel e demais encargos incidentes sobre o imóvel, ou que venham a ser criados na vigência da locação, mesmo que em nome do(a) LOCADOR(A) ou de terceiros, será de responsabilidade integral do(a) LOCATÁRIO(A), devendo este(a) efetuar o pagamento juntamente com o aluguel a quem de direito até a respectiva data de vencimento devidamente estipulada na Cláusula 2.`
        ),
        p(`O(A) LOCATÁRIO(A) obriga-se a transferir ou pedir ligação da energia elétrica, água, gás, etc., relativas ao imóvel ora locado, em seu nome, bastando, para tanto, o protocolo de solicitação junto às concessionárias dos aludidos serviços, arcando com as eventuais despesas de transferência, no prazo de 30 (trinta) dias após o início da locação, enviando cópia do protocolo e ou da primeira conta já em seu nome para o(a) LOCADOR(A), sob pena de não o fazendo ficar caracterizada a infração contratual.`),
        p(`O(A) LOCATÁRIO(A) obriga-se a apresentar ao(à) LOCADOR(A), devidamente quitados, os recibos de luz, gás, água e outros, para, finda a locação, efetuar a entrega das chaves.`),
        p(`Em caso do(a) LOCATÁRIO(A) efetuar pagamentos de quaisquer tributos, impostos ou taxas incidentes sobre o imóvel ou locação diretamente ao órgão arrecadador, deverá exibi-los e deixar em poder do(a) LOCADOR(A) os respectivos recibos até no máximo de 30 dias após o pagamento.`),
        p(`Para receber quitação final das obrigações oriundas deste contrato, o(a) LOCATÁRIO(A), por ocasião da devolução do imóvel, deverá exibir ao(à) LOCADOR(A), o comprovante de baixa junto às concessionárias de serviços públicos de suas ligações de eletricidade, gás, água etc.`),
        p(`O(A) LOCADOR(A) efetuará um seguro do imóvel, cuja a indenização será em seu favor, contra riscos de incêndio e o pagamento deverá ser efetuado pelo(a) LOCATÁRIO(A), seguro este feito com corretora de seguros de inteira confiança e indicação do(a) LOCADOR(A) por meio de Seguradora de renome e ilibada reputação de livre escolha da parte LOCADOR(A), com base no valor real do imóvel e incluirá o pagamento por danos causados ao imóvel, bem como o valor dos alugueres referentes ao período que mediar a data do sinistro e o término das obras e reparação da construção e que será renovado anualmente, até a efetiva entrega do imóvel.`),
        p(`Na hipótese de incêndio ou acidente que obrigue a reconstrução parcial ou total do imóvel, operar-se-á automaticamente a rescisão do presente contrato, sem prejuízo da responsabilidade do(a) LOCATÁRIO(A), se o fato lhe for imputado.`),
        p(`Os encargos previstos na Cláusula 7, bem como nas demais cláusulas deste instrumento, passam a integrar de pleno direito, o valor dos respectivos aluguéis mensais e reputam-se devidos pelo(a) LOCATÁRIO(A), independentemente de qualquer aviso, notificação ou interpelação prévia, não sendo permitido ao(à) LOCATÁRIO(A) deixar de pagá-los pontualmente com os aluguéis aos quais se acrescentam, sob qualquer pretexto, até as respectivas datas de vencimento.`),
        p(`A partir do início da vigência da locação, as despesas incidentes sobre o imóvel, notadamente o IPTU (Imposto Predial e Territorial Urbano) e as taxas condominiais ordinárias, serão de responsabilidade do(a) LOCATÁRIO(A), e deverão ser pagas proporcionalmente ao período de ocupação no respectivo mês. O pagamento dessas despesas deverá ser efetuado até o próximo vencimento de aluguel. Caso o(a) LOCADOR(A) pague essas despesas antecipadamente, o(a) LOCATÁRIO(A) deverá reembolsá-lo(a) no mesmo prazo.`),

        heading('Cláusula 8ª — Das Modificações e/ou Reformas no Imóvel e da Vistoria'),
        p(`O(A) LOCATÁRIO(A) não poderá fazer no imóvel ora locado, modificações e ou transformações que importem na alteração da estrutura do imóvel, sem o prévio consentimento por escrito do(a) LOCADOR(A), sempre a título precário e com a obrigação de repor tudo no estado anterior, por ocasião da restituição do imóvel, salvo determinação em contrário.`),
        p(`O(A) LOCATÁRIO(A) poderá proceder internamente no imóvel as adaptações necessárias para o seu uso, arcando com todas as despesas, ônus e responsabilidades daí advindas, ficando proibida a realização de obras no imóvel que afetem a sua estrutura, salvo com autorização por escrito do(a) LOCADOR(A).`),
        p(`Toda e qualquer benfeitoria feita no imóvel pelo(a) LOCATÁRIO(A) precedida de autorização do(a) LOCADOR(A), ficará incorporada ao mesmo, sem direito à indenização ou retenção.`),
        p(`O(A) LOCATÁRIO(A), desde já, faculta ao(à) LOCADOR(A), ou a qualquer representante seu ou de seu procurador, a vistoriar o imóvel quando assim o entender conveniente.`),
        p(`Pela vistoria que fizer no imóvel for encontrado qualquer defeito ou estrago ocasionados pelo uso irregular, ficará caracterizada a infração contratual, podendo o(a) LOCADOR(A) exigir expressamente que o(a) LOCATÁRIO(A) inicie os reparos necessários no prazo de 30 (trinta) dias, sob pena de mandar executá-los por sua conta e exigir, incontinenti, o montante das despesas efetuadas.`),
        p(`Não efetuando o(a) LOCATÁRIO(A) o reembolso das despesas de que trata o parágrafo anterior em 24 (vinte e quatro) horas, será ajuizada a competente ação de cobrança.`),
        p(`Eventuais danos causados ao imóvel ao término do contrato, independe, para fins de constatação e eventual demanda judicial, de exame pericial ou vistoria judicial.`),
        p(`O tempo despendido pelo(a) LOCADOR(A) para restauração do imóvel ao estado inicial da locação, será computado como tempo de locação e será objeto de cobrança junto ao(à) LOCATÁRIO(A) ou seu(s) FIADOR(ES), na hipótese que tais reparos não sejam feitos até a entrega das chaves.`),

        heading('Cláusula 9ª — Do Direito de Preferência'),
        p(`O(A) LOCADOR(A), em qualquer tempo, poderá alienar o imóvel, mesmo durante a vigência do contrato de locação e, por via de consequência ceder os direitos contidos no contrato. O(A) LOCADOR(A) deverá notificar o(a) LOCATÁRIO(A) para que este possa exercer seu direito de preferência na aquisição do imóvel, nas mesmas condições em que for oferecido a terceiros e para efetivação da preferência deverá o(a) LOCATÁRIO(A) responder a notificação, de maneira inequívoca, no prazo de 30 (trinta) dias.`),
        p(`Fica pactuado, que exercido o direito de preferência pelo(a) LOCATÁRIO(A), o(a) vendedor(a), ora LOCADOR(A), pagará a título de comissão de 6% (seis por cento) sobre o valor da venda que se concretizar à JAIMERX IMOBILIÁRIA LTDA., inscrita no C.N.P.J. sob o número 63.271.809/0001-78, pela intermediação.`),
        p(`Não havendo interesse do(a) LOCATÁRIO(A) na aquisição do imóvel, este, desde já faculta ao(à) LOCADOR(A), ou a qualquer representante seu ou seu procurador a mostrar o imóvel em dia e hora previamente marcados com antecedência de 24 horas.`),

        heading('Cláusula 10ª — Das Comunicações'),
        p(`O(A) LOCATÁRIO(A) obriga-se a fazer chegar às mãos do(a) LOCADOR(A) os avisos e comunicações oficiais ou não, que digam respeito à coisa locada, sob pena de responder pelos prejuízos e danos que causar sua desídia, independentemente de qualquer outra compensação que neste se estipula, para fins gerais ou especiais.`),

        heading('Cláusula 11ª — Da Desapropriação, do Abandono e da Desocupação e das Vistorias do Imóvel'),
        p(`Em caso de desapropriação, parcial ou total, do imóvel, a locação será considerada rescindida, não cabendo ao(à) LOCADOR(A), ressarcir os prejuízos daí decorrentes ou que porventura venham a ser alegados. Na hipótese do(a) LOCATÁRIO(A) abandonar o imóvel, fica o(a) LOCADOR(A) autorizado(a) a se imitir na posse imediatamente sem aviso prévio, a fim de evitar a depredação ou invasão do mesmo.`),
        p(`O termo de entrega das chaves será substituído por uma Declaração De Imissão De Posse, firmado pelo(a) LOCADOR(A) e 02 (duas) testemunhas idôneas, sem que o(a) LOCATÁRIO(A) possa reclamar qualquer tipo de indenização.`),
        p(`Na vigência da locação, ou após o vencimento do Contrato de Locação e prorrogado por prazo indeterminado, o(a) LOCATÁRIO(A) deverá, em qualquer destas hipóteses, comunicar por escrito o(a) LOCADOR(A), ou representante legal, com mínimo de 30 (trinta) dias de antecedência a sua intenção de desocupar e entregar as chaves do imóvel.`),
        p(`Em caso de danos ao imóvel, não haverá ônus de produção de prova pericial as PARTES, valendo o conjunto de fotos, vistorias, orçamentos de 3 empresas idôneas e demonstrativo de pagamento de conserto como prova suficiente à indenização, que poderá ser inclusive objeto de execução de título extrajudicial.`),
        p(`Durante o prazo necessário ao conserto dos danos, ainda que o imóvel já tenha sido entregue pelo(a) LOCATÁRIO(A), permanecerá o mesmo obrigado ao pagamento dos aluguéis e encargos no período.`),
        p(`Nenhuma intimação do Poder Público será motivo para que se opere a rescisão do presente contrato, salvo precedendo de vistoria judicial que prove a imprestabilidade absoluta da coisa para os fins a que se destina.`),

        ...(clausulas.isencaoMeses ? [
          heading('Cláusula 12ª — Isenção de Multa Rescisória'),
          p(`As Partes concordam antecipadamente que, após o período locatício de ${clausulas.isencaoMeses} meses o(a) LOCATÁRIO(A) poderá desocupar o imóvel isento da multa de que trata a cláusula 14ª, bastando para tanto, notificar o(a) LOCADOR(A) com ${clausulas.isencaoAviso || 30} dias de antecedência, por escrito.`),
        ] : []),

        ...garantiaClause(gnt, garantia, fiadores, 'Cláusula 13ª — Da Garantia Locatícia'),

        heading('Cláusula 14ª — Das Multas'),
        p(`A parte que infringir qualquer das cláusulas deste contrato, pagará a outra a multa de 3 (três) vezes o valor locativo mensal devido à época em que se verificar a infração, com a faculdade, para a parte inocente, de exigir o cumprimento do contrato ou de considerá-lo rescindido. Durante o prazo estipulado para a duração do contrato, não poderá o(a) LOCADOR(A) reaver o imóvel alugado. O(A) LOCATÁRIO(A), todavia, poderá devolvê-lo, pagando a multa acima pactuada, proporcionalmente ao período de cumprimento do contrato, ou na sua falta, a que for judicialmente estipulada.`),
        p(`O pagamento da multa pactuada na cláusula anterior não eximirá o(a) LOCATÁRIO(A) de efetuar o pagamento dos aluguéis vencidos e nem de ressarcir os danos que, porventura, vier a causar ao imóvel. Tudo quanto for devido em razão deste contrato, será cobrado por via executiva ou ação apropriada, respondendo a parte devedora, além do principal e multa, por todas as despesas judiciais, extrajudiciais e honorários advocatícios na base de 20% (vinte por cento).`),

        heading('Cláusula 15ª — Das Ações de Despejo'),
        p(`Se o(a) LOCATÁRIO(A) der causa ao ajuizamento de 3 (três) ações de despejo por falta de pagamento dos aluguéis e ou encargos, sucessivas ou alternadas, no prazo de 24 (vinte e quatro) meses, ficará caracterizado o abuso de direito, acarretando em consequência, a rescisão do presente contrato.`),
        p(`Não se admitirá a emenda da mora se o(a) LOCATÁRIO(A) já houver utilizado essa faculdade no prazo de 24 (vinte e quatro) meses imediatamente anteriores a propositura da ação, conforme o artigo 62 parágrafo único da Lei 8.245/91 (redação pela Lei 12.112/09).`),
        p(`O(A) LOCATÁRIO(A) devidamente qualificado(a) no quadro resumo, autoriza expressamente a citação, intimação ou notificação, mediante correspondência com aviso de recebimento, nos termos do artigo 247 do Código de Processo Civil (Lei 13.105/15).`),

        heading('Cláusula 16ª — Das Assinaturas Digitais e Eletrônicas'),
        p(`As PARTES ajustam que o Contrato, anexos e os documentos correlatos, bem como eventuais aditivos poderão ser assinados digital ou eletronicamente, produzindo todos os efeitos legais. Nos termos do art. 10, § 2º, da Medida Provisória nº 2.200-2, as PARTES expressamente concordam em utilizar e reconhecem como válida qualquer forma de comprovação de anuência aos termos ora acordados em formato eletrônico, ainda que não utilizem certificado digital emitido no padrão ICP-Brasil, incluindo assinaturas eletrônicas em plataforma específica disponibilizada pelas PARTES diretamente ou por terceiros. A formalização das avenças na maneira supra acordada será suficiente para a validade e integral vinculação das PARTES ao Contrato, seus anexos, documentos e aditivos.`),
        p(`As PARTES declaram que aceitam todos os termos e condições que disciplinam o processo eletrônico, com fundamento na legislação pertinente e especialmente no Decreto nº 8.539/15, admitindo como válida a assinatura eletrônica na modalidade cadastrada (login e senha), tendo como consequência a responsabilidade pelo uso indevido das ações efetuadas, as quais serão passíveis de apuração de responsabilidade civil, penal e administrativa.`),

        heading('Cláusula 17ª — Da Proteção dos Dados Pessoais'),
        p(`Durante a vigência deste Contrato, as PARTES observarão as disposições do Anexo I de Proteção de Dados Pessoais, parte integrante deste instrumento.`),
        p(`O Anexo I de Proteção de Dados Pessoais, no que diz respeito à preservação da privacidade e proteção de dados pessoais, em caso de conflito, prevalecerão perante os demais termos do presente Contrato.`),
        p(`O(A) LOCADOR(A), na qualidade de controlador de dados pessoais em decorrência do objeto deste Contrato, poderá ter acesso às informações consideradas como dados pessoais por meio de compartilhamento desses dados pessoais pelo(a) LOCATÁRIO(A). Nesse sentido, ambas as PARTES se comprometem a respeitar o tratamento de dados pessoais, assegurando o cumprimento de toda a legislação aplicável sobre segurança da informação, privacidade e proteção de dados, inclusive (sempre e quando aplicáveis) a Constituição Federal, o Código de Defesa do Consumidor (Lei nº 8.078/1990), o Código Civil (Lei nº 10.406/2002), o Marco Civil da Internet (Lei nº 12.965/2014), seu decreto regulamentador (Decreto nº 8.771/2016), a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 e a Lei nº 13.853/2019) e demais normas vigentes sobre a matéria.`),

        heading('Cláusula 18ª — Das Obrigações das Partes'),
        p(`A eventual prorrogação tácita, expressa ou legal da locação abrangerá todas as obrigações neste constante.`),
        p(`As PARTES de pleno e comum consenso e de modo irrevogável e irretratável convencionam e estipulam que o presente contrato celebrado, tem como condição essencial a observância do princípio pacta sunt servanda, com o objetivo de ficar sempre preservado o valor real monetário do locativo, em razão do que a correção ou atualização desse locativo estará livre de eventual medida governamental relativa à troca de moeda, aplicação de redutores ou deflatores impeditiva da forma de correção pactuada, sendo que, eventual, recebimento de alugueres e encargos será considerado apenas mera liberalidade do(a) LOCADOR(A) não caracterizando em hipótese alguma novação ou alteração contratual.`),
        p(`Ficam assegurados a(o) LOCADOR(A), LOCATÁRIO(A) e FIADOR(ES), todos os direitos e vantagens conferidos pela Lei em vigor, ou que, na vigência e após o término deste contrato, sejam promulgadas.`),
        p(`Em qualquer ação decorrente deste contrato, todos os atos de citação, intimação, notificação e comunicação do processo encaminhados aos endereços das PARTES constantes do contrato serão tidos como válidos.`),
        p(`As citações ou intimações praticadas por via postal ou oficial de justiça remetidas aos endereços das PARTES, ainda que recebidas por terceiro, serão tidas como plenamente válidas.`),
        p(`Quaisquer alterações de endereço no curso do contrato deverão ser comunicadas por escrito por uma parte a outra.`),
        p(`O presente Contrato de Locação rege-se pela Lei 8.245/91, inclusive com as alterações previstas na Lei 12.112/09, e nos casos omissos pelo Código Civil Brasileiro (Lei 10.406/02).`),

        heading('Cláusula 19ª — Das Normas de Segurança e Ética da Sustentabilidade e Condutas Recomendáveis'),
        p(`Deverão, as PARTES, respeitar todas as normas internas da umas das outras, especialmente quando pessoas jurídicas, bem como observar e respeitar as normas éticas e legais que envolvam o desenvolvimento dos serviços propostos, em especial de segurança da informação e processos ecológicos.`),
        p(`Deverão as PARTES, especialmente quando pessoas jurídicas, envidar todos os esforços para cumprimento dos itens abaixo, uma vez que são práticas observadas, valorizadas e recomendáveis a todas as empresas, a saber: Buscar o desenvolvimento sustentável da sociedade como um todo; Adotar práticas socialmente responsáveis, comprometendo-se com ações de anticorrupção.`),
        p(`As PARTES se obrigam e se comprometem a observar rigorosamente, por si, seus representantes legais, prepostos e colaboradores, especialmente quando pessoas jurídicas, as disposições da legislação anticorrupção em vigor, em especial a Lei nº 12.846/2013, abstendo-se especialmente de praticar, perante terceiros ou autoridades de qualquer esfera, a oferta, a promessa, o pagamento, a concessão, a solicitação ou a aceitação, direta ou indiretamente, de qualquer vantagem, financeira ou não, visando influenciá-las a praticar qualquer medida imprópria ou induzi-las a tomar ou a omitir-se de tomar qualquer medida em violação de suas obrigações contratuais ou legais.`),
        p(`Respeitados os limites legais e contratuais, as PARTES se obrigam e se comprometem a colaborar com quaisquer investigações, sindicâncias, processos judiciais ou administrativos, auditorias ou outras medidas patrocinadas por órgãos públicos, empresas ou instituições autorizadas e pelas PARTES, especialmente quando pessoas jurídicas, para a apuração de irregularidades ou ilegalidades que tenham ou possam ter sido cometidas no âmbito dos serviços prestados por força deste CONTRATO.`),
        p(`As PARTES se obrigam e se comprometem a não utilizar trabalho infantil ou que, sob qualquer aspecto, apresente-se como irregular perante a legislação em vigor.`),

        heading('Cláusula 20ª — Das Disposições Gerais'),
        p(`O presente contrato é celebrado de acordo com o princípio da boa-fé, traduzindo-se no interesse social da segurança nas relações jurídicas, onde as PARTES devem agir com lealdade e confiança recíprocas.`),
        p(`O princípio da boa-fé está positivado nos artigos 4º, inciso III e 51, inciso IV do Código de Defesa do Consumidor (Lei 8.078/90) e que cria três deveres principais: a lealdade; a colaboração, que é basicamente o bem de informar o candidato a CONTRATANTE sobre o conteúdo do contrato; e o de não abusar, ou até mesmo, de preocupar-se com a outra parte (dever de proteção).`),
        p(`As PARTES assumem todo e qualquer tipo de responsabilidade referente à veracidade das informações e documentos apresentados para a efetivação do negócio. A apresentação de documentos inverídicos, falsificados ou maculados por qualquer ilegalidade, incidirá as PARTES em cláusula penal.`),
        p(`LOCADOR(A), LOCATÁRIO(A) e demais signatários declaram que tendo lido atentamente todas as cláusulas do presente contrato, sem exceção, e estando de pleno acordo com as mesmas, ratificam-nas integralmente.`),

        heading('Cláusula 21ª — Do Foro'),
        p(`Com expressa renúncia de qualquer outro, por mais especial que seja, fica eleito o Foro Central da Capital de São Paulo, para dirimir eventuais dúvidas ou controvérsias que deste instrumento possam advir, através das ações competentes, ficando por conta da parte vencida, em qualquer caso, o pagamento de honorários advocatícios, na base de 20% (vinte por cento), custas e despesas judiciais e extrajudiciais, bem como, atualização monetária e juros de mora dos débitos existentes entre as PARTES.`),
        p(`As PARTES, independente de comum acordo, poderão utilizar-se do juízo arbitral a ser instituído pela Câmara Arbitral, tudo em conformidade com a Lei 9.307/96.`),

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
