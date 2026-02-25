export type UserRole = 'player' | 'cashier' | 'admin' | 'superadmin';
export type KycStatus = 'pending' | 'verified' | 'rejected';
export type TransactionType = 'deposit' | 'withdrawal' | 'bet' | 'win' | 'bonus' | 'rollback' | 'voucher_redeem';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled' | 'cashout';
export type BonusStatus = 'active' | 'completed' | 'expired' | 'cancelled';
export type VoucherStatus = 'active' | 'redeemed' | 'expired' | 'cancelled';
export type WebhookType = 'authenticate' | 'bet' | 'win' | 'rollback';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  currency: string;
  language: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  username: string;
  email: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  country_code: string | null;
  role: UserRole;
  kyc_status: KycStatus;
  is_active: boolean;
  is_self_excluded: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  real_balance: string;
  bonus_balance: string;
  locked_balance: string;
  updated_at: string;
}

export interface Game {
  id: number;
  title: string;
  producer: string | null;
  category: string | null;
  type: string | null;
  image_url: string | null;
  horizontal_image_url: string | null;
  vertical_image_url: string | null;
  currencies_supported: string[];
  countries_supported: string[];
  has_demo: boolean;
  has_freespins: boolean;
  has_bonusbuy: boolean;
  has_jackpots: boolean;
  is_active: boolean;
  last_synced_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: string;
  currency: string;
  balance_before: string | null;
  balance_after: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  status: TransactionStatus;
  created_at: string;
}

export interface Voucher {
  id: string;
  tenant_id: string;
  cashier_id: string;
  code: string;
  pin: string | null;
  amount: string;
  currency: string;
  status: VoucherStatus;
  redeemed_by: string | null;
  redeemed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface WebhookPayload {
  type: WebhookType;
  player_id: string;
  currency: string;
  game_id?: number;
  transaction_id?: string;
  amount?: number;
  round_id?: string;
  finished?: boolean;
}

export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
  username: string;
}
