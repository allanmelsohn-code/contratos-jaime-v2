-- ════════════════════════════════════════════════════════════
-- Seed: Corretores Jaime — execute UMA VEZ no SQL Editor
-- Ajuste o slug 'jaime' se o tenant tiver outro slug
-- ════════════════════════════════════════════════════════════

-- 1. Garantir colunas necessárias existem
ALTER TABLE papaia_corretores
  ADD COLUMN IF NOT EXISTS apelido   TEXT,
  ADD COLUMN IF NOT EXISTS cnpj      TEXT,
  ADD COLUMN IF NOT EXISTS "pixTipo" TEXT,
  ADD COLUMN IF NOT EXISTS obs       TEXT;

-- 2. Inserir todos os corretores
INSERT INTO papaia_corretores
  (tenant_id, apelido, nome, cpf, cnpj, creci, banco, agencia, conta, pix, "pixTipo", obs, ativo)
SELECT
  (SELECT id FROM papaia_tenants WHERE slug = 'jaime'),
  v.apelido, v.nome, v.cpf, v.cnpj, v.creci, v.banco, v.agencia, v.conta, v.pix, v.pixTipo, v.obs, true
FROM (VALUES
  ('ADRIANO',         'ADRIANO COUTO PINHEIRO BLANCO',                   '682.718.825-34', NULL,                   '197.117',    'Itaú (341)',          '7043',   '52661-0',      NULL,                       NULL,     NULL),
  ('ALAIN',           'ALAIN BAROUKH',                                   '125.039.408-20', NULL,                   '159.562',    'Banco do Brasil (001)','0719',  '15823-2',      NULL,                       NULL,     NULL),
  ('ANDRÉ GRIMBERG',  'André Grimberg',                                   '403.527.758-40', NULL,                   '216620',     'Itaú (341)',          '1035',   '32378-9',      'grimberg.andre@gmail.com', 'e-mail', NULL),
  ('CARLA ANGRISANI', 'CARLA ANGRISANI ALVES DE OLIVEIRA',               '083.630.918-98', NULL,                   '176.941',    'Bradesco (237)',      '1431',   '50705-9',      '083.630.918-98',           'CPF',    NULL),
  ('CILENE',          'ANTONIA CILENE MINEIRO',                          '396.806.903-00', NULL,                   '132.997',    'Santander (033)',     '3196',   '0100707-2',    NULL,                       NULL,     NULL),
  ('CECÍLIA',         'CECILIA ROSA MURACHOVSKY',                        '230.022.428-37', NULL,                   '082.161',    'Itaú (341)',          '9097',   '00725-7',      NULL,                       NULL,     NULL),
  ('CELIA LEWKOWICZ', 'CELIA LEWKOWICZ',                                  '064.289.948-79', NULL,                   '235.929-F',  'Santander (033)',     '0386',   '01035045-5',   NULL,                       NULL,     NULL),
  ('CÉLIA REGINA',    'CELIA REGINA REIS ATHAYDE FERNANDES',             '269.594.508-61', NULL,                   '156.085',    'Nubank (260)',        '0001',   '95706285-5',   NULL,                       NULL,     NULL),
  ('COLETTE',         'COLETTE ROISTACHER',                              '156.982.478-97', NULL,                   '162.735',    'Itaú (341)',          '428',    '43085-4',      NULL,                       NULL,     NULL),
  ('CREUSA',          'CREUSA ALMEIDA DE JESUS SOUZA',                   '090.546.118-55', NULL,                   '048.741',    'Banco do Brasil (001)','1191-6','40001-7',      NULL,                       NULL,     NULL),
  ('DAL',             'ADALGISA MEDEIROS DA SILVA',                      '048.864.388-06', NULL,                   '228.438-F',  'Itaú (341)',          '0061',   '28307-3',      NULL,                       NULL,     NULL),
  ('DANIELLE',        'DANIELLE BENISTE SLOMOVIC',                       '154.209.637-52', NULL,                   '299054',     'Bradesco (237)',      '0226-7', '0166028-4',    '154.209.637-52',           'CPF',    NULL),
  ('DEBORA',          'DEBORA MELSOHN',                                  NULL,             NULL,                   '160112',     NULL,                  NULL,     NULL,           NULL,                       NULL,     'Dados bancários incompletos'),
  ('EDUARDO LAPIDUS', 'LAPIDUS E GRIMBERG IMOVEIS LTDA - ME',            NULL,             '21.859.701/0001-50',   '26889-J',    'Itaú (341)',          '0061',   '07343-3',      NULL,                       NULL,     NULL),
  ('FLAVIA',          'FLAVIA TONELLO',                                  '818.603.310-68', NULL,                   '165.673-F',  'Nubank (260)',        '0001',   '42022003-7',   NULL,                       NULL,     NULL),
  ('FRANCISCO',       'FRANCISCO GILMARIO DE OLIVEIRA MEDEIROS',         '770.504.108-10', NULL,                   '078.150',    'Bradesco (237)',      '0119-8', '0220146-1',    NULL,                       NULL,     NULL),
  ('GABRIEL',         'GABRIEL BUENO DE ALMEIDA LTDA',                   NULL,             '57.676.781/0001-56',   '48103-J',    'C6 (336)',            '0001',   '34959925-4',   NULL,                       NULL,     NULL),
  ('GISELA',          'SUNG WON PARK (Gisela)',                          '185.119.548-30', NULL,                   '262.738-F',  'C6 (336)',            '0001',   '28027061-5',   NULL,                       NULL,     NULL),
  ('GLAUCIA',         'GLAUCIA APARECIDA DA SILVA DAMASCENO',            '280.106.788-13', NULL,                   '277682',     'C6 (336)',            '0001',   '21772806-5',   NULL,                       NULL,     NULL),
  ('ILANA',           'ILANA MARION AJZENBERG',                          '100.421.628-90', NULL,                   '154.241',    'Itaú (341)',          '3754',   '09412-0',      NULL,                       NULL,     NULL),
  ('IONÁ',            'IONA IRITH DÁLIA JEIFETZ DAYAN',                  '118.675.858-98', NULL,                   '257.382',    'Bradesco (237)',      '3539',   '61858-6',      NULL,                       NULL,     'Conta conjunta — Alberto Dayan CPF 034.054.828-28'),
  ('ISSEA',           'ISSEA STEINIC ROSENBERG',                         '266.517.258-58', NULL,                   '078.292',    'Caixa (104)',         '4128',   '000587427553-0',NULL,                      NULL,     NULL),
  ('KOBI',            'JACK HAZAN',                                      '591.689.609-59', NULL,                   '315252',     'Nubank (260)',        '0001',   '29201321-0',   NULL,                       NULL,     NULL),
  ('JOÃO EDUARDO',    'JOÃO EDUARDO CRISOSTOMOS DOMINGUES',              '117.087.048-17', NULL,                   '000.230',    'Nubank (260)',        '0001',   '87800459-9',   '11 96589-3436',            'celular',NULL),
  ('LINDA',           'LINDA AIRES STANCKA E SILVA',                     '075.745.938-25', NULL,                   '281979-F',   'Itaú (341)',          '7057',   '29766-0',      NULL,                       NULL,     NULL),
  ('LISA',            'LISA PESSO',                                      '247.518.708-58', NULL,                   '###',        'Itaú (341)',          '7057',   '01310-9',      NULL,                       NULL,     'CRECI pendente'),
  ('LUCIA',           'LUCIA MARIA DE LUCCA MORAIS',                     '258.817.348-90', NULL,                   '073.075',    'Itaú (341)',          '7057',   '02087-2',      NULL,                       NULL,     NULL),
  ('LUZIA',           'LUZIA MARIA COSTA E SILVA',                       '213.771.998-35', NULL,                   '086.971',    'Itaú (341)',          '0429',   '03575-1',      NULL,                       NULL,     NULL),
  ('MARIA',           'MPARK IMOVEIS LTDA - EPP',                        NULL,             '34.331.623/0001-69',   '34.459-J',   'C6 (336)',            '0001',   '29019131-9',   NULL,                       NULL,     NULL),
  ('MARKOVITS',       'MARKOVITS NEGÓCIOS IMOBILIÁRIOS LTDA',            NULL,             '27.128.128/0001-91',   '—',          'C6 Bank (336)',       '0001',   '6514930-0',    '27.128.128/0001-91',       'CNPJ',   NULL),
  ('MARLY',           'MARLY COIN CHEHEBAR',                             '148.410.148-02', NULL,                   '090.323',    'Itaú (341)',          '9097',   '43180-4',      NULL,                       NULL,     NULL),
  ('MATHILDE',        'MATHILDE AJBESZYC',                               '157.714.308-62', NULL,                   '093.200',    'Itaú (341)',          '9265',   '00849-1',      NULL,                       NULL,     NULL),
  ('MICHELE',         'COLETTE MICHELE NASSI',                           '076.901.438-06', NULL,                   '318437-F',   'Banco do Brasil (001)','0712-9','105266-7',     NULL,                       NULL,     NULL),
  ('MIKA',            'MIRIAM STAROSTA WAJS',                            '448.501.660-91', NULL,                   '134.048',    'Itaú (341)',          '3005',   '42045-4',      NULL,                       NULL,     'Conta de Jairo Wajs CPF 060.861.888-82'),
  ('MIRIAM',          'KAC SERVIÇOS ADMINISTRATIVOS E IMOBILIÁRIOS LTDA',NULL,             '07.116.278/0001-78',   '27.038-J',   'Inter (077)',         '0001',   '9643168-7',    NULL,                       NULL,     NULL),
  ('MONICA',          'MONICA IVONE BOCK DE CAMPOS',                     '012.521.468-50', NULL,                   '208.882',    'Bradesco (237)',      '1449',   '735322-7',     NULL,                       NULL,     NULL),
  ('MOUSSY',          'MOUSSA DIWAN',                                    '034.971.358-87', NULL,                   '150.697',    'Bradesco (237)',      '114',    '5503-4',       NULL,                       NULL,     NULL),
  ('NATALIE',         'NATALIE IVY DOUER',                               '418.809.318-85', NULL,                   '296.827',    'Itaú (341)',          '0428',   '66187-0',      NULL,                       NULL,     NULL),
  ('PAULINA',         'PAULINA EJNISMAN',                                '764.020.458-53', NULL,                   '066.779',    'Bradesco (237)',      '0136-8', '142205-7',     NULL,                       NULL,     NULL),
  ('RAQUEL HOCHMAN',  'RAQUEL ESTHER HOCHMAN',                           '262.656.908-92', NULL,                   '243.885',    'Nubank (260)',        '0001',   '46711152-5',   NULL,                       NULL,     NULL),
  ('RENATA DICHY',    'RENATA DICHY GROSMAN',                            '279.952.508-35', NULL,                   '312154-F',   'Inter (077)',         '0001',   '0186533454',   '279.952.508-35',           'CPF',    NULL),
  ('ROSELY/SAMANTHA', 'MAZAL SERVIÇOS ADMINISTRATIVOS E IMOBILIÁRIOS LTDA',NULL,           '52.349.598/0001-22',   '—',          'Inter (077)',         '1',      '36.661.614-5', NULL,                       NULL,     NULL),
  ('TANIA',           'OSHER CONSULTORIA IMOBILIÁRIA LTDA',              NULL,             '42.169.309/0001-50',   '—',          'Inter (077)',         '0001',   '13821064-0',   NULL,                       NULL,     'CRECI pendente'),
  ('WAGNER',          'WAGNER LOPES TRIANI',                             '142.488.498-52', NULL,                   '225.892-F',  'Nubank (260)',        '0001',   '78104545-9',   'triani.wagner@gmail.com',  'e-mail', NULL),
  ('ZULEICA',         'ZULEICA CRACOVSKY CHAZANAS',                      '089.542.778-88', NULL,                   '078.122',    'Bradesco (237)',      '0889-3', '0002047-8',    NULL,                       NULL,     NULL)
) AS v(apelido, nome, cpf, cnpj, creci, banco, agencia, conta, pix, pixTipo, obs);
