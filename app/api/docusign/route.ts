// app/api/docusign/route.ts
// Creates a DocuSign envelope from the generated contract
// Docs: https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopes/create/

export const runtime = 'nodejs'
export const maxDuration = 30

import { createClient } from '@lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { signatarios, assunto, mensagem, contractBase64 } = body

  const dsAccountId = process.env.DOCUSIGN_ACCOUNT_ID
  const dsToken = process.env.DOCUSIGN_ACCESS_TOKEN
  const dsBase = process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi'

  if (!dsAccountId || !dsToken) {
    return Response.json({
      error: 'DocuSign credentials not configured',
      hint: 'Set DOCUSIGN_ACCOUNT_ID and DOCUSIGN_ACCESS_TOKEN in Vercel env vars',
    }, { status: 500 })
  }

  // Build signers array from signatarios
  // Each has: nome, email, role, order
  const signers = signatarios.map((s: any, i: number) => ({
    email: s.email,
    name: s.nome,
    recipientId: String(i + 1),
    routingOrder: String(i + 1),
    roleName: s.role,
    tabs: {
      signHereTabs: [{
        documentId: '1',
        pageNumber: '999', // last page — DocuSign will find or create
        recipientId: String(i + 1),
        tabLabel: `signature_${i + 1}`,
        anchorString: s.nome.substring(0, 20), // anchor by name in signature block
        anchorUnits: 'pixels',
        anchorYOffset: '-10',
        anchorIgnoreIfNotPresent: 'true',
      }],
    },
  }))

  const envelopeDefinition = {
    emailSubject: assunto || 'Contrato de Locação · Jaime Imobiliária',
    emailBlurb: mensagem || 'Por gentileza, assine digitalmente o Contrato de Locação em anexo.',
    documents: [{
      documentBase64: contractBase64,
      name: 'Contrato de Locação - Jaime Imobiliária.docx',
      fileExtension: 'docx',
      documentId: '1',
    }],
    recipients: { signers },
    status: 'sent', // 'created' to save as draft, 'sent' to send immediately
  }

  const response = await fetch(
    `${dsBase}/v2.1/accounts/${dsAccountId}/envelopes`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dsToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelopeDefinition),
    }
  )

  if (!response.ok) {
    const err = await response.json()
    return Response.json({
      error: `DocuSign API error: ${response.status}`,
      detail: err,
    }, { status: response.status })
  }

  const result = await response.json()

  return Response.json({
    success: true,
    envelopeId: result.envelopeId,
    status: result.status,
    uri: result.uri,
  })
}
