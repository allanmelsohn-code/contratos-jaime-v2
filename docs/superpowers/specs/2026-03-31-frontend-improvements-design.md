# Frontend Improvements — Design Spec
**Date:** 2026-03-31
**Status:** Approved
**Approach:** Opção 1 — tudo em `globals.css` + substituição de emojis por Lucide React

---

## Contexto

O webapp Papaia (gerador de contratos imobiliários) usa um design system próprio (`globals.css`, ~559 linhas) sem bibliotecas de componentes externas. Os ícones atuais são emojis inline (`🏠`, `📎`, `✏️`, `📋`, etc.), o que prejudica a consistência visual e o profissionalismo. O tom aprovado é **Expressivo**: mais profundidade, steps com fundo colorido quando concluídos, glow no progress bar, header com gradiente sutil.

---

## Decisões de Design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Biblioteca de ícones | **Lucide React** | Traço 2px clean, React-native, 1500+ ícones, bem mantida |
| Tom visual | **Expressivo** | Steps done com fundo sage, glow no progress, sombra no botão primary |
| Abordagem | **globals.css + substituição direta** | Consistente com o padrão existente do projeto |

---

## 1. Instalação

Adicionar `lucide-react` às dependências:
```
npm install lucide-react
```

Uso nos componentes:
```tsx
import { Upload, Pencil, Home, CheckCircle2, ... } from 'lucide-react'
```

---

## 2. Mudanças em `globals.css`

### 2.1 Body — gradiente de fundo sutil
```css
body {
  background: var(--cream);
  background-image:
    radial-gradient(ellipse at 0% 0%, rgba(232,115,90,.06) 0%, transparent 45%),
    radial-gradient(ellipse at 100% 100%, rgba(139,173,139,.05) 0%, transparent 45%);
}
```

### 2.2 Header — gradiente coral sutil
`.j-header` recebe `background-image: radial-gradient(ellipse at 0% 50%, rgba(232,115,90,.15) 0%, transparent 55%)`.

### 2.3 `.j-logo-sq` — sombra no logo
Adicionar `box-shadow: 0 2px 10px rgba(232,115,90,.45)`.

### 2.4 `.j-badge` — borda sutil
Adicionar `border: 1px solid rgba(255,255,255,.08)`.

### 2.5 `.j-btn-ghost` — novo componente para botão Sair
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

### 2.6 Steps bar — step done com fundo sage
```css
.j-step-btn.done { color: var(--sage-d); background: var(--sage-p); }
.j-step-btn.done .j-step-num { background: var(--sage-d); color: white; }
.j-step-btn.active { box-shadow: 0 2px 8px rgba(45,45,45,.2); }
.j-step-btn.active .j-step-num { box-shadow: 0 1px 4px rgba(232,115,90,.5); }
.j-step-btn.done:hover { background: var(--sage-p); color: var(--sage-d); }
```

### 2.7 `.j-step-sep` — separador dinâmico
```css
.j-step-sep { width: 20px; height: 2px; background: var(--border); border-radius: 2px; }
.j-step-sep.done { background: var(--sage-l); }
```

### 2.8 Progress bar — glow
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

### 2.9 Cards — sombra levemente mais profunda
```css
.j-card { box-shadow: 0 2px 14px rgba(45,45,45,.07); }
```

### 2.10 Botão primary — sombra expressiva
```css
.j-btn-primary { box-shadow: 0 3px 12px rgba(232,115,90,.3); }
.j-btn-primary:hover { box-shadow: 0 5px 16px rgba(232,115,90,.4); }
```

### 2.11 Transição de step — slide + fade
```css
.j-page { display: none; }
.j-page.active { display: block; animation: stepEnter .3s cubic-bezier(.22,.68,0,1.2); }
@keyframes stepEnter {
  from { opacity: 0; transform: translateX(18px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

### 2.12 Upload zone — coral-tinted
```css
.j-upload {
  border: 2px dashed rgba(232,115,90,.28);
  background: rgba(232,115,90,.03);
}
.j-upload:hover { border-color: var(--tenant-primary); background: var(--tenant-primary-p); }
.j-upload svg { color: var(--coral); opacity: .7; }
```

### 2.13 Banners trial/limite — classes CSS
```css
.j-banner-trial {
  background: linear-gradient(90deg, #FFF8E7 0%, #FFF3CD 100%);
  border-bottom: 1px solid #FFE083;
  padding: 9px 32px; font-size: 12px; color: #856404;
  display: flex; align-items: center; justify-content: center;
  gap: 8px; font-weight: 500;
}
.j-banner-limit {
  background: linear-gradient(90deg, #FFF0EE 0%, #FEE2DC 100%);
  border-bottom: 1px solid #F5A090;
  padding: 9px 32px; font-size: 12px; color: #C0392B;
  display: flex; align-items: center; justify-content: center;
  gap: 8px; font-weight: 600;
}
```

### 2.14 Tela de modalidade — cards maiores
```css
.j-choice-modal {
  border: 2px solid var(--border);
  border-radius: 18px; padding: 28px 24px;
  cursor: pointer; background: white;
  transition: all .2s cubic-bezier(.22,.68,0,1.1);
  box-shadow: 0 2px 12px rgba(45,45,45,.05);
}
.j-choice-modal:hover {
  border-color: var(--tenant-primary);
  transform: translateY(-4px);
  box-shadow: 0 14px 36px rgba(232,115,90,.14);
}
.j-choice-modal.sel { border-color: var(--tenant-primary); background: var(--coral-p); }
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
}
.j-choice-modal:hover .j-choice-modal-tag,
.j-choice-modal.sel .j-choice-modal-tag { background: rgba(232,115,90,.15); color: var(--coral-d); }
```

### 2.15 SlotRow — botões Upload/Preencher com ícone
Os botões existentes (inline style) passam a usar a classe `.slot-btn`:
```css
.slot-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; padding: 5px 11px; border-radius: 7px;
  border: 1.5px solid var(--border-s); background: var(--cream);
  color: var(--ink-m); cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
  white-space: nowrap; flex-shrink: 0; transition: all .14s;
}
.slot-btn svg { width: 11px; height: 11px; }
.slot-btn.active { border-color: var(--coral); background: var(--coral-p); color: var(--coral-d); }
.slot-btn:hover { border-color: var(--ink-m); color: var(--ink); }
```

### 2.16 Mobile — steps bar scrollável
```css
@media (max-width: 640px) {
  .j-steps-bar { overflow-x: auto; scrollbar-width: none; }
  .j-steps-bar::-webkit-scrollbar { display: none; }
  .j-step-btn { white-space: nowrap; }
}
```

---

## 3. Mudanças em `app/[tenant]/page.tsx`

### 3.1 Botão Sair
```tsx
// antes:
<button onClick={logout} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', ... }}>
  Sair
</button>

// depois:
<button onClick={logout} className="j-btn-ghost">
  <LogOut size={12} /> Sair
</button>
```

### 3.2 Separadores com classe `done`
```tsx
{i < activeSteps.length - 1 && (
  <div className={`j-step-sep${i < step ? ' done' : ''}`} />
)}
```

### 3.3 Banners trial/limite
```tsx
// antes: inline style com background '#FFF3CD'
// depois:
<div className="j-banner-trial">
  <Clock size={13} /> Trial ativo até ...
</div>

<div className="j-banner-limit">
  <Lock size={13} /> Limite de contratos atingido ...
</div>
```

---

## 4. Mudanças em `StepModalidade.tsx`

- Trocar `.j-choice` / `.j-choices-3` por `.j-choice-modal` / grid explícito com 3 colunas
- Substituir emojis dos ícones por componentes Lucide:
  - Locação → `<Home />`
  - Compra e Venda → `<DollarSign />`
  - Escritura → `<FileText />`
- Adicionar `.j-choice-modal-icon` wrapper, `.j-choice-modal-tag` com "N etapas · OCR"
- Adicionar eyebrow + título antes dos cards: "Novo contrato" / "Selecione a modalidade"

---

## 5. Mudanças em `StepUpload.tsx`

### 5.1 GNT_OPTIONS — emojis → Lucide
| Antes | Depois |
|-------|--------|
| `🤝 Fiador` | `<Users size={16} />` |
| `🛡️ Seguro Fiança` | `<Shield size={16} />` |
| `💰 Caução` | `<DollarSign size={16} />` |
| `📜 Título` | `<FileText size={16} />` |
| `🏠 Imóvel Caucionado` | `<Home size={16} />` |

### 5.2 `renderSection` — emojis nos títulos → Lucide
| Antes | Depois |
|-------|--------|
| `🏠 Locadores` | `<Home size={15} /> Locadores` |
| `🔑 Locatários` | `<Users size={15} /> Locatários` |
| `🤝 Fiadores` | `<Handshake size={15} /> Fiadores` |
| `📍 Imóvel` | `<MapPin size={15} /> Imóvel` |
| `📋 Modelo de Contrato` | `<Shield size={15} /> Modelo de Contrato` |

### 5.3 `SlotRow` — botões com classes `.slot-btn` + ícones Lucide
- Botão Upload: `<Upload size={11} /> Upload`
- Botão Preencher: `<Pencil size={11} /> Preencher`
- Estado done: `<CheckCircle2 size={11} />` em verde sage
- Estado loading: `<Loader2 size={11} className="j-spin" />`
- Estado error: `<AlertCircle size={11} />` em coral

### 5.4 Botão "Adicionar pessoa" — ícone Plus
```tsx
<Plus size={14} /> Adicionar {meta.label}
```

---

## 6. Mudanças nos demais componentes

Todos os emojis inline nos componentes abaixo devem ser substituídos por Lucide:

| Componente | Emojis a substituir |
|-----------|---------------------|
| `StepReview.tsx` | Ícones de pessoa, imóvel, edição |
| `StepContrato.tsx` | Ícones de calendário, dinheiro, cláusulas |
| `StepGerar.tsx` | Ícones de download, envio, DocuSign |
| `StepPartesCV.tsx` | Ícones de pessoa, empresa |
| `StepNegocioCV.tsx` | Ícones de imóvel, valor, prazo |
| `StepGerarCV.tsx` | Ícones de download, check |
| `CorretorSearch.tsx` | Ícone de busca |

A substituição deve ser feita componente por componente, auditando cada emoji e escolhendo o ícone Lucide semanticamente correto.

---

## 7. Fora de Escopo

- Mudanças na lógica de negócio, OCR, geração de contratos
- Mudanças no schema do Supabase
- Adição de dark mode
- Refactor da estrutura de componentes
- Novas funcionalidades
