// api/onedrive/route.ts
// Reads a public OneDrive/SharePoint share link and returns file list + base64 contents
// No Azure app registration needed — uses the anonymous share token endpoint

export const runtime = 'nodejs'

import { createClient } from '@/../../lib/supabase/server'

/**
 * Converts a OneDrive/SharePoint public share URL into a Graph API URL
 * Works with both personal OneDrive (1drv.ms) and SharePoint links
 *
 * Docs: https://learn.microsoft.com/en-us/graph/api/shares-get
 */
function shareUrlToGraphUrl(shareUrl: string): string {
  // Encode the share URL as base64url (Graph API shares endpoint format)
  const encoded = Buffer.from(shareUrl)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `https://graph.microsoft.com/v1.0/shares/u!${encoded}/driveItem/children`
}

function shareUrlToRootGraphUrl(shareUrl: string): string {
  const encoded = Buffer.from(shareUrl)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `https://graph.microsoft.com/v1.0/shares/u!${encoded}/driveItem`
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const shareUrl = searchParams.get('url')

  if (!shareUrl) {
    return Response.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try { new URL(shareUrl) } catch {
    return Response.json({ error: 'Invalid url parameter' }, { status: 400 })
  }

  try {
    // 1. Get folder metadata first
    const rootUrl = shareUrlToRootGraphUrl(shareUrl)
    const rootRes = await fetch(rootUrl, {
      headers: { 'Accept': 'application/json' }
    })

if (!rootRes.ok) {
  const status = rootRes.status
  const msg =
    status === 401
      ? 'Link não autorizado (401). Verifique se a pasta está compartilhada como pública no OneDrive: clique direito → Compartilhar → "Qualquer pessoa com o link".'
      : status === 404
      ? 'Pasta não encontrada (404). Verifique se o link está correto e ainda ativo.'
      : status === 403
      ? 'Acesso negado (403). O link pode ter expirado ou estar restrito. Gere um novo link de compartilhamento.'
      : `Erro OneDrive API: ${status}`

  return Response.json({ error: msg }, { status })
}

    const rootData = await rootRes.json()

    // 2. List children
    const childrenUrl = shareUrlToGraphUrl(shareUrl)
    const childrenRes = await fetch(childrenUrl, {
      headers: { 'Accept': 'application/json' }
    })

    if (!childrenRes.ok) {
      const err = await childrenRes.text()
      return Response.json(
        { error: `Could not list folder contents: ${childrenRes.status}`, detail: err },
        { status: childrenRes.status }
      )
    }

    const childrenData = await childrenRes.json()
    const items: any[] = childrenData.value || []

    // 3. For each file, get the download URL (not the content — content is fetched client-side or lazily)
    const files = items
      .filter((item: any) => !item.folder) // skip subfolders
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        mimeType: item.file?.mimeType || '',
        downloadUrl: item['@microsoft.graph.downloadUrl'] || null,
        lastModified: item.lastModifiedDateTime,
      }))

    return Response.json({
      folderName: rootData.name,
      fileCount: files.length,
      files,
    })

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
