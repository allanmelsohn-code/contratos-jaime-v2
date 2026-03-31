'use client'

import { useState, useCallback } from 'react'
import type { ExtractedDoc } from '@/lib/types'

const CONVENTION = [
  { ex: 'RG-locador1.jpg',                desc: 'RG do locador' },
  { ex: 'RG-locatario1.jpg',              desc: 'RG do locatário' },
  { ex: 'RG-locatario2.jpg',              desc: 'Cônjuge/companheiro' },
  { ex: 'CNH-locatario1.jpg',             desc: 'CNH (alternativa ao RG)' },
  { ex: 'passaporte-locatario1.jpg',      desc: 'Passaporte (estrangeiro)' },
  { ex: 'RG-fiador1.jpg',                 desc: 'RG do fiador' },
  { ex: 'RG-conjuge-fiador1.jpg',         desc: 'Cônjuge do fiador' },
  { ex: 'CNPJ-locatario1.pdf',            desc: 'CNPJ (PJ)' },
  { ex: 'contrato-social-locatario1.pdf', desc: 'Contrato Social (PJ)' },
  { ex: 'comprovante-locador1.jpg',       desc: 'Comprovante de endereço' },
  { ex: 'banco-locador1.jpg',             desc: 'Dados bancários (print)' },
  { ex: 'matricula-imovel.pdf',           desc: 'Matrícula do imóvel' },
  { ex: 'iptu-imovel.pdf',               desc: 'IPTU do imóvel' },
  { ex: 'titulo-capitalizacao.pdf',       desc: 'Título de capitalização' },
  { ex: 'apolice-seguro.pdf',            desc: 'Apólice seguro fiança' },
]

function roleBadge(name: string) {
  const l = name.toLowerCase()
  if (l.includes('locador'))                                                          return { label: 'Locador',   bg: '#FEF3C7', color: '#92400E' }
  if (l.includes('locatario') || l.includes('locatário'))                             return { label: 'Locatário', bg: '#DBEAFE', color: '#1E40AF' }
  if (l.includes('fiador'))                                                           return { label: 'Fiador',    bg: '#EDE9FE', color: '#5B21B6' }
  if (l.includes('imovel') || l.includes('imóvel') || l.includes('matricula') || l.includes('iptu')) return { label: 'Imóvel', bg: '#DCFCE7', color: '#166534' }
  if (l.includes('titulo') || l.includes('apolice') || l.includes('caucao'))         return { label: 'Garantia',  bg: '#FDF2F8', color: '#9D174D' }
  return null
}

function fileIcon(mime: string) {
  if (mime.includes('pdf'))   return '📄'
  if (mime.includes('image')) return '🖼️'
  return '📎'
}

interface LocalFile {
  id: string
  name: string
  size: number
  mimeType: string
  file: File
}

interface Props {
  docs: ExtractedDoc[]
  setDocs: (v: ExtractedDoc[]) => void
  onNext: () => void
}

export default function StepUpload({ docs, setDocs, onNext }: Props) {
  const [files, setFiles]         = useState<LocalFile[]>([])
  const [ocrRunning, setOcrRunning] = useState(false)
  const [showConv, setShowConv]   = useState(false)
  const [dragging, setDragging]   = useState(false)

  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming)
    const newFiles: LocalFile[] = arr.map(f => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      mimeType: f.type || (f.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      file: f,
    }))
    setFiles(prev => {
      const merged = [...prev]
      newFiles.forEach(nf => {
        if (!merged.find(e => e.name === nf.name)) merged.push(nf)
      })
      return merged
    })
    setDocs([])
  }

  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id))
    setDocs([])
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [])

  async function runOCR() {
    if (!files.length) return
    setOcrRunning(true)

    const nd: ExtractedDoc[] = files.map(f => ({
      filename: f.name,
      classification: { type: '—', role: '—', index: 1, extractFields: [] },
      extracted: {},
      status: 'pending' as const,
    }))
    setDocs([...nd])

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (!f.mimeType.includes('image') && !f.mimeType.includes('pdf')) {
        nd[i] = { ...nd[i], status: 'error', error: 'Tipo não suportado' }
        setDocs([...nd])
        continue
      }

      nd[i] = { ...nd[i], status: 'loading' }
      setDocs([...nd])

      try {
        const b64 = await toBase64(f.file)
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: f.name,
            imageBase64: b64,
            mimeType: f.mimeType,
          }),
        })
        const data = await res.json()
        nd[i] = !res.ok || data.error
          ? { ...nd[i], status: 'error', error: data.error || 'Erro na extração' }
          : { filename: data.filename, classification: data.classification, extracted: data.extracted, status: 'done' }
      } catch (e: any) {
        nd[i] = { ...nd[i], status: 'error', error: e.message }
      }
      setDocs([...nd])
    }
    setOcrRunning(false)
  }

  function toBase64(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader()
      r.onload  = () => res((r.result as string).split(',')[1])
      r.onerror = () => rej(new Error('read failed'))
      r.readAsDataURL(file)
    })
  }

  const allDone   = docs.length > 0 && docs.every(d => d.status === 'done' || d.status === 'error')
  const doneCount = docs.filter(d => d.status === 'done').length

  return (
    <div>
      <div className="j-eyebrow">Passo 1 de 4</div>
      <h1 className="j-title">Upload de Documentos</h1>
      <p className="j-desc">
        Renomeie os arquivos conforme a convenção abaixo e faça o upload.
        O Claude Vision extrai os dados automaticamente de cada documento.
      </p>

      {/* convenção */}
      <div className="j-card">
        <button
          onClick={() => setShowConv(v => !v)}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', padding:0 }}
        >
          <span style={{ fontWeight:600, fontSize:13, color:'var(--ink)' }}>📋 Convenção de nomes de arquivo</span>
          <span style={{ fontSize:11, color:'var(--ink-f)' }}>{showConv ? 'Fechar ↑' : 'Ver ↓'}</span>
        </button>
        {showConv && (
          <div className="j-conv-grid">
            {CONVENTION.map(c => (
              <div key={c.ex} className="j-conv-item">
                <code>{c.ex}</code>
                <span>{c.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* upload zone */}
      <div className="j-card">
        <div className="j-card-title">📁 Arquivos do Contrato</div>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('j-file-input')?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--gold)' : 'var(--border-s)'}`,
            borderRadius: 9, padding: '24px 16px', textAlign: 'center',
            cursor: 'pointer', transition: 'all .18s', marginBottom: 14,
            background: dragging ? 'rgba(184,134,11,.04)' : 'var(--cream)',
          }}
        >
          <input
            id="j-file-input" type="file" multiple accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
          <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
          <div style={{ fontSize: 13, color: 'var(--ink-m)' }}>
            <strong style={{ color: 'var(--gold)' }}>Clique para selecionar</strong> ou arraste os arquivos aqui
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-f)', marginTop: 4 }}>
            JPG · PNG · PDF — múltiplos arquivos de uma vez
          </div>
        </div>

        {files.length > 0 && (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>
                {files.length} arquivo{files.length > 1 ? 's' : ''} selecionado{files.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={runOCR}
                disabled={ocrRunning || allDone}
                className="j-btn j-btn-gold"
                style={{ fontSize: 12 }}
              >
                {ocrRunning
                  ? <><span className="j-spin">⚙️</span> Extraindo dados...</>
                  : allDone
                  ? `✅ ${doneCount}/${files.length} extraídos`
                  : '🤖 Extrair com Claude Vision'}
              </button>
            </div>

            {files.map((f, i) => {
              const doc   = docs[i]
              const badge = roleBadge(f.name)
              return (
                <div key={f.id} className="j-file-item">
                  <span style={{ fontSize: 20 }}>{fileIcon(f.mimeType)}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                      <span className="j-file-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {f.name}
                      </span>
                      {badge && (
                        <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10, fontWeight:500, background:badge.bg, color:badge.color }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <div className="j-file-meta">{(f.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:8 }}>
                    {!doc || doc.status === 'pending'
                      ? <span className="j-file-meta">Aguardando</span>
                      : doc.status === 'loading'
                      ? <span className="j-file-status-loading"><span className="j-spin">⚙️</span> Lendo…</span>
                      : doc.status === 'done'
                      ? <span className="j-file-status-ok">✅ {doc.classification.type} · {doc.classification.role}</span>
                      : <span className="j-file-status-err" title={doc.error}>⚠️ {doc.error}</span>}
                    {(!ocrRunning && (!doc || doc.status === 'pending')) && (
                      <button
                        onClick={() => removeFile(f.id)}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-f)', fontSize:14, padding:'2px 4px', lineHeight:1 }}
                        title="Remover arquivo"
                      >✕</button>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {files.length === 0 && (
          <div style={{ textAlign:'center', fontSize:12, color:'var(--ink-f)', padding:'4px 0' }}>
            Nenhum arquivo selecionado
          </div>
        )}
      </div>

      {/* v2 notice */}
      <div className="j-notice" style={{ background:'rgba(59,78,222,.05)', borderColor:'rgba(59,78,222,.2)', color:'#3B4EDE' }}>
        <span style={{ flexShrink:0 }}>🔗</span>
        <span>
          <strong>Em breve — integração OneDrive/SharePoint (v2):</strong> cole o link da pasta e o sistema carrega os arquivos automaticamente via Microsoft Graph API, sem upload manual.
        </span>
      </div>

      <div className="j-btn-row">
        <span style={{ fontSize:12, color:'var(--sage)' }}>
          {allDone && doneCount > 0 && `✅ ${doneCount} documento${doneCount > 1 ? 's' : ''} extraído${doneCount > 1 ? 's' : ''} com sucesso`}
        </span>
        <button onClick={onNext} className="j-btn j-btn-gold">
          Revisar Dados →
        </button>
      </div>
    </div>
  )
}
