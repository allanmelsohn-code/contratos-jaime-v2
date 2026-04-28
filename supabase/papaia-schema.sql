-- ════════════════════════════════════════════════════════════
--  PAPAIA — Schema
--  Execute no Supabase SQL Editor (Dashboard → SQL Editor)
--  Prefixo papaia_ garante isolamento do projeto existente
-- ════════════════════════════════════════════════════════════

-- ── Tenants ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS papaia_tenants (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug             TEXT UNIQUE NOT NULL,          -- ex: "jaime", "alfa-imoveis"
  nome             TEXT NOT NULL,
  cnpj             TEXT,
  creci            TEXT,
  logo_url         TEXT,
  cor_primaria     TEXT DEFAULT '#E8735A',
  cor_secundaria   TEXT DEFAULT '#8BAD8B',
  plano            TEXT DEFAULT 'trial' CHECK (plano IN ('trial','starter','pro','business')),
  contratos_usados INT  DEFAULT 0,
  contratos_limite INT  DEFAULT 10,
  status           TEXT DEFAULT 'trial' CHECK (status IN ('trial','active','suspended')),
  trial_ends_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Usuários (extends auth.users) ────────────────────────
CREATE TABLE IF NOT EXISTS papaia_users (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT NOT NULL,
  nome       TEXT,
  tenant_id  UUID REFERENCES papaia_tenants(id) ON DELETE SET NULL,
  role       TEXT DEFAULT 'user' CHECK (role IN ('superadmin','admin','user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-cria papaia_users ao cadastrar no Supabase Auth
CREATE OR REPLACE FUNCTION papaia_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO papaia_users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS papaia_on_auth_user_created ON auth.users;
CREATE TRIGGER papaia_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION papaia_handle_new_user();

-- ── Templates de contrato ─────────────────────────────────
CREATE TABLE IF NOT EXISTS papaia_contract_templates (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID REFERENCES papaia_tenants(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  tipo            TEXT DEFAULT 'residencial' CHECK (tipo IN ('residencial','comercial','temporada')),
  campos_padrao   JSONB DEFAULT '{}',   -- testemunhas, banco, cnpj_imob, etc.
  ativo           BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Cláusulas por template ────────────────────────────────
CREATE TABLE IF NOT EXISTS papaia_tenant_clauses (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES papaia_contract_templates(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  tipo        TEXT CHECK (tipo IN ('rigid','semi_rigid','variable')),
  conteudo    TEXT NOT NULL,            -- texto com {{placeholders}}
  condicao    JSONB DEFAULT NULL,       -- null=sempre | {"gnt":"fiador"} | {"tipo":"comercial"}
  ordem       INT  DEFAULT 0,
  ativo       BOOLEAN DEFAULT TRUE
);

-- ── Corretores por tenant ─────────────────────────────────
CREATE TABLE IF NOT EXISTS papaia_corretores (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES papaia_tenants(id) ON DELETE CASCADE,
  apelido   TEXT NOT NULL,
  nome      TEXT NOT NULL,
  cpf       TEXT,
  cnpj      TEXT,
  creci     TEXT,
  banco     TEXT,
  agencia   TEXT,
  conta     TEXT,
  pix       TEXT,
  "pixTipo" TEXT,
  obs       TEXT,
  ativo     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Log de contratos gerados ──────────────────────────────
CREATE TABLE IF NOT EXISTS papaia_contracts_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID REFERENCES papaia_tenants(id),
  user_id     UUID REFERENCES papaia_users(id),
  template_id UUID REFERENCES papaia_contract_templates(id),
  dados       JSONB DEFAULT '{}',
  gerado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS (Row Level Security) ──────────────────────────────
ALTER TABLE papaia_tenants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE papaia_users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE papaia_contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE papaia_tenant_clauses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE papaia_corretores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE papaia_contracts_log     ENABLE ROW LEVEL SECURITY;

-- Policies: service_role bypassa RLS automaticamente
-- As políticas abaixo cobrem acesso via anon key no client

-- Usuário lê seus próprios dados
CREATE POLICY "user_read_own" ON papaia_users
  FOR SELECT USING (auth.uid() = id);

-- Usuário lê dados do seu tenant
CREATE POLICY "user_read_tenant" ON papaia_tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM papaia_users WHERE id = auth.uid())
  );

-- Corretores: apenas do próprio tenant
CREATE POLICY "corretor_read_own_tenant" ON papaia_corretores
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM papaia_users WHERE id = auth.uid())
  );

-- Templates: apenas do próprio tenant
CREATE POLICY "template_read_own_tenant" ON papaia_contract_templates
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM papaia_users WHERE id = auth.uid())
  );

-- Cláusulas: apenas do próprio tenant (via template)
CREATE POLICY "clause_read_own_tenant" ON papaia_tenant_clauses
  FOR SELECT USING (
    template_id IN (
      SELECT id FROM papaia_contract_templates
      WHERE tenant_id IN (SELECT tenant_id FROM papaia_users WHERE id = auth.uid())
    )
  );

-- Log: usuário insere no seu tenant
CREATE POLICY "log_insert_own" ON papaia_contracts_log
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM papaia_users WHERE id = auth.uid())
  );

-- ── Primeiro superadmin ───────────────────────────────────
-- Após criar o usuário no Supabase Auth, rode:
-- UPDATE papaia_users SET role = 'superadmin' WHERE email = 'seu@email.com';
