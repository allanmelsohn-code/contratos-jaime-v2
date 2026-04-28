'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    // Busca papel e tenant do usuário
    const { data: papUser, error: papErr } = await supabase
      .from('papaia_users')
      .select('role, tenant:papaia_tenants(slug)')
      .eq('id', data.user.id)
      .single()

    if (papErr || !papUser) {
      setErro('Usuário sem permissão configurada. Contate o administrador.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (papUser.role === 'superadmin') {
      router.push('/admin')
    } else {
      const slug = (papUser.tenant as any)?.slug
      if (!slug) {
        setErro('Usuário sem imobiliária associada. Contate o administrador.')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }
      router.push(`/${slug}`)
    }
  }

  return (
    <div className="p-login-bg">
      <div className="p-login-card">
        {/* Logo */}
        <svg className="p-logo-mark" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" rx="44" fill="#FAF6F1"/>
          <ellipse cx="70" cy="80" rx="80" ry="75" fill="#E8735A" opacity="0.92"/>
          <ellipse cx="145" cy="130" rx="70" ry="65" fill="#8BAD8B" opacity="0.85"/>
          <ellipse cx="160" cy="55" rx="45" ry="40" fill="#F0A030" opacity="0.55"/>
          <polygon points="100,57 148,92 52,92" fill="white" opacity="0.95"/>
          <rect x="70" y="92" width="60" height="44" fill="white" opacity="0.95"/>
          <rect x="89" y="108" width="22" height="28" rx="3" fill="#E8735A" opacity="0.5"/>
        </svg>

        <h1 className="p-login-title">Papaia</h1>
        <p className="p-login-sub">A.I. made as &ldquo;mamão com açúcar&rdquo;</p>

        {erro && <div className="p-error">{erro}</div>}

        <form onSubmit={handleLogin}>
          <div className="p-field">
            <label className="p-label">Email</label>
            <input
              className="p-input"
              type="email"
              placeholder="seu@email.com.br"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="p-field">
            <label className="p-label">Senha</label>
            <input
              className="p-input"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>
          <button className="p-btn-login" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="p-tagline">
          Gestão de contratos inteligente para imobiliárias
        </p>
      </div>
    </div>
  )
}
