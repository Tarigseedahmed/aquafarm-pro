-- PostgreSQL initial schema for AquaFarm Pro (core tables)
-- Encoding: UTF-8

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tenancy
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  locale TEXT DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IAM
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  locale TEXT DEFAULT 'ar',
  role_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, email)
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE(tenant_id, name)
);

-- Farm
CREATE TABLE IF NOT EXISTS ponds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  capacity_kg NUMERIC(12,2),
  location TEXT,
  notes TEXT,
  UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS production_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pond_id UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  species TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  target_weight_g NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS fish_batch_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES production_cycles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  avg_weight_g NUMERIC(10,2),
  total_count INTEGER,
  mortality INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT,
  stock_qty_kg NUMERIC(12,3) DEFAULT 0,
  UNIQUE(tenant_id, sku)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('feed','supply','medicine')),
  item_id UUID NOT NULL,
  qty NUMERIC(12,3) NOT NULL,
  unit TEXT DEFAULT 'kg',
  type TEXT NOT NULL CHECK (type IN ('in','out','adjust')),
  ref TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS water_quality_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pond_id UUID NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL,
  ph NUMERIC(4,2),
  do_mg_l NUMERIC(5,2),
  ammonia_mg_l NUMERIC(6,3),
  temp_c NUMERIC(5,2),
  source TEXT DEFAULT 'manual'
);

-- Accounting (minimal)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
  parent_id UUID REFERENCES accounts(id),
  UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ref TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  memo TEXT
);

CREATE TABLE IF NOT EXISTS journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  debit NUMERIC(14,2) DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(14,2) DEFAULT 0 CHECK (credit >= 0)
);

-- RLS setup
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ponds ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fish_batch_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_quality_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;

-- Assume a SET app.tenant_id = '...' per session
CREATE OR REPLACE FUNCTION current_tenant() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.tenant_id', true)::uuid
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_settings WHERE name = 'app.tenant_id') THEN
    PERFORM set_config('app.tenant_id', '00000000-0000-0000-0000-000000000000', false);
  END IF;
END $$;

-- RLS policies
CREATE POLICY tenants_isolation ON tenants
  USING (id = current_tenant());

CREATE POLICY tenant_fk_filter_users ON users
  USING (tenant_id = current_tenant());

CREATE POLICY tenant_fk_filter_roles ON roles
  USING (tenant_id = current_tenant());

CREATE POLICY tenant_fk_filter_common ON ponds
  USING (tenant_id = current_tenant());
CREATE POLICY tenant_fk_filter_cycles ON production_cycles
  USING (tenant_id = current_tenant());
CREATE POLICY tenant_fk_filter_msr ON fish_batch_measurements
  USING (tenant_id = current_tenant());
CREATE POLICY tenant_fk_filter_feeds ON feeds
  USING (tenant_id = current_tenant());
CREATE POLICY tenant_fk_filter_inv ON inventory_transactions
  USING (tenant_id = current_tenant());
CREATE POLICY tenant_fk_filter_wq ON water_quality_readings
  USING (tenant_id = current_tenant());

CREATE POLICY tenant_fk_filter_acc ON accounts
  USING (tenant_id = current_tenant());
CREATE POLICY tenant_fk_filter_je ON journal_entries
  USING (tenant_id = current_tenant());
CREATE POLICY tenant_fk_filter_jl ON journal_lines
  USING (tenant_id = current_tenant());

-- Balance constraint (view or trigger later).