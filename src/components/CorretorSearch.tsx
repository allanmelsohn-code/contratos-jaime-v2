'use client'

import { useState, useRef, useEffect } from 'react'
import { buscarCorretor, type Corretor } from '@/lib/corretores'

interface Props {
  value: string
  onChange: (nome: string) => void
  onSelect: (c: Corretor) => void
  placeholder?: string
}

export default function CorretorSearch({ value, onChange, onSelect, placeholder }: Props) {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Corretor[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleInput(v: string) {
    onChange(v)
    const r = buscarCorretor(v)
    setResults(r)
    setOpen(r.length > 0)
  }

  function pick(c: Corretor) {
    onChange(c.nome)
    onSelect(c)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={e => handleInput(e.target.value)}
        placeholder={placeholder || 'Digite o nome ou apelido do corretor'}
        className="j-input"
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'white', border: '1px solid var(--border-s)', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(26,22,18,.12)', marginTop: 4, overflow: 'hidden',
        }}>
          {results.map(c => (
            <button
              key={c.apelido}
              onClick={() => pick(c)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 14px', background: 'none', border: 'none',
                borderBottom: '1px solid var(--border)', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background .12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                {c.apelido}
                {c.obs && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--rust)', fontWeight: 400 }}>⚠️ {c.obs}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-f)', marginTop: 1 }}>
                {c.nome} · CRECI {c.creci} · {c.banco}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
