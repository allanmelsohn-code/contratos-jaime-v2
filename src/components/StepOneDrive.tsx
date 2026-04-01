'use client'

import { useState } from 'react'
import { FileText, Paperclip, ClipboardList, Settings, Search, AlertTriangle, CheckCircle2, Folder, Bot } from 'lucide-react'
import type { FileInfo, ExtractedDoc } from '@/lib/types'

const FILE_CONVENTION = [
  { example: 'RG-locador1.jpg', desc: 'RG do locador' },
  { example: 'RG-locatario1.jpg', desc: 'RG do locatário' },
  { example: 'RG-locatario2.jpg', desc: 'Cônjuge/companheiro' },
  { example: 'CNH-locatario1.jpg', desc: 'CNH (alternativa ao RG)' },
  { example: 'passaporte-locatario1.jpg', desc: 'Passaporte (estrangeiro)' },
  { example: 'RG-fiador1.jpg', desc: 'RG do fiador' },
  { example: 'RG-conjuge-fiador1.jpg', desc: 'Cônjuge do fiador' },
  { example: 'CNPJ-locatario1.pdf', desc: 'CNPJ (PJ)' },
  { example: 'comprovante-locador1.jpg', desc: 'Comprovante endereço' },
  { example: 'banco-locador1.jpg', desc: 'Dados bancários' },
  { example: 'matricula-imovel.pdf', desc: 'Matrícula do imóvel' },
  { example: 'titulo-capitalizacao.pdf', desc: 'Título capitalização' },
  { example: 'apolice-seguro.pdf', desc: 'Apólice seguro fiança' },
]

function fileIcon(mime: string) {
  if (mime.includes('pdf')) return <FileText size={20} />
  if (mime.includes('image')) return <FileText size={20} />
  return <Paperclip size={20} />
}

function roleBadge(name: string) {
  const l = name.toLowerCase()
  if (l.includes('locador')) return { label: 'Locador', bg: '#FEF3C7', color: '#92400E' }
  if (l.includes('locatario')) return { label: 'Locatário', bg: '#DBEAFE', color: '#1E40AF' }
  if (l.includes('fiador')) return { label: 'Fiador', bg: '#EDE9FE', color: '#5B21B6' }
  if (l.includes('imovel') || l.includes('matricula')) return { label: 'Imóvel', bg: '#DCFCE7', color: '#166534' }
  return null
}

interface Props {
  folderUrl: string; setFolderUrl: (v: string) => void
  files: FileInfo[]; setFiles: (v: FileInfo[]) => void
  docs: ExtractedDoc[]; setDocs: (v: ExtractedDoc[]) => void
  onNext: () => void
}

export default function StepOneDrive({ folderUrl, setFolderUrl, files, setFiles, docs, setDocs, onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [ocrRunning, setOcrRunning] = useState(false)
  const [error, setError] = useState('')
  const [folderName, setFolderName] = useState('')
  const [showConv, setShowConv] = useState(false)

  async function loadFolder() {
    if (!folderUrl.trim()) return
    setLoading(true); setError(''); setFiles([]); setDocs([])
    try {
      const res = await fetch(`/api/onedrive?url=${encodeURIComponent(folderUrl.trim())}`)
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || `Erro ${res.status}`); return }
      setFiles(data.files); setFolderName(data.folderName)
      setDocs(data.files.map((f: FileInfo) => ({
        filename: f.name, classification: { type: '—', role: '—', index: 1, extractFields: [] },
        extracted: {}, status: 'pending' as const,
      })))
    } catch (e: any) { setError(`Erro: ${e.message}`) }
    finally { setLoading(false) }
  }

  async function runOCR() {
    if (!files.length) return
    setOcrRunning(true)
    const nd = [...docs]
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (!f.mimeType.includes('image') && !f.mimeType.includes('pdf')) {
        nd[i] = { ...nd[i], status: 'error', error: 'Tipo não suportado' }; setDocs([...nd]); continue
      }
      nd[i] = { ...nd[i], status: 'loading' }; setDocs([...nd])
      try {
        const res = await fetch('/api/ocr', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: f.name, downloadUrl: f.downloadUrl }),
        })
        const data = await res.json()
        nd[i] = !res.ok || data.error
          ? { ...nd[i], status: 'error', error: data.error || 'Erro na extração' }
          : { filename: data.filename, classification: data.classification, extracted: data.extracted, status: 'done' }
      } catch (e: any) { nd[i] = { ...nd[i], status: 'error', error: e.message } }
      setDocs([...nd])
    }
    setOcrRunning(false)
  }

  const allDone = docs.length > 0 && docs.every(d => d.status === 'done' || d.status === 'error')
  const doneCount = docs.filter(d => d.status === 'done').length

  return (
    <div>
      <div className="j-eyebrow">Passo 1 de 4</div>
      <h1 className="j-title">Leitura de Documentos via OneDrive</h1>
      <p className="j-desc">Cole o link da pasta compartilhada do OneDrive com os documentos renomeados. O sistema lista os arquivos e extrai os dados automaticamente via Claude Vision.</p>

      {/* Convenção */}
      <div className="j-card">
        <button onClick={() => setShowConv(!showConv)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', padding:0 }}>
          <span style={{ fontWeight:600, fontSize:13, color:'var(--ink)', display:'flex', alignItems:'center', gap:6 }}><ClipboardList size={13} /> Convenção de nomes de arquivo</span>
          <span style={{ fontSize:11, color:'var(--ink-f)' }}>{showConv ? 'Fechar ↑' : 'Ver ↓'}</span>
        </button>
        {showConv && (
          <div className="j-conv-grid">
            {FILE_CONVENTION.map(c => (
              <div key={c.example} className="j-conv-item">
                <code>{c.example}</code>
                <span>{c.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* URL */}
      <div className="j-card">
        <div className="j-card-title">Link da pasta OneDrive</div>
        <div style={{ display:'flex', gap:10 }}>
          <input type="url" value={folderUrl} className="j-input" style={{ flex:1, fontFamily:'DM Mono,monospace', fontSize:12 }}
            onChange={e => setFolderUrl(e.target.value)} onKeyDown={e => e.key==='Enter' && loadFolder()}
            placeholder="https://1drv.ms/f/... ou link SharePoint" />
          <button onClick={loadFolder} disabled={loading || !folderUrl.trim()} className="j-btn j-btn-ink">
            {loading ? <><Settings size={13} className="j-spin" style={{ display:'inline', verticalAlign:'middle' }} /> Carregando...</> : <><Search size={13} style={{ display:'inline', verticalAlign:'middle', marginRight:4 }} />Carregar</>}
          </button>
        </div>
        {error && <div style={{ marginTop:10, padding:'9px 13px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:7, fontSize:12, color:'#991B1B', display:'flex', alignItems:'center', gap:6 }}><AlertTriangle size={13} /> {error}</div>}
      </div>

      {/* Files */}
      {files.length > 0 && (
        <div className="j-card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:6 }}>
              <Folder size={14} /> {folderName} <span style={{ color:'var(--ink-f)', fontWeight:400, fontSize:12 }}>· {files.length} arquivo{files.length>1?'s':''}</span>
            </div>
            <button onClick={runOCR} disabled={ocrRunning||allDone} className="j-btn j-btn-gold" style={{ fontSize:12 }}>
              {ocrRunning ? <><Settings size={12} className="j-spin" style={{ display:'inline', verticalAlign:'middle', marginRight:4 }} />Extraindo...</>
                : allDone ? <><CheckCircle2 size={12} style={{ display:'inline', verticalAlign:'middle', marginRight:4 }} />{doneCount}/{files.length} extraídos</>
                : <><Bot size={12} style={{ display:'inline', verticalAlign:'middle', marginRight:4 }} />Extrair com Claude Vision</>}
            </button>
          </div>
          {files.map((file, i) => {
            const doc = docs[i]; const badge = roleBadge(file.name)
            return (
              <div key={file.id} className="j-file-item">
                <span style={{ fontSize:20 }}>{fileIcon(file.mimeType)}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                    <span className="j-file-name">{file.name}</span>
                    {badge && <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10, fontWeight:500, background:badge.bg, color:badge.color }}>{badge.label}</span>}
                  </div>
                  <div className="j-file-meta">{(file.size/1024).toFixed(0)} KB</div>
                </div>
                <div style={{ flexShrink:0 }}>
                  {!doc||doc.status==='pending' ? <span className="j-file-meta">Aguardando</span>
                    : doc.status==='loading' ? <span className="j-file-status-loading" style={{ display:'flex', alignItems:'center', gap:4 }}><Settings size={12} className="j-spin" /> Lendo…</span>
                    : doc.status==='done' ? <span className="j-file-status-ok" style={{ display:'flex', alignItems:'center', gap:4 }}><CheckCircle2 size={12} /> {doc.classification.type}</span>
                    : <span className="j-file-status-err" style={{ display:'flex', alignItems:'center', gap:4 }}><AlertTriangle size={12} /> {doc.error}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="j-btn-row">
        <span style={{ fontSize:12, color:'var(--sage)', display:'flex', alignItems:'center', gap:5 }}>
          {allDone && doneCount > 0 && <><CheckCircle2 size={12} /> {doneCount} documento{doneCount>1?'s':''} extraído{doneCount>1?'s':''}</>}
        </span>
        <button onClick={onNext} className="j-btn j-btn-gold">Revisar Dados →</button>
      </div>
    </div>
  )
}
