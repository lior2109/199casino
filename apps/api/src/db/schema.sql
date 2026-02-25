CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#00e5ff',
  secondary_color VARCHAR(7) DEFAULT '#f5c842',
  currency VARCHAR(3) DEFAULT 'ILS',
  language VARCHAR(5) DEFAULT 'he',
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  country_code VARCHAR(2),
  role VARCHAR(20) DEFAULT 'player',
  kyc_status VARCHAR(20) DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  is_self_excluded BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id),
  currency VARCHAR(3) NOT NULL DEFAULT 'ILS',
  real_balance DECIMAL(15,2) DEFAULT 0.00,
  bonus_balance DECIMAL(15,2) DEFAULT 0.00,
  locked_balance DECIMAL(15,2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(30) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  balance_before DECIMAL(15,2),
  balance_after DECIMAL(15,2),
  reference_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE game_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  provider_transaction_id VARCHAR(255) UNIQUE NOT NULL,
  game_id INTEGER,
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  balance_before DECIMAL(15,2),
  balance_after DECIMAL(15,2),
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE games (
  id INTEGER PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  producer VARCHAR(100),
  category VARCHAR(50),
  type VARCHAR(50),
  image_url TEXT,
  horizontal_image_url TEXT,
  vertical_image_url TEXT,
  currencies_supported JSONB DEFAULT '[]',
  countries_supported JSONB DEFAULT '[]',
  has_demo BOOLEAN DEFAULT false,
  has_freespins BOOLEAN DEFAULT false,
  has_bonusbuy BOOLEAN DEFAULT false,
  has_jackpots BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  stake DECIMAL(15,2) NOT NULL,
  potential_win DECIMAL(15,2),
  actual_win DECIMAL(15,2),
  odds DECIMAL(10,3),
  currency VARCHAR(3) NOT NULL,
  metadata JSONB DEFAULT '{}',
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(30) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  rollover_requirement DECIMAL(15,2) DEFAULT 0,
  rollover_progress DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE player_freespins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  campaign_id VARCHAR(100) NOT NULL,
  freerounds_total INTEGER NOT NULL,
  freerounds_left INTEGER NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  cashier_id UUID REFERENCES users(id),
  code VARCHAR(20) UNIQUE NOT NULL,
  pin VARCHAR(10),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  redeemed_by UUID REFERENCES users(id),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cashier_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL,
  address TEXT,
  manager_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  ip_address INET,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_game_transactions_provider_tx ON game_transactions(provider_transaction_id);
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
