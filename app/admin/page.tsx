'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@lib/supabase/client'
import {
  liberarTrial, ativarTenant, suspenderTenant,
  editarContador, resetarContador, criarTenant, criarUsuario
} from './actions'
import type { TenantConfig } from '@/lib/types'

type Modal =
  | { tipo: 'trial'; tenant: TenantConfig }
  | { tipo: 'contador'; tenant: TenantConfig }
  | { tipo: 'novo' }
  | { tipo: 'usuario'; tenant: TenantConfig }
  | null

export default function AdminPage() {
  const [tenants, setTenants] = useState<TenantConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Modal>(null)
  const [actionErro, setActionErro] = useState('')
  const [actionOk, setActionOk] = useState('')
  const [isPending, startTransition] = useTransition()

  function run(fn: () => Promise<{ error?: string }>, successMsg = 'Feito!') {
    setActionErro('')
    setActionOk('')
    startTransition(async () => {
      try {
        const result = await fn()
        if (result?.error) {
          setActionErro(result.error)
        } else {
          setActionOk(successMsg)
          setTimeout(() => setActionOk(''), 3000)
        }
      } catch (e: any) {
        setActionErro(e?.message || 'Erro desconhecido')
      }
    })
  }

  // Campos modais
  const [trialDias, setTrialDias] = useState(14)
  const [usados, setUsados] = useState(0)
  const [limite, setLimite] = useState(10)
  const [novoEmail, setNovoEmail] = useState('')
  const [novoSenha, setNovoSenha] = useState('')
  const [novoRole, setNovoRole] = useState<'admin' | 'user'>('user')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('papaia_tenants')
        .select('*')
        .order('created_at', { ascending: false })
      setTenants((data as TenantConfig[]) || [])
      setLoading(false)
    }
    load()
  }, [isPending])

  function badgeClass(status: string) {
    if (status === 'active') return 'p-badge p-badge-active'
    if (status === 'suspended') return 'p-badge p-badge-suspended'
    return 'p-badge p-badge-trial'
  }

  function badgeLabel(status: string) {
    if (status === 'active') return 'Ativo'
    if (status === 'suspended') return 'Suspenso'
    return 'Trial'
  }

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Header */}
      <header className="p-admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0 }} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="200" rx="44" fill="#FAF6F1"/>
              <ellipse cx="70" cy="80" rx="80" ry="75" fill="#E8735A" opacity="0.92"/>
              <ellipse cx="145" cy="130" rx="70" ry="65" fill="#8BAD8B" opacity="0.85"/>
              <ellipse cx="160" cy="55" rx="45" ry="40" fill="#F0A030" opacity="0.55"/>
              <polygon points="100,57 148,92 52,92" fill="white" opacity="0.95"/>
              <rect x="70" y="92" width="60" height="44" fill="white" opacity="0.95"/>
              <rect x="89" y="108" width="22" height="28" rx="3" fill="#E8735A" opacity="0.5"/>
            </svg>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16, letterSpacing: '-.01em' }}>
            Papaia <span style={{ color: 'rgba(255,255,255,.5)', fontWeight: 400, fontSize: 12 }}>· Admin</span>
          </span>
        </div>
        <button onClick={logout} className="p-action-btn" style={{ color: 'rgba(255,255,255,.7)', borderColor: 'rgba(255,255,255,.2)', background: 'transparent' }}>
          Sair
        </button>
      </header>

      <div className="p-admin-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 className="p-admin-title">Imobiliárias</h1>
            <p className="p-admin-sub">{tenants.length} tenants cadastrados</p>
          </div>
          <button className="j-btn j-btn-primary" onClick={() => { setActionErro(''); setModal({ tipo: 'novo' }) }}>
            + Nova imobiliária
          </button>
        </div>

        {actionErro && <div className="p-error" style={{ marginBottom: 16 }}>{actionErro}</div>}
        {actionOk && <div style={{ background: '#D4EDDA', border: '1px solid #A8D5B5', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#2D6A4F', marginBottom: 16 }}>{actionOk}</div>}

        {loading ? (
          <p style={{ color: 'var(--ink-f)', fontSize: 13 }}>Carregando...</p>
        ) : (
          <table className="p-table">
            <thead>
              <tr>
                <th>Imobiliária</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Plano</th>
                <th>Contratos</th>
                <th>Trial até</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => {
                const pct = t.contratos_limite > 0
                  ? Math.min(100, (t.contratos_usados / t.contratos_limite) * 100)
                  : 0
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.nome}</div>
                      {t.cnpj && <div style={{ fontSize: 11, color: 'var(--ink-f)' }}>{t.cnpj}</div>}
                    </td>
                    <td>
                      <code style={{ fontSize: 12, background: 'var(--cream)', padding: '2px 7px', borderRadius: 5 }}>
                        /{t.slug}
                      </code>
                    </td>
                    <td><span className={badgeClass(t.status)}>{badgeLabel(t.status)}</span></td>
                    <td style={{ textTransform: 'capitalize' }}>{t.plano}</td>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--ink-m)', marginBottom: 4 }}>
                        {t.contratos_usados}/{t.contratos_limite}
                      </div>
                      <div className="p-usage-bar">
                        <div className="p-usage-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--ink-m)' }}>
                      {t.trial_ends_at
                        ? new Date(t.trial_ends_at).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="p-action-btn" onClick={() => { setTrialDias(14); setModal({ tipo: 'trial', tenant: t }) }}>
                          Trial
                        </button>
                        <button className="p-action-btn" onClick={() => { setUsados(t.contratos_usados); setLimite(t.contratos_limite); setModal({ tipo: 'contador', tenant: t }) }}>
                          Contador
                        </button>
                        <button className="p-action-btn" onClick={() => { setNovoEmail(''); setNovoSenha(''); setModal({ tipo: 'usuario', tenant: t }) }}>
                          Usuário
                        </button>
                        {t.status !== 'active' && (
                          <button className="p-action-btn" onClick={() => run(() => ativarTenant(t.id), `${t.nome} ativado!`)}>
                            Ativar
                          </button>
                        )}
                        {t.status !== 'suspended' && (
                          <button className="p-action-btn" style={{ color: '#C0392B', borderColor: '#F5A090' }}
                            onClick={() => { if (confirm(`Suspender ${t.nome}?`)) run(() => suspenderTenant(t.id), `${t.nome} suspenso.`) }}>
                            Suspender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Liberar Trial */}
      {modal?.tipo === 'trial' && (
        <div className="p-modal-overlay" onClick={() => setModal(null)}>
          <div className="p-modal" onClick={e => e.stopPropagation()}>
            <h2 className="p-modal-title">Liberar Trial — {modal.tenant.nome}</h2>
            <div className="p-field">
              <label className="p-label">Dias de trial</label>
              <input className="p-input" type="number" min={1} max={90}
                value={trialDias} onChange={e => setTrialDias(Number(e.target.value))} />
            </div>
            <div className="p-modal-actions">
              <button className="p-btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="p-btn-confirm" onClick={() => {
                run(() => liberarTrial(modal.tenant.id, trialDias), `Trial de ${trialDias} dias liberado!`)
                setModal(null)
              }}>Liberar {trialDias} dias</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Contador */}
      {modal?.tipo === 'contador' && (
        <div className="p-modal-overlay" onClick={() => setModal(null)}>
          <div className="p-modal" onClick={e => e.stopPropagation()}>
            <h2 className="p-modal-title">Contador — {modal.tenant.nome}</h2>
            <div className="j-grid j-grid-2">
              <div className="p-field">
                <label className="p-label">Usados</label>
                <input className="p-input" type="number" min={0}
                  value={usados} onChange={e => setUsados(Number(e.target.value))} />
              </div>
              <div className="p-field">
                <label className="p-label">Limite mensal</label>
                <input className="p-input" type="number" min={1}
                  value={limite} onChange={e => setLimite(Number(e.target.value))} />
              </div>
            </div>
            <div className="p-modal-actions">
              <button className="p-btn-cancel" onClick={() => { run(() => resetarContador(modal.tenant.id), 'Contador zerado!'); setModal(null) }}>
                Zerar
              </button>
              <button className="p-btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="p-btn-confirm" onClick={() => {
                run(() => editarContador(modal.tenant.id, usados, limite), 'Contador salvo!')
                setModal(null)
              }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Associar Usuário */}
      {modal?.tipo === 'usuario' && (
        <div className="p-modal-overlay" onClick={() => setModal(null)}>
          <div className="p-modal" onClick={e => e.stopPropagation()}>
            <h2 className="p-modal-title">Criar usuário — {modal.tenant.nome}</h2>
            <div className="p-field">
              <label className="p-label">Email</label>
              <input className="p-input" type="email" placeholder="corretor@imob.com.br"
                value={novoEmail} onChange={e => setNovoEmail(e.target.value)} />
            </div>
            <div className="p-field">
              <label className="p-label">Senha inicial</label>
              <input className="p-input" type="text" placeholder="mínimo 6 caracteres"
                value={novoSenha} onChange={e => setNovoSenha(e.target.value)} />
            </div>
            <div className="p-field">
              <label className="p-label">Papel</label>
              <select className="j-select" value={novoRole} onChange={e => setNovoRole(e.target.value as any)}>
                <option value="user">Usuário</option>
                <option value="admin">Admin da imobiliária</option>
              </select>
            </div>
            <div className="p-modal-actions">
              <button className="p-btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
              <button className="p-btn-confirm" onClick={() => {
                run(() => criarUsuario(novoEmail, novoSenha, modal.tenant.id, novoRole), `Usuário ${novoEmail} criado!`)
                setModal(null)
              }}>Criar usuário</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo Tenant */}
      {modal?.tipo === 'novo' && (
        <div className="p-modal-overlay" onClick={() => setModal(null)}>
          <div className="p-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <h2 className="p-modal-title">Nova imobiliária</h2>
            <form action={async (fd) => { setModal(null); run(() => criarTenant(fd)) }}>
              <div className="j-grid j-grid-2" style={{ gap: 12 }}>
                <div className="p-field j-fw">
                  <label className="p-label">Nome da imobiliária *</label>
                  <input className="p-input" name="nome" required placeholder="Ex: Alfa Imóveis" />
                </div>
                <div className="p-field">
                  <label className="p-label">Slug (URL) *</label>
                  <input className="p-input" name="slug" required placeholder="alfa-imoveis" />
                </div>
                <div className="p-field">
                  <label className="p-label">Plano</label>
                  <select className="j-select" name="plano" defaultValue="trial">
                    <option value="trial">Trial</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                <div className="p-field">
                  <label className="p-label">CNPJ</label>
                  <input className="p-input" name="cnpj" placeholder="00.000.000/0001-00" />
                </div>
                <div className="p-field">
                  <label className="p-label">CRECI</label>
                  <input className="p-input" name="creci" placeholder="00000-J" />
                </div>
                <div className="p-field">
                  <label className="p-label">Limite de contratos/mês</label>
                  <input className="p-input" name="contratos_limite" type="number" defaultValue={10} min={1} />
                </div>
                <div className="p-field">
                  <label className="p-label">Cor primária</label>
                  <input className="p-input" name="cor_primaria" type="color" defaultValue="#E8735A" style={{ height: 40, padding: '4px 8px', cursor: 'pointer' }} />
                </div>
                <div className="p-field">
                  <label className="p-label">Cor secundária</label>
                  <input className="p-input" name="cor_secundaria" type="color" defaultValue="#8BAD8B" style={{ height: 40, padding: '4px 8px', cursor: 'pointer' }} />
                </div>
              </div>
              <div className="p-modal-actions">
                <button type="button" className="p-btn-cancel" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="p-btn-confirm">Criar imobiliária</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
