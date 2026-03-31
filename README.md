# Jaime · Gerador de Contratos

Sistema interno de geração de contratos de locação com leitura automática de documentos via OneDrive.

## Fluxo

1. **OneDrive** — cole o link da pasta pública com os documentos renomeados
2. **OCR** — Claude Vision extrai dados de cada documento automaticamente  
3. **Contrato** — preencha/revise os dados, configure garantia e cláusulas
4. **Gerar** — baixe o `.docx` ou envie para DocuSign

## Convenção de nomes de arquivo

| Arquivo | Descrição |
|---------|-----------|
| `RG-locador1.jpg` | RG do locador (número indica qual, se múltiplos) |
| `RG-locatario1.jpg` | RG do locatário |
| `CNH-locador1.jpg` | CNH do locador |
| `CNH-locatario1.jpg` | CNH do locatário |
| `passaporte-locatario1.jpg` | Passaporte |
| `CNPJ-locatario1.pdf` | CNPJ para locatário PJ |
| `matricula-imovel.pdf` | Certidão de matrícula do imóvel |
| `comprovante-locador1.jpg` | Comprovante de endereço |
| `RG-fiador1.jpg` | RG do fiador |
| `RG-conjuge1.jpg` | RG do cônjuge do fiador |

## Setup local

```bash
npm install
npm run dev
```

## Deploy na Vercel

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

## Variáveis de ambiente (configurar na Vercel)

```
ANTHROPIC_API_KEY=sk-ant-...
DOCUSIGN_ACCOUNT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DOCUSIGN_ACCESS_TOKEN=eyJ...
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi   # trocar para produção
```

Para obter o token DocuSign:
- Crie uma conta em https://developers.docusign.com
- Crie um app em https://admindemo.docusign.com/apps-and-keys
- Use o fluxo OAuth 2.0 JWT ou Authorization Code

## Estrutura do projeto

```
app/
  page.tsx                    # página principal + estado global
  layout.tsx
  globals.css
  api/
    onedrive/route.ts         # lista arquivos da pasta OneDrive pública
    ocr/route.ts              # Claude Vision OCR por arquivo
    gerar-contrato/route.ts   # gera .docx com docx-js
    docusign/route.ts         # cria envelope DocuSign

src/components/
  StepOneDrive.tsx            # passo 1: link + listagem + OCR
  StepReview.tsx              # passo 2: revisão dos dados extraídos
  StepContrato.tsx            # passo 3: dados do contrato
  StepGerar.tsx               # passo 4: assinaturas + download + DocuSign
```

## Modelos de contrato suportados

- **Fiador** — cláusulas arts. 835–838 CC, cônjuge/convivente obrigatório se casado
- **Depósito Caução** — máx. 3 meses, remunerado a 100% CDI
- **Título de Capitalização** — Porto Seguro Capitalização S.A. ou outra
- **Seguro Fiança** — Porto, Tokio Marine, Too ou outra
