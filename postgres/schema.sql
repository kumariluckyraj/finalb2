CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer', 'vendor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_applications (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  mobile text NOT NULL,
  gst_number text NOT NULL,
  pan_number text NOT NULL,
  aadhaar_card_url text NOT NULL,
  gst_certificate_url text NOT NULL,
  pan_card_url text NOT NULL,
  account_holder_name text NOT NULL,
  account_number text NOT NULL,
  ifsc_code text NOT NULL,
  store_name text NOT NULL,
  store_description text,
  store_logo_url text,
  store_banner_url text,
  product_category text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  user_id text UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vendor_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  actual_price numeric(12,2) NOT NULL,
  price numeric(12,2) NOT NULL,
  discount numeric(12,2) NOT NULL,
  image text NOT NULL,
  stock integer,
  max_coin_redemption_percent integer NOT NULL DEFAULT 10 CHECK (max_coin_redemption_percent BETWEEN 0 AND 100),
  weight text,
  dimensions text,
  size text,
  brand text,
  author text,
  material text,
  flavor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  product_id text NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  vendor_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  size text,
  address_full_name text,
  address_phone text,
  address_line1 text,
  address_line2 text,
  address_city text,
  address_state text,
  address_pincode text,
  payment_method text NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('razorpay', 'cod')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  razorpay_order_id text,
  razorpay_payment_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processed', 'picked_up', 'shipped', 'hub', 'out_for_delivery', 'delivered')),
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_tracking_events (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  label text NOT NULL,
  description text,
  timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  scope_key text NOT NULL UNIQUE DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cart_id text NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  size text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id, size)
);

CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id text REFERENCES products(id) ON DELETE CASCADE,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  user_name text,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  comment text,
  images text[] DEFAULT '{}',
  video text,
  helpful_count integer NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS otps (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  phone text NOT NULL UNIQUE,
  otp text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_applications_status_created_at ON vendor_applications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id_created_at ON products (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_created_at ON products (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products (stock);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id_created_at ON orders (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_product_id_created_at ON orders (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_tracking_events_order_id_timestamp ON order_tracking_events (order_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id_product_id_size ON cart_items (cart_id, product_id, size);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id_created_at ON reviews (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps (phone);

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;

CREATE TABLE IF NOT EXISTS user_addresses (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses (user_id);

-- === SuperCoins Loyalty System ===

CREATE TABLE IF NOT EXISTS wallets (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned integer NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  lifetime_spent integer NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
  lifetime_expired integer NOT NULL DEFAULT 0 CHECK (lifetime_expired >= 0),
  lifetime_refunded integer NOT NULL DEFAULT 0 CHECK (lifetime_refunded >= 0),
  pending_coins integer NOT NULL DEFAULT 0 CHECK (pending_coins >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wallet_id text NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'earn', 'spend', 'refund', 'expire', 'adjustment',
    'admin_credit', 'admin_debit', 'reversal',
    'promotional_credit', 'referral_reward'
  )),
  amount integer NOT NULL CHECK (amount > 0),
  balance_before integer NOT NULL CHECK (balance_before >= 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  source text NOT NULL,
  reference_type text,
  reference_id text,
  campaign_id text,
  expiry_date timestamptz,
  description text NOT NULL DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coin_rules (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  rule_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  rule_type text NOT NULL CHECK (rule_type IN ('earn', 'spend', 'limit', 'expiry', 'tier')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  campaign_type text NOT NULL CHECK (campaign_type IN (
    'festival', 'promotional', 'category_bonus', 'brand_bonus',
    'game', 'lucky_wheel', 'scratch_card', 'achievement'
  )),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  budget_coins integer NOT NULL DEFAULT 0 CHECK (budget_coins >= 0),
  coins_awarded integer NOT NULL DEFAULT 0 CHECK (coins_awarded >= 0),
  max_per_user integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS membership_tiers (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  level integer NOT NULL UNIQUE CHECK (level >= 1),
  min_lifetime_spend numeric(12,2) NOT NULL DEFAULT 0 CHECK (min_lifetime_spend >= 0),
  min_orders integer NOT NULL DEFAULT 0 CHECK (min_orders >= 0),
  min_coins_earned integer NOT NULL DEFAULT 0 CHECK (min_coins_earned >= 0),
  coin_multiplier numeric(4,2) NOT NULL DEFAULT 1.00 CHECK (coin_multiplier >= 0.50),
  max_redemption_percent integer NOT NULL DEFAULT 10 CHECK (max_redemption_percent BETWEEN 0 AND 100),
  max_redemption_coins integer NOT NULL DEFAULT 0,
  benefits jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_tier_history (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_id text NOT NULL REFERENCES membership_tiers(id) ON DELETE RESTRICT,
  previous_tier_id text REFERENCES membership_tiers(id) ON DELETE SET NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS redemption_rules (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN (
    'fixed_discount', 'percentage_discount', 'coupon',
    'partner_reward', 'gift_card', 'membership',
    'premium_subscription', 'exclusive_product', 'shipping_discount'
  )),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coin_expiry_batches (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  batch_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  coins_expired integer NOT NULL DEFAULT 0,
  users_affected integer NOT NULL DEFAULT 0,
  error_log jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_queue (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN (
    'coins_earned', 'coins_redeemed', 'coins_expiring',
    'membership_upgraded', 'campaign_available', 'birthday_reward'
  )),
  title text NOT NULL,
  body text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('push', 'email', 'sms', 'in_app')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  reference_type text,
  reference_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  admin_id text REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id_created_at ON wallet_transactions (wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id_type ON wallet_transactions (user_id, type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_idempotency_key ON wallet_transactions (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_dates ON campaigns (status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns (campaign_type);
CREATE INDEX IF NOT EXISTS idx_coin_rules_type_active ON coin_rules (rule_type, is_active);
CREATE INDEX IF NOT EXISTS idx_user_tier_history_user_id ON user_tier_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue (user_id, status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue (status, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

INSERT INTO membership_tiers (name, level, min_lifetime_spend, min_orders, min_coins_earned, coin_multiplier, max_redemption_percent, max_redemption_coins, benefits) VALUES
  ('Bronze', 1, 0, 0, 0, 1.00, 10, 500, '{"free_shipping": false, "early_sale_access": false, "birthday_bonus": 0, "exclusive_rewards": false}'),
  ('Silver', 2, 10000, 5, 500, 1.25, 15, 1000, '{"free_shipping": true, "early_sale_access": false, "birthday_bonus": 50, "exclusive_rewards": false}'),
  ('Gold', 3, 50000, 20, 2000, 1.50, 20, 2000, '{"free_shipping": true, "early_sale_access": true, "birthday_bonus": 100, "exclusive_rewards": false}'),
  ('Platinum', 4, 200000, 50, 10000, 2.00, 30, 5000, '{"free_shipping": true, "early_sale_access": true, "birthday_bonus": 250, "exclusive_rewards": true}'),
  ('Diamond', 5, 500000, 100, 50000, 3.00, 50, 10000, '{"free_shipping": true, "early_sale_access": true, "birthday_bonus": 500, "exclusive_rewards": true, "dedicated_support": true}')
ON CONFLICT (level) DO NOTHING;

INSERT INTO coin_rules (rule_key, name, description, rule_type, config, priority) VALUES
  ('spend_bonus', 'Spend Bonus', '5 coins per Rs.100 spent on qualifying orders', 'earn', '{"rate_per_100": 5, "qualifying_categories": [], "min_order_amount": 0}', 10),
  ('signup_bonus', 'Signup Bonus', 'Welcome coins for new user registration', 'earn', '{"coins": 50, "one_time": true}', 100),
  ('first_purchase', 'First Purchase Bonus', 'Bonus coins on first successful purchase', 'earn', '{"coins": 100, "one_time": true}', 90),
  ('email_verification', 'Email Verification', 'Coins for verifying email address', 'earn', '{"coins": 20, "one_time": true}', 80),
  ('phone_verification', 'Phone Verification', 'Coins for verifying phone number', 'earn', '{"coins": 20, "one_time": true}', 80),
  ('product_review', 'Product Review', 'Coins for writing a product review', 'earn', '{"coins": 10, "min_words": 20, "per_product_limit": 1}', 50),
  ('photo_review', 'Photo Review', 'Bonus coins for including a photo in review', 'earn', '{"coins": 15, "per_product_limit": 1}', 50),
  ('video_review', 'Video Review', 'Bonus coins for including a video in review', 'earn', '{"coins": 30, "per_product_limit": 1}', 50),
  ('daily_login', 'Daily Login', 'Coins for daily app login streak', 'earn', '{"base_coins": 1, "streak_bonus": {"day_7": 10, "day_15": 25, "day_30": 100}}', 30),
  ('referral', 'Referral Reward', 'Coins for referring a new user', 'earn', '{"referrer_coins": 100, "referee_coins": 50, "require_purchase": true}', 70)
ON CONFLICT (rule_key) DO NOTHING;

INSERT INTO redemption_rules (name, rule_type, config, priority) VALUES
  ('Cart Discount', 'fixed_discount', '{"min_cart_value": 100, "coin_value": 1, "description": "Use coins to get discount on your order"}', 10),
  ('Percentage Discount', 'percentage_discount', '{"min_cart_value": 200, "max_percent": 10, "description": "Pay up to 10% of cart value with coins"}', 20)
ON CONFLICT DO NOTHING;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS coins_used integer NOT NULL DEFAULT 0 CHECK (coins_used >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coin_discount numeric(12,2) NOT NULL DEFAULT 0 CHECK (coin_discount >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coins_earned integer NOT NULL DEFAULT 0 CHECK (coins_earned >= 0);

ALTER TABLE seller_products
  ADD COLUMN IF NOT EXISTS warehouse_address text,
  ADD COLUMN IF NOT EXISTS warehouse_city text,
  ADD COLUMN IF NOT EXISTS warehouse_state text,
  ADD COLUMN IF NOT EXISTS warehouse_pincode text;

  ALTER TABLE seller_products
  ADD COLUMN IF NOT EXISTS warehouse_address text,
  ADD COLUMN IF NOT EXISTS warehouse_city text,
  ADD COLUMN IF NOT EXISTS warehouse_state text,
  ADD COLUMN IF NOT EXISTS warehouse_pincode text;

-- Sub Admin / Employee support
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'sub_admin', 'employee', 'customer', 'vendor'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by text REFERENCES users(id) ON DELETE SET NULL;