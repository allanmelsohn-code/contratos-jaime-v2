# Frontend Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir todos os emojis por ícones Lucide React e aplicar melhorias visuais expressivas no design system Papaia.

**Architecture:** Todas as mudanças de estilo ficam em `app/globals.css`; todas as mudanças de markup ficam nos componentes existentes em `src/components/` e `app/[tenant]/page.tsx`. Sem novos arquivos, sem mudanças de lógica.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, `lucide-react` (nova dependência)

---

## Mapa de arquivos

| Arquivo | O que muda |
|---------|------------|
| `package.json` | Adicionar `lucide-react` |
| `app/globals.css` | 16 melhorias de estilo (body, header, steps, progress, cards, botões, upload, banners, modalidade, SlotRow, mobile) |
| `app/[tenant]/page.tsx` | Botão Sair → `.j-btn-ghost` + `LogOut`; separadores `.done`; banners com classes |
| `src/components/StepModalidade.tsx` | Cards maiores `.j-choice-modal`, ícones Lucide, eyebrow+título |
| `src/components/StepUpload.tsx` | GNT icons, section titles, `SlotRow` botões → `.slot-btn` + Lucide |
| `src/components/StepReview.tsx` | Emojis em labels de role e section titles → Lucide |
| `src/components/StepContrato.tsx` | Emojis em card headers e choice cards → Lucide |
| `src/components/StepGerar.tsx` | Emojis em card headers, botões, estados → Lucide |
| `src/components/StepPartesCV.tsx` | Emojis em card headers → Lucide |
| `src/components/StepNegocioCV.tsx` | Emojis em card headers → Lucide |
| `src/components/StepGerarCV.tsx` | Emojis em card headers e botões → Lucide |
| `src/components/CorretorSearch.tsx` | Emoji de aviso → Lucide |

---

## Task 1: Instalar lucide-react

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar a dependência**

```bash
cd C:\Users\allan\contratos-jaime-v2\.claude\worktrees\priceless-mcclintock
npm install lucide-react
```

Expected output: `added 1 package` (ou similar — lucide-react tem zero sub-dependências)

- [ ] **Step 2: Verificar instalação**

```bash
node -e "require('lucide-react'); console.log('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lucide-react"
```

---

## Task 2: globals.css — body, header, logo, badge, botão ghost

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Aplicar mudanças no body e header**

Localize o bloco `body { ... }` (linha ~42) e substitua por:

```css
body {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--cream);
  background-image:
    radial-gradient(ellipse at 0% 0%, rgba(232,115,90,.06) 0%, transparent 45%),
    radial-gradient(ellipse at 100% 100%, rgba(139,173,139,.05) 0%, transparent 45%);
  color: var(--ink);
  min-height: 100vh;
}
```

Localize `.j-header { ... }` e adicione ao final do bloco:
```css
  background-image: radial-gradient(ellipse at 0% 50%, rgba(232,115,90,.15) 0%, transparent 55%);
```

- [ ] **Step 2: Atualizar .j-logo-sq e .j-badge**

Localize `.j-logo-sq { ... }` e adicione:
```css
  box-shadow: 0 2px 10px rgba(232,115,90,.45);
```

Localize `.j-badge { ... }` e adicione:
```css
  border: 1px solid rgba(255,255,255,.08);
```

- [ ] **Step 3: Adicionar .j-btn-ghost após o bloco .j-badge**

```css
.j-btn-ghost {
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.55);
  border: 1px solid rgba(255,255,255,.10);
  padding: 5px 14px;
  border-radius: 7px;
  font-size: 12px; font-weight: 500;
  cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  display: inline-flex; align-items: center; gap: 5px;
  transition: all .14s;
}
.j-btn-ghost:hover {
  background: rgba(255,255,255,.15);
  color: var(--white);
}
```

- [ ] **Step 4: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Expected: sem erros de CSS (Next.js valida o CSS durante o build)

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "style: body gradient, header glow, logo shadow, j-btn-ghost"
```

---

## Task 3: globals.css — steps bar, progress, cards, botões

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Atualizar steps bar**

Localize `.j-step-btn.active { ... }` e adicione:
```css
  box-shadow: 0 2px 8px rgba(45,45,45,.2);
```

Localize `.j-step-btn.active .j-step-num { ... }` e adicione:
```css
  box-shadow: 0 1px 4px rgba(232,115,90,.5);
```

Substitua `.j-step-btn.done { ... }` por:
```css
.j-step-btn.done { color: var(--sage-d); background: var(--sage-p); }
.j-step-btn.done .j-step-num { background: var(--sage); color: white; }
.j-step-btn.done:hover { background: var(--sage-p); color: var(--sage-d); }
```

Substitua `.j-step-sep { ... }` por:
```css
.j-step-sep { width: 20px; height: 2px; background: var(--border); border-radius: 2px; }
.j-step-sep.done { background: var(--sage-l); }
```

- [ ] **Step 2: Atualizar progress bar**

Substitua o bloco `.j-progress` e `.j-progress-fill` por:
```css
.j-progress { height: 3px; background: var(--border); }
.j-progress-fill {
  height: 3px;
  background: linear-gradient(90deg, var(--tenant-primary), var(--coral-l));
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 8px rgba(232,115,90,.35);
  transition: width .4s ease;
}
```

- [ ] **Step 3: Atualizar cards e botões**

Localize `.j-card { ... }` e atualize `box-shadow` para:
```css
  box-shadow: 0 2px 14px rgba(45,45,45,.07);
```

Localize `.j-btn-primary { ... }` e adicione:
```css
  box-shadow: 0 3px 12px rgba(232,115,90,.3);
```

Localize `.j-btn-primary:hover { ... }` e atualize `box-shadow` para:
```css
  box-shadow: 0 5px 16px rgba(232,115,90,.4);
```

- [ ] **Step 4: Atualizar animação de step e upload zone**

Substitua o bloco `.j-page` e `@keyframes fi` por:
```css
.j-page { display: none; animation: fi .25s ease; }
.j-page.active { display: block; animation: stepEnter .3s cubic-bezier(.22,.68,0,1.2); }
@keyframes stepEnter {
  from { opacity: 0; transform: translateX(18px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

Localize `.j-upload { ... }` e atualize `border` e `background`:
```css
  border: 2px dashed rgba(232,115,90,.28);
  background: rgba(232,115,90,.03);
```

Adicione após `.j-upload:hover { ... }`:
```css
.j-upload svg { color: var(--coral); opacity: .7; }
```

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "style: steps expressivos, progress glow, card shadow, step transition slide"
```

---

## Task 4: globals.css — banners, modalidade, slot-btn, mobile

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Adicionar classes de banner**

Após o bloco `.j-notice { ... }`, adicione:

```css
/* ── BANNERS ─────────────────────────────────────────────── */
.j-banner-trial {
  background: linear-gradient(90deg, #FFF8E7 0%, #FFF3CD 100%);
  border-bottom: 1px solid #FFE083;
  padding: 9px 32px;
  font-size: 12px; color: #856404;
  display: flex; align-items: center; justify-content: center;
  gap: 8px; font-weight: 500;
}
.j-banner-limit {
  background: linear-gradient(90deg, #FFF0EE 0%, #FEE2DC 100%);
  border-bottom: 1px solid #F5A090;
  padding: 9px 32px;
  font-size: 12px; color: #C0392B;
  display: flex; align-items: center; justify-content: center;
  gap: 8px; font-weight: 600;
}
```

- [ ] **Step 2: Adicionar classes de modalidade**

Após o bloco `.j-choices-4 { ... }`, adicione:

```css
/* ── CHOICE MODAL (tela de seleção de modalidade) ─────────── */
.j-choices-modal { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
.j-choice-modal {
  border: 2px solid var(--border);
  border-radius: 18px; padding: 28px 24px;
  cursor: pointer; background: var(--white);
  position: relative; text-align: left;
  transition: all .2s cubic-bezier(.22,.68,0,1.1);
  box-shadow: 0 2px 12px rgba(45,45,45,.05);
}
.j-choice-modal:hover {
  border-color: var(--tenant-primary);
  transform: translateY(-4px);
  box-shadow: 0 14px 36px rgba(232,115,90,.14);
}
.j-choice-modal.sel { border-color: var(--tenant-primary); background: var(--coral-p); }
.j-choice-modal.sel::after {
  content: '';
  position: absolute; top: 14px; right: 14px;
  width: 20px; height: 20px;
  background: var(--coral);
  border-radius: 50%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='9' viewBox='0 0 11 9'%3E%3Cpath d='M1 4l3 3 6-6' stroke='white' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}
.j-choice-modal-icon {
  width: 48px; height: 48px; border-radius: 13px;
  background: var(--cream);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px; transition: all .2s;
}
.j-choice-modal:hover .j-choice-modal-icon,
.j-choice-modal.sel .j-choice-modal-icon { background: var(--coral-p); }
.j-choice-modal-icon svg { width: 22px; height: 22px; color: var(--coral); }
.j-choice-modal-label { font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 6px; letter-spacing: -.02em; }
.j-choice-modal-desc { font-size: 12px; color: var(--ink-f); line-height: 1.55; }
.j-choice-modal-tag {
  display: inline-block; margin-top: 14px; padding: 3px 9px; border-radius: 20px;
  font-size: 10px; font-weight: 700; background: var(--cream); color: var(--ink-f);
  transition: all .2s;
}
.j-choice-modal:hover .j-choice-modal-tag,
.j-choice-modal.sel .j-choice-modal-tag { background: rgba(232,115,90,.15); color: var(--coral-d); }
```

- [ ] **Step 3: Adicionar .slot-btn**

Após o bloco `.j-upload-note { ... }`, adicione:

```css
/* ── SLOT BTN (StepUpload SlotRow) ──────────────────────────── */
.slot-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; padding: 5px 11px; border-radius: 7px;
  border: 1.5px solid var(--border-s); background: var(--cream);
  color: var(--ink-m); cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
  white-space: nowrap; flex-shrink: 0; transition: all .14s;
}
.slot-btn svg { width: 11px; height: 11px; }
.slot-btn.active { border-color: var(--coral); background: var(--coral-p); color: var(--coral-d); }
.slot-btn:hover:not(.active) { border-color: var(--ink-m); color: var(--ink); }
```

- [ ] **Step 4: Atualizar breakpoint mobile**

Localize o bloco `@media (max-width: 640px)` e adicione dentro:
```css
  .j-steps-bar { overflow-x: auto; scrollbar-width: none; }
  .j-steps-bar::-webkit-scrollbar { display: none; }
  .j-step-btn { white-space: nowrap; }
```

- [ ] **Step 5: Build e commit**

```bash
npm run build 2>&1 | tail -5
git add app/globals.css
git commit -m "style: banners, j-choice-modal, slot-btn, mobile steps scroll"
```

---

## Task 5: page.tsx — botão Sair, separadores, banners

**Files:**
- Modify: `app/[tenant]/page.tsx`

- [ ] **Step 1: Adicionar import Lucide**

No topo do arquivo, após os imports existentes, adicione:
```tsx
import { LogOut, Clock, Lock } from 'lucide-react'
```

- [ ] **Step 2: Substituir botão Sair**

Localize:
```tsx
<button onClick={logout} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontSize: 12 }}>
  Sair
</button>
```

Substitua por:
```tsx
<button onClick={logout} className="j-btn-ghost">
  <LogOut size={12} /> Sair
</button>
```

- [ ] **Step 3: Adicionar classe `done` nos separadores**

Localize:
```tsx
{i < activeSteps.length - 1 && <div className="j-step-sep" />}
```

Substitua por:
```tsx
{i < activeSteps.length - 1 && (
  <div className={`j-step-sep${i < step ? ' done' : ''}`} />
)}
```

- [ ] **Step 4: Substituir banners inline por classes CSS**

Localize o bloco do banner trial:
```tsx
<div style={{ background: '#FFF3CD', borderBottom: '1px solid #FFE083', padding: '8px 32px', fontSize: 12, color: '#856404', textAlign: 'center' }}>
  ⏰ Trial ativo até {new Date(tenant.trial_ends_at).toLocaleDateString('pt-BR')} ·{' '}
  {Math.max(0, tenant.contratos_limite - tenant.contratos_usados)} contratos restantes
</div>
```

Substitua por:
```tsx
<div className="j-banner-trial">
  <Clock size={13} />
  Trial ativo até {new Date(tenant.trial_ends_at).toLocaleDateString('pt-BR')} ·{' '}
  {Math.max(0, tenant.contratos_limite - tenant.contratos_usados)} contratos restantes
</div>
```

Localize o banner de limite:
```tsx
<div style={{ background: '#FEE2DC', borderBottom: '1px solid #F5A090', padding: '8px 32px', fontSize: 12, color: '#C0392B', textAlign: 'center' }}>
  🔒 Limite de contratos atingido este mês. Entre em contato com o suporte Papaia para ampliar.
</div>
```

Substitua por:
```tsx
<div className="j-banner-limit">
  <Lock size={13} />
  Limite de contratos atingido este mês. Entre em contato com o suporte Papaia para ampliar.
</div>
```

- [ ] **Step 5: Build e commit**

```bash
npm run build 2>&1 | tail -5
git add app/[tenant]/page.tsx
git commit -m "feat: botão Sair ghost, separadores done, banners com classes"
```

---

## Task 6: StepModalidade — cards maiores + ícones Lucide

**Files:**
- Modify: `src/components/StepModalidade.tsx`

- [ ] **Step 1: Ler o arquivo atual**

Leia `src/components/StepModalidade.tsx` para entender a estrutura atual antes de editar.

- [ ] **Step 2: Substituir o componente inteiro**

O componente usa um array de opções com `icon` (emoji), `label`, `desc`. Substitua o arquivo completo por:

```tsx
'use client'

import { Home, DollarSign, FileText } from 'lucide-react'

type Modalidade = 'locacao' | 'compra-venda' | 'escritura'

const OPCOES: {
  id: Modalidade
  icon: React.ReactNode
  label: string
  desc: string
  tag: string
  novo?: boolean
}[] = [
  {
    id: 'locacao',
    icon: <Home size={22} />,
    label: 'Locação',
    desc: 'Contrato de aluguel residencial ou comercial com todas as cláusulas padrão.',
    tag: '4 etapas · OCR automático',
  },
  {
    id: 'compra-venda',
    icon: <DollarSign size={22} />,
    label: 'Compra e Venda',
    desc: 'Promessa de compra e venda de imóvel com condições de pagamento e prazo.',
    tag: '3 etapas',
  },
  {
    id: 'escritura',
    icon: <FileText size={22} />,
    label: 'Escritura',
    desc: 'Instrumento particular com força de escritura pública para transferência definitiva.',
    tag: '3 etapas',
    novo: true,
  },
]

export default function StepModalidade({ onSelect }: { onSelect: (m: Modalidade) => void }) {
  return (
    <main className="j-main">
      <div className="j-eyebrow">Novo contrato</div>
      <h1 className="j-title">Selecione a modalidade</h1>
      <p className="j-desc">
        Escolha o tipo de contrato que deseja gerar. O fluxo e os campos serão adaptados automaticamente.
      </p>

      <div className="j-choices-modal">
        {OPCOES.map((op) => (
          <button
            key={op.id}
            className="j-choice-modal"
            onClick={() => onSelect(op.id)}
            style={{ position: 'relative' }}
          >
            {op.novo && (
              <span style={{
                position: 'absolute', top: 14, right: 14,
                background: 'var(--sage-p)', color: 'var(--sage-d)',
                padding: '2px 8px', borderRadius: 20,
                fontSize: 9, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
              }}>
                Novo
              </span>
            )}
            <div className="j-choice-modal-icon">{op.icon}</div>
            <div className="j-choice-modal-label">{op.label}</div>
            <div className="j-choice-modal-desc">{op.desc}</div>
            <span className="j-choice-modal-tag">{op.tag}</span>
          </button>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Build e commit**

```bash
npm run build 2>&1 | tail -5
git add src/components/StepModalidade.tsx
git commit -m "feat: StepModalidade com cards maiores e ícones Lucide"
```

---

## Task 7: StepUpload — ícones nas sections e GNT_OPTIONS

**Files:**
- Modify: `src/components/StepUpload.tsx`

- [ ] **Step 1: Adicionar imports Lucide**

Após `import { useState, useRef } from 'react'`, adicione:
```tsx
import { Home, Users, Handshake, MapPin, Shield, DollarSign, FileText, Banknote, BarChart3, Plus } from 'lucide-react'
```

- [ ] **Step 2: Substituir GNT_OPTIONS**

Localize `const GNT_OPTIONS = [...]` e substitua por:
```tsx
const GNT_OPTIONS = [
  { id: 'fiador',     icon: <Users size={16} />,      label: 'Fiador',               desc: 'Pessoa física garantidora' },
  { id: 'seguro',     icon: <Shield size={16} />,     label: 'Seguro Fiança',        desc: 'Apólice de seguro' },
  { id: 'caucao',     icon: <Banknote size={16} />,   label: 'Caução',               desc: 'Depósito em dinheiro' },
  { id: 'titulo',     icon: <BarChart3 size={16} />,  label: 'Título Capitalização', desc: 'Título em garantia' },
  { id: 'imovel-cau', icon: <Home size={16} />,       label: 'Imóvel Caucionado',    desc: 'Garantia real em imóvel · art. 38 §1º' },
]
```

- [ ] **Step 3: Atualizar renderSection — títulos com Lucide**

Adicione `ReactNode` ao import do React no topo do arquivo:
```tsx
import { useState, useRef, type ReactNode } from 'react'
```

Atualize a assinatura de `renderSection` para aceitar `ReactNode` no título:
```tsx
function renderSection(role: 'locador' | 'locatario' | 'fiador', title: ReactNode, sCards: PersonCard[], required = false) {
```

Localize as chamadas de `renderSection` no return:
```tsx
{renderSection('locador',   '🏠 Locadores',  locadores)}
{renderSection('locatario', '🔑 Locatários', locatarios)}
```

Substitua por:
```tsx
{renderSection('locador',   <><Home size={15} /> Locadores</>,   locadores)}
{renderSection('locatario', <><Users size={15} /> Locatários</>, locatarios)}
{form.gnt === 'fiador'
  ? renderSection('fiador', <><Handshake size={15} /> Fiadores</>,            fiadores, true)
  : renderSection('fiador', <><Handshake size={15} /> Fiadores (opcional)</>, fiadores, false)
}
```

- [ ] **Step 4: Atualizar card de Imóvel e Modelo**

Localize `<div className="j-card-title">📍 Imóvel</div>` e substitua por:
```tsx
<div className="j-card-title"><MapPin size={15} /> Imóvel</div>
```

Localize `<div className="j-card-title">📋 Modelo de Contrato — Tipo de Garantia</div>` e substitua por:
```tsx
<div className="j-card-title"><Shield size={15} /> Modelo de Contrato — Tipo de Garantia</div>
```

- [ ] **Step 5: Atualizar botão "Adicionar pessoa"**

Localize o botão `＋ Adicionar {meta.label}` e substitua `<span style={{ fontSize: 20, lineHeight: 1 }}>＋</span>` por `<Plus size={14} />`.

- [ ] **Step 6: Build e commit**

```bash
npm run build 2>&1 | tail -5
git add src/components/StepUpload.tsx
git commit -m "feat: StepUpload ícones Lucide em GNT, sections e botões"
```

---

## Task 8: StepUpload — SlotRow com .slot-btn e ícones

**Files:**
- Modify: `src/components/StepUpload.tsx`

- [ ] **Step 1: Atualizar import Lucide completo**

Substitua o import Lucide no topo de `src/components/StepUpload.tsx` pelo import completo (inclui ícones das Tasks 7 e 8):
```tsx
import { Home, Users, Handshake, MapPin, Shield, DollarSign, FileText, Banknote, BarChart3, Plus, Upload, Pencil, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
```

- [ ] **Step 2: Substituir botão Upload no SlotRow**

Localize no componente `SlotRow` o botão de Upload:
```tsx
<button onClick={() => ref.current?.click()} disabled={isLoad} style={{
  fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 7,
  border: `1.5px solid ${isDone ? '#86EFAC' : 'var(--border)'}`,
  background: isDone ? '#DCFCE7' : 'var(--cream)',
  color: isDone ? '#166534' : 'var(--ink-m)', cursor: isLoad ? 'wait' : 'pointer', flexShrink: 0,
}}>
  {isLoad ? '⏳' : isDone ? '✅' : '📎'} Upload
</button>
```

Substitua por:
```tsx
<button onClick={() => ref.current?.click()} disabled={isLoad} className="slot-btn">
  <Upload size={11} /> Upload
</button>
```

- [ ] **Step 3: Substituir botão Preencher no SlotRow**

Localize o botão Preencher:
```tsx
<button onClick={() => setShowForm(v => !v)} style={{
  fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 7,
  border: `1.5px solid ${showForm ? 'var(--tenant-primary)' : 'var(--border)'}`,
  background: showForm ? 'var(--tenant-primary-p)' : 'var(--cream)',
  color: showForm ? 'var(--tenant-primary-d)' : 'var(--ink-m)', cursor: 'pointer', flexShrink: 0,
}}>
  ✏️ Preencher
</button>
```

Substitua por:
```tsx
<button onClick={() => setShowForm(v => !v)} className={`slot-btn${showForm ? ' active' : ''}`}>
  <Pencil size={11} /> Preencher
</button>
```

- [ ] **Step 4: Substituir indicadores de status done/loading/error**

Localize no `SlotRow` a renderização de status. A div com status fica dentro do `<div style={{ flex: 1, minWidth: 0 }}>`:

```tsx
{isDone && (
  <div style={{ fontSize: 11, color: 'var(--sage)', marginTop: 2 }}>
    {state.extracted?.nome || ... || '✓ preenchido'}
  </div>
)}
{isError && <div style={{ fontSize: 11, color: 'var(--coral)', marginTop: 2 }}>{state.error}</div>}
```

Substitua por:
```tsx
{isDone && (
  <div style={{ fontSize: 11, color: 'var(--sage-d)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
    <CheckCircle2 size={11} />
    {state.extracted?.nome || state.extracted?.razao_social || state.extracted?.banco || state.extracted?.numero_matricula || vals.nome || vals.matricula || 'preenchido'}
  </div>
)}
{isLoad && (
  <div style={{ fontSize: 11, color: 'var(--orange)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
    <Loader2 size={11} className="j-spin" /> Processando...
  </div>
)}
{isError && (
  <div style={{ fontSize: 11, color: 'var(--coral)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
    <AlertCircle size={11} /> {state.error}
  </div>
)}
```

Remova o `{state.status === 'idle' && <span ...>Não enviado</span>}` — o botão Upload já comunica o estado idle.

- [ ] **Step 5: Build e commit**

```bash
npm run build 2>&1 | tail -5
git add src/components/StepUpload.tsx
git commit -m "feat: SlotRow botões com .slot-btn e status Lucide"
```

---

## Task 9: StepReview — ícones Lucide

**Files:**
- Modify: `src/components/StepReview.tsx`

- [ ] **Step 1: Ler o arquivo**

Leia `src/components/StepReview.tsx` e identifique todos os emojis antes de editar.

- [ ] **Step 2: Adicionar imports**

```tsx
import { Home, KeyRound, Handshake, Users, MapPin, HelpCircle, Paperclip } from 'lucide-react'
```

- [ ] **Step 3: Substituir labels de role (linhas ~30-35)**

Localize o objeto/dict de labels de role (ex: `'🏠 Locador'`, `'🔑 Locatário'`, etc.).

Se for um objeto de mapeamento de string, converta para função ou use um mapa de ReactNode:
```tsx
const ROLE_ICON: Record<string, React.ReactNode> = {
  locador:   <><Home size={13} /> Locador</>,
  locatario: <><KeyRound size={13} /> Locatário</>,
  fiador:    <><Handshake size={13} /> Fiador</>,
  conjuge:   <><Users size={13} /> Cônjuge</>,
  imovel:    <><MapPin size={13} /> Imóvel</>,
}
```

- [ ] **Step 4: Substituir section titles (linhas ~204-232)**

Localize títulos como `'🏠 Locadores'`, `'🔑 Locatários'`, `'🤝 Fiadores'`, `'📍 Imóvel'` e substitua por JSX com ícone Lucide, seguindo o padrão das Tasks anteriores.

Substitua `'📎 {p._source}'` por `<><Paperclip size={11} /> {p._source}</>`.

- [ ] **Step 5: Build e commit**

```bash
npm run build 2>&1 | tail -5
git add src/components/StepReview.tsx
git commit -m "feat: StepReview ícones Lucide"
```

---

## Task 10: StepContrato — ícones Lucide

**Files:**
- Modify: `src/components/StepContrato.tsx`

- [ ] **Step 1: Ler o arquivo**

Leia `src/components/StepContrato.tsx` antes de editar.

- [ ] **Step 2: Adicionar imports**

```tsx
import { Building, Landmark, ClipboardList, Shield, Handshake, FileText, Banknote, DollarSign, BarChart3, Home, MapPin, Briefcase, AlertCircle, FileEdit } from 'lucide-react'
```

- [ ] **Step 3: Substituir emojis nos icon props e card titles**

Mapeamento completo (coluna da esquerda = emoji atual, direita = JSX Lucide):

| Emoji | Substituição |
|-------|-------------|
| `🏢` (Administração) | `<Building size={15} />` |
| `🏛️` (Jaime Admin) | `<Landmark size={15} />` |
| `📋` (Sem Admin) | `<ClipboardList size={15} />` |
| `🛡️` (Garantia) | `<Shield size={15} />` |
| `🤝` (Fiador) | `<Handshake size={15} />` |
| `📄` (Seguro) | `<FileText size={15} />` |
| `💰` (Caução) | `<Banknote size={15} />` |
| `📊` (Cap. Título) | `<BarChart3 size={15} />` |
| `🏠` (Imóvel Cau.) | `<Home size={15} />` |
| `📍` (Imóvel) | `<MapPin size={15} />` |
| `💵` (Valor) | `<DollarSign size={15} />` |
| `💼` (Comissão) | `<Briefcase size={15} />` |
| `⚠️` (obs corretor) | `<AlertCircle size={11} />` |
| `📝` (Cláusulas) | `<FileEdit size={15} />` |

- [ ] **Step 4: Build e commit**

```bash
npm run build 2>&1 | tail -5
git add src/components/StepContrato.tsx
git commit -m "feat: StepContrato ícones Lucide"
```

---

## Task 11: StepGerar e StepGerarCV — ícones Lucide

**Files:**
- Modify: `src/components/StepGerar.tsx`
- Modify: `src/components/StepGerarCV.tsx`

- [ ] **Step 1: Ler ambos os arquivos**

Leia `src/components/StepGerar.tsx` e `src/components/StepGerarCV.tsx`.

- [ ] **Step 2: StepGerar — imports e substituições**

Adicionar imports:
```tsx
import { PenTool, Mail, FileText, Loader2, Download, Printer, Pen, CheckCircle2, AlertTriangle } from 'lucide-react'
```

Substituições:
| Emoji | Substituição |
|-------|-------------|
| `✍️` (Partes Assinatura) | `<PenTool size={15} />` |
| `📧` (email) | `<Mail size={11} />` |
| `📄` (Gerar Contrato) | `<FileText size={15} />` |
| `⚙️` (Gerando...) | `<Loader2 size={13} className="j-spin" />` |
| `📥` (Baixar .docx) | `<Download size={13} />` |
| `🖨️` (Imprimir) | `<Printer size={13} />` |
| `⚙️` (Enviando...) | `<Loader2 size={13} className="j-spin" />` |
| `🖊️` (DocuSign) | `<Pen size={13} />` |
| `✅` (sucesso) | `<CheckCircle2 size={14} />` |
| `⚠️` (erro) | `<AlertTriangle size={13} />` |

- [ ] **Step 3: StepGerarCV — imports e substituições**

Adicionar imports:
```tsx
import { PenTool, FileText, Loader2, Download } from 'lucide-react'
```

Substituições:
| Emoji | Substituição |
|-------|-------------|
| `✍️` (Partes Assinatura) | `<PenTool size={15} />` |
| `📄` (Gerar Documento) | `<FileText size={15} />` |
| `⚙️` (Gerando...) | `<Loader2 size={13} className="j-spin" />` |
| `📥` (Baixar .docx) | `<Download size={13} />` |

- [ ] **Step 4: Build e commit**

```bash
npm run build 2>&1 | tail -5
git add src/components/StepGerar.tsx src/components/StepGerarCV.tsx
git commit -m "feat: StepGerar e StepGerarCV ícones Lucide"
```

---

## Task 12: StepPartesCV, StepNegocioCV e CorretorSearch — ícones Lucide

**Files:**
- Modify: `src/components/StepPartesCV.tsx`
- Modify: `src/components/StepNegocioCV.tsx`
- Modify: `src/components/CorretorSearch.tsx`

- [ ] **Step 1: Ler os três arquivos**

Leia `src/components/StepPartesCV.tsx`, `src/components/StepNegocioCV.tsx` e `src/components/CorretorSearch.tsx`.

- [ ] **Step 2: StepPartesCV**

Adicionar imports:
```tsx
import { Tag, Handshake } from 'lucide-react'
```

| Emoji | Substituição |
|-------|-------------|
| `🏷️` (Vendedores) | `<Tag size={15} />` |
| `🤝` (Compradores) | `<Handshake size={15} />` |

- [ ] **Step 3: StepNegocioCV**

Adicionar imports:
```tsx
import { Home, DollarSign } from 'lucide-react'
```

| Emoji | Substituição |
|-------|-------------|
| `🏠` (Imóvel) | `<Home size={15} />` |
| `💵` (Valor) | `<DollarSign size={15} />` |

- [ ] **Step 4: CorretorSearch**

Adicionar imports:
```tsx
import { AlertCircle } from 'lucide-react'
```

| Emoji | Substituição |
|-------|-------------|
| `⚠️` (obs) | `<AlertCircle size={11} style={{ color: 'var(--orange)', flexShrink: 0 }} />` |

- [ ] **Step 5: Build final e commit**

```bash
npm run build 2>&1 | tail -5
git add src/components/StepPartesCV.tsx src/components/StepNegocioCV.tsx src/components/CorretorSearch.tsx
git commit -m "feat: StepPartesCV, StepNegocioCV, CorretorSearch ícones Lucide"
```

---

## Task 13: Verificação final

**Files:** nenhum

- [ ] **Step 1: Buscar emojis residuais**

```bash
grep -rn --include="*.tsx" --include="*.ts" "[🏠🔑🤝💑📍❓📎✍️📧📄⚙️📥🖨️🖊️✅⚠️🏷️💵🏢🏛️📋🛡️💰📊💼📝📜🔒⏰]" src/ app/
```

Expected: zero resultados (ou apenas casos intencionais em comentários/strings de dados)

- [ ] **Step 2: Build limpo**

```bash
npm run build 2>&1
```

Expected: `Route (app)` table com todas as rotas, sem erros TypeScript.

- [ ] **Step 3: Checar se há erros de tipo com imports Lucide**

```bash
npx tsc --noEmit 2>&1
```

Expected: sem erros.

- [ ] **Step 4: Commit final se necessário**

Se qualquer ajuste foi feito nos passos acima:
```bash
git add -A
git commit -m "fix: ajustes pós-verificação final"
```
