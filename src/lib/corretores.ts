// src/lib/corretores.ts
// Base de corretores da Jaime Imobiliária
// Preenchimento automático no step de comissionamento

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

export const CORRETORES: Corretor[] = [
  {
    apelido: 'ADRIANO',
    nome: 'ADRIANO COUTO PINHEIRO BLANCO',
    cpf: '682.718.825-34',
    creci: '197.117',
    banco: 'Itaú (341)', agencia: '7043', conta: '52661-0',
  },
  {
    apelido: 'ALAIN',
    nome: 'ALAIN BAROUKH',
    cpf: '125.039.408-20',
    creci: '159.562',
    banco: 'Banco do Brasil (001)', agencia: '0719', conta: '15823-2',
  },
  {
    apelido: 'ANDRÉ GRIMBERG',
    nome: 'André Grimberg',
    cpf: '403.527.758-40',
    creci: '216620',
    banco: 'Itaú (341)', agencia: '1035', conta: '32378-9',
    pix: 'grimberg.andre@gmail.com', pixTipo: 'e-mail',
  },
  {
    apelido: 'CARLA ANGRISANI',
    nome: 'CARLA ANGRISANI ALVES DE OLIVEIRA',
    cpf: '083.630.918-98',
    creci: '176.941',
    banco: 'Bradesco (237)', agencia: '1431', conta: '50705-9',
    pix: '083.630.918-98', pixTipo: 'CPF',
  },
  {
    apelido: 'CILENE',
    nome: 'ANTONIA CILENE MINEIRO',
    cpf: '396.806.903-00',
    creci: '132.997',
    banco: 'Santander (033)', agencia: '3196', conta: '0100707-2',
  },
  {
    apelido: 'CECÍLIA',
    nome: 'CECILIA ROSA MURACHOVSKY',
    cpf: '230.022.428-37',
    creci: '082.161',
    banco: 'Itaú (341)', agencia: '9097', conta: '00725-7',
  },
  {
    apelido: 'CELIA LEWKOWICZ',
    nome: 'CELIA LEWKOWICZ',
    cpf: '064.289.948-79',
    creci: '235.929-F',
    banco: 'Santander (033)', agencia: '0386', conta: '01035045-5',
  },
  {
    apelido: 'CÉLIA REGINA',
    nome: 'CELIA REGINA REIS ATHAYDE FERNANDES',
    cpf: '269.594.508-61',
    creci: '156.085',
    banco: 'Nubank (260)', agencia: '0001', conta: '95706285-5',
  },
  {
    apelido: 'COLETTE',
    nome: 'COLETTE ROISTACHER',
    cpf: '156.982.478-97',
    creci: '162.735',
    banco: 'Itaú (341)', agencia: '428', conta: '43085-4',
  },
  {
    apelido: 'CREUSA',
    nome: 'CREUSA ALMEIDA DE JESUS SOUZA',
    cpf: '090.546.118-55',
    creci: '048.741',
    banco: 'Banco do Brasil (001)', agencia: '1191-6', conta: '40001-7',
  },
  {
    apelido: 'DAL',
    nome: 'ADALGISA MEDEIROS DA SILVA',
    cpf: '048.864.388-06',
    creci: '228.438-F',
    banco: 'Itaú (341)', agencia: '0061', conta: '28307-3',
  },
  {
    apelido: 'DANIELLE',
    nome: 'DANIELLE BENISTE SLOMOVIC',
    cpf: '154.209.637-52',
    creci: '299054',
    banco: 'Bradesco (237)', agencia: '0226-7', conta: '0166028-4',
    pix: '154.209.637-52', pixTipo: 'CPF',
  },
  {
    apelido: 'DEBORA',
    nome: 'DEBORA MELSOHN',
    creci: '160112',
    banco: '', agencia: '', conta: '',
    obs: 'Dados bancários incompletos — preencher manualmente',
  },
  {
    apelido: 'EDUARDO LAPIDUS',
    nome: 'LAPIDUS E GRIMBERG IMOVEIS LTDA - ME',
    cnpj: '21.859.701/0001-50',
    creci: '26889-J',
    banco: 'Itaú (341)', agencia: '0061', conta: '07343-3',
  },
  {
    apelido: 'FLAVIA',
    nome: 'FLAVIA TONELLO',
    cpf: '818.603.310-68',
    creci: '165.673-F',
    banco: 'Nubank (260)', agencia: '0001', conta: '42022003-7',
  },
  {
    apelido: 'FRANCISCO',
    nome: 'FRANCISCO GILMARIO DE OLIVEIRA MEDEIROS',
    cpf: '770.504.108-10',
    creci: '078.150',
    banco: 'Bradesco (237)', agencia: '0119-8', conta: '0220146-1',
  },
  {
    apelido: 'GABRIEL',
    nome: 'GABRIEL BUENO DE ALMEIDA LTDA',
    cnpj: '57.676.781/0001-56',
    creci: '48103-J',
    banco: 'C6 (336)', agencia: '0001', conta: '34959925-4',
  },
  {
    apelido: 'GISELA',
    nome: 'SUNG WON PARK (Gisela)',
    cpf: '185.119.548-30',
    creci: '262.738-F',
    banco: 'C6 (336)', agencia: '0001', conta: '28027061-5',
  },
  {
    apelido: 'GLAUCIA',
    nome: 'GLAUCIA APARECIDA DA SILVA DAMASCENO',
    cpf: '280.106.788-13',
    creci: '277682',
    banco: 'C6 (336)', agencia: '0001', conta: '21772806-5',
  },
  {
    apelido: 'ILANA',
    nome: 'ILANA MARION AJZENBERG',
    cpf: '100.421.628-90',
    creci: '154.241',
    banco: 'Itaú (341)', agencia: '3754', conta: '09412-0',
  },
  {
    apelido: 'IONÁ',
    nome: 'IONA IRITH DÁLIA JEIFETZ DAYAN',
    cpf: '118.675.858-98',
    creci: '257.382',
    banco: 'Bradesco (237)', agencia: '3539', conta: '61858-6',
    obs: 'Conta conjunta — titular: Alberto Dayan, CPF 034.054.828-28',
  },
  {
    apelido: 'ISSEA',
    nome: 'ISSEA STEINIC ROSENBERG',
    cpf: '266.517.258-58',
    creci: '078.292',
    banco: 'Caixa Econômica Federal (104)', agencia: '4128', conta: '000587427553-0',
  },
  {
    apelido: 'JAIMERX',
    nome: 'JAIMERX IMOBILIÁRIA LTDA',
    cnpj: '63.271.809/0001-78',
    creci: '51586-J',
    banco: 'Itaú (341)', agencia: '0186', conta: '98808-5',
    pix: '63.271.809/0001-78', pixTipo: 'CNPJ',
  },
  {
    apelido: 'KOBI',
    nome: 'JACK HAZAN',
    cpf: '591.689.609-59',
    creci: '315252',
    banco: 'Nubank (260)', agencia: '0001', conta: '29201321-0',
  },
  {
    apelido: 'JOÃO EDUARDO',
    nome: 'JOÃO EDUARDO CRISOSTOMOS DOMINGUES',
    cpf: '117.087.048-17',
    creci: '000.230',
    banco: 'Nubank (260)', agencia: '0001', conta: '87800459-9',
    pix: '11 96589-3436', pixTipo: 'celular',
  },
  {
    apelido: 'LINDA',
    nome: 'LINDA AIRES STANCKA E SILVA',
    cpf: '075.745.938-25',
    creci: '281979-F',
    banco: 'Itaú (341)', agencia: '7057', conta: '29766-0',
  },
  {
    apelido: 'LISA',
    nome: 'LISA PESSO',
    cpf: '247.518.708-58',
    creci: '###',
    banco: 'Itaú (341)', agencia: '7057', conta: '01310-9',
    obs: 'CRECI pendente de atualização',
  },
  {
    apelido: 'LUCIA',
    nome: 'LUCIA MARIA DE LUCCA MORAIS',
    cpf: '258.817.348-90',
    creci: '073.075',
    banco: 'Itaú (341)', agencia: '7057', conta: '02087-2',
  },
  {
    apelido: 'LUZIA',
    nome: 'LUZIA MARIA COSTA E SILVA',
    cpf: '213.771.998-35',
    creci: '086.971',
    banco: 'Itaú (341)', agencia: '0429', conta: '03575-1',
  },
  {
    apelido: 'MARIA',
    nome: 'MPARK IMOVEIS LTDA - EPP',
    cnpj: '34.331.623/0001-69',
    creci: '34.459-J',
    banco: 'C6 (336)', agencia: '0001', conta: '29019131-9',
  },
  {
    apelido: 'MARKOVITS',
    nome: 'MARKOVITS NEGÓCIOS IMOBILIÁRIOS LTDA',
    cnpj: '27.128.128/0001-91',
    creci: '—',
    banco: 'C6 Bank (336)', agencia: '0001', conta: '6514930-0',
    pix: '27.128.128/0001-91', pixTipo: 'CNPJ',
  },
  {
    apelido: 'MARLY',
    nome: 'MARLY COIN CHEHEBAR',
    cpf: '148.410.148-02',
    creci: '090.323',
    banco: 'Itaú (341)', agencia: '9097', conta: '43180-4',
  },
  {
    apelido: 'MATHILDE',
    nome: 'MATHILDE AJBESZYC',
    cpf: '157.714.308-62',
    creci: '093.200',
    banco: 'Itaú (341)', agencia: '9265', conta: '00849-1',
  },
  {
    apelido: 'MICHELE',
    nome: 'COLETTE MICHELE NASSI',
    cpf: '076.901.438-06',
    creci: '318437-F',
    banco: 'Banco do Brasil (001)', agencia: '0712-9', conta: '105266-7',
  },
  {
    apelido: 'MIKA',
    nome: 'MIRIAM STAROSTA WAJS',
    cpf: '448.501.660-91',
    creci: '134.048',
    banco: 'Itaú (341)', agencia: '3005', conta: '42045-4',
    obs: 'Conta de titularidade de Jairo Wajs – CPF: 060.861.888-82',
  },
  {
    apelido: 'MIRIAM',
    nome: 'KAC SERVIÇOS ADMINISTRATIVOS E IMOBILIÁRIOS LTDA',
    cnpj: '07.116.278/0001-78',
    creci: '27.038-J',
    banco: 'Inter (077)', agencia: '0001', conta: '9643168-7',
  },
  {
    apelido: 'MONICA',
    nome: 'MONICA IVONE BOCK DE CAMPOS',
    cpf: '012.521.468-50',
    creci: '208.882',
    banco: 'Bradesco (237)', agencia: '1449', conta: '735322-7',
  },
  {
    apelido: 'MOUSSY',
    nome: 'MOUSSA DIWAN',
    cpf: '034.971.358-87',
    creci: '150.697',
    banco: 'Bradesco (237)', agencia: '114', conta: '5503-4',
  },
  {
    apelido: 'NATALIE',
    nome: 'NATALIE IVY DOUER',
    cpf: '418.809.318-85',
    creci: '296.827',
    banco: 'Itaú (341)', agencia: '0428', conta: '66187-0',
  },
  {
    apelido: 'PAULINA',
    nome: 'PAULINA EJNISMAN',
    cpf: '764.020.458-53',
    creci: '066.779',
    banco: 'Bradesco (237)', agencia: '0136-8', conta: '142205-7',
  },
  {
    apelido: 'RAQUEL HOCHMAN',
    nome: 'RAQUEL ESTHER HOCHMAN',
    cpf: '262.656.908-92',
    creci: '243.885',
    banco: 'Nubank (260)', agencia: '0001', conta: '46711152-5',
  },
  {
    apelido: 'RENATA DICHY',
    nome: 'RENATA DICHY GROSMAN',
    cpf: '279.952.508-35',
    creci: '312154-F',
    banco: 'Inter (077)', agencia: '0001', conta: '0186533454',
    pix: '279.952.508-35', pixTipo: 'CPF',
  },
  {
    apelido: 'ROSELY / SAMANTHA',
    nome: 'MAZAL SERVIÇOS ADMINISTRATIVOS E IMOBILIÁRIOS LTDA',
    cnpj: '52.349.598/0001-22',
    creci: '—',
    banco: 'Inter (077)', agencia: '1', conta: '36.661.614-5',
  },
  {
    apelido: 'TANIA',
    nome: 'OSHER CONSULTORIA IMOBILIÁRIA LTDA',
    cnpj: '42.169.309/0001-50',
    creci: '—',
    banco: 'Inter (077)', agencia: '0001', conta: '13821064-0',
    obs: 'CRECI pendente de atualização',
  },
  {
    apelido: 'WAGNER',
    nome: 'WAGNER LOPES TRIANI',
    cpf: '142.488.498-52',
    creci: '225.892-F',
    banco: 'Nubank (260)', agencia: '0001', conta: '78104545-9',
    pix: 'triani.wagner@gmail.com', pixTipo: 'e-mail',
  },
  {
    apelido: 'ZULEICA',
    nome: 'ZULEICA CRACOVSKY CHAZANAS',
    cpf: '089.542.778-88',
    creci: '078.122',
    banco: 'Bradesco (237)', agencia: '0889-3', conta: '0002047-8',
  },
]

/**
 * Busca corretores por apelido, nome ou CPF/CNPJ
 * Retorna matches ordenados por relevância
 */
export function buscarCorretor(query: string): Corretor[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase().trim()
  return CORRETORES.filter(c =>
    c.apelido.toLowerCase().includes(q) ||
    c.nome.toLowerCase().includes(q) ||
    c.cpf?.includes(q) ||
    c.cnpj?.includes(q)
  ).slice(0, 8)
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
