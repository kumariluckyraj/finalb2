-- Seller System Schema
-- Extends the existing ecommerce platform with full seller capabilities

-- Seller Profiles (extends users table - a user becomes a seller)
CREATE TABLE IF NOT EXISTS seller_profiles (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_type text NOT NULL CHECK (business_type IN ('individual', 'company', 'brand')),
  phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  gst_pan text,
  business_logo_url text,
  onboarding_step integer NOT NULL DEFAULT 0,
  onboarding_completed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
  kyc_status text NOT NULL DEFAULT 'pending',
  kyc_method text NOT NULL DEFAULT 'manual',
  pan_number text,
  gst_number text,
  kyc_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seller Bank Accounts (separate from buyer payment methods)
CREATE TABLE IF NOT EXISTS seller_bank_accounts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  seller_id text NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  account_holder_name text NOT NULL,
  account_number text NOT NULL,
  confirm_account_number text NOT NULL,
  ifsc_code text NOT NULL,
  bank_name text,
  account_type text DEFAULT 'savings' CHECK (account_type IN ('savings', 'current')),
  is_primary boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Stores
CREATE TABLE IF NOT EXISTS stores (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  seller_id text NOT NULL UNIQUE REFERENCES seller_profiles(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  url_slug text NOT NULL UNIQUE,
  banner_url text,
  description text,
  shipping_policy text,
  return_policy text,
  primary_category text,
  subcategories jsonb DEFAULT '[]'::jsonb,
  rating numeric(3,2) DEFAULT 0,
  total_ratings integer DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  cod_enabled boolean NOT NULL DEFAULT true,
  delivery_promise_days integer NOT NULL DEFAULT 5,
  delivery_charge numeric(12,2) NOT NULL DEFAULT 40,
  free_shipping_threshold numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seller Products (extends existing products concept with richer data)
CREATE TABLE IF NOT EXISTS seller_products (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  seller_id text NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  store_id text REFERENCES stores(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text NOT NULL,
  brand text,
  category text NOT NULL,
  subcategory text,
  mrp numeric(12,2) NOT NULL,
  selling_price numeric(12,2) NOT NULL,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  sku text,
  barcode text,
  stock integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  weight numeric(10,2),
  weight_unit text DEFAULT 'kg',
  length numeric(10,2),
  width numeric(10,2),
  height numeric(10,2),
  dimension_unit text DEFAULT 'cm',
  ships_from text,
  handling_time integer DEFAULT 1,
  fulfillment_method text DEFAULT 'self' CHECK (fulfillment_method IN ('self', 'b2world')),
  search_title text,
  tags jsonb DEFAULT '[]'::jsonb,
  keywords jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'unlisted')),
  is_featured boolean NOT NULL DEFAULT false,
  is_promoted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Product coverage mode
ALTER TABLE seller_products
  ADD COLUMN IF NOT EXISTS coverage_type text NOT NULL DEFAULT 'PINCODE'
    CHECK (coverage_type IN ('PAN', 'STATE', 'DISTRICT', 'PINCODE'));

-- Product Coverage Areas (states / districts / pincodes a product ships to)
CREATE TABLE IF NOT EXISTS product_coverage_areas (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  seller_product_id text NOT NULL REFERENCES seller_products(id) ON DELETE CASCADE,
  area_type text NOT NULL CHECK (area_type IN ('STATE', 'DISTRICT', 'PINCODE')),
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_product_id, area_type, value)
);

-- Pincode -> state/district lookup cache (used to resolve buyer pincodes against STATE/DISTRICT coverage)
CREATE TABLE IF NOT EXISTS pincode_lookup_cache (
  pincode text PRIMARY KEY,
  state text NOT NULL,
  district text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Legacy pincode-only table (kept for backward compatibility / one-time backfill below).
-- If this already exists in your DB from before, this is a no-op.
CREATE TABLE IF NOT EXISTS product_serviceable_pincodes (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  seller_product_id text NOT NULL REFERENCES seller_products(id) ON DELETE CASCADE,
  pincode text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_product_id, pincode)
);

-- Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id text NOT NULL REFERENCES seller_products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  price numeric(12,2) NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Product Media
CREATE TABLE IF NOT EXISTS product_media (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id text NOT NULL REFERENCES seller_products(id) ON DELETE CASCADE,
  url text NOT NULL,
  type text NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video')),
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id text NOT NULL REFERENCES seller_products(id) ON DELETE CASCADE,
  variant_id text REFERENCES product_variants(id) ON DELETE SET NULL,
  change_type text NOT NULL CHECK (change_type IN ('stock_added', 'stock_reduced', 'order_placed', 'order_cancelled', 'return_received', 'manual_adjustment', 'bulk_update')),
  quantity_change integer NOT NULL,
  stock_before integer NOT NULL,
  stock_after integer NOT NULL,
  reason text,
  reference_type text,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seller Orders (seller's view of orders)
CREATE TABLE IF NOT EXISTS seller_orders (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id text NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES seller_products(id) ON DELETE RESTRICT,
  variant_id text REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  total_price numeric(12,2) NOT NULL,
  commission_percent numeric(5,2) NOT NULL DEFAULT 0,
  commission_amount numeric(12,2) NOT NULL DEFAULT 0,
  shipping_charge numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  net_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned')),
  tracking_number text,
  tracking_company text,
  shipping_label_url text,
  invoice_url text,
  shiprocket_order_id text,
  shiprocket_shipment_id text,
  buyer_note text,
  seller_note text,
  is_issue_raised boolean NOT NULL DEFAULT false,
  issue_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Return Requests
CREATE TABLE IF NOT EXISTS return_requests (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  seller_order_id text NOT NULL REFERENCES seller_orders(id) ON DELETE CASCADE,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id text NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  buyer_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'picked_up', 'refunded')),
  refund_status text DEFAULT 'pending' CHECK (refund_status IN ('pending', 'processing', 'completed', 'failed')),
  refund_amount numeric(12,2),
  pickup_address text,
  pickup_scheduled_at timestamptz,
  pickup_notes text,
  admin_note text,
  timeline jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Payouts
CREATE TABLE IF NOT EXISTS payouts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  seller_id text NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_sales numeric(12,2) NOT NULL DEFAULT 0,
  total_commission numeric(12,2) NOT NULL DEFAULT 0,
  total_shipping_deductions numeric(12,2) NOT NULL DEFAULT 0,
  total_taxes numeric(12,2) NOT NULL DEFAULT 0,
  total_refunds numeric(12,2) NOT NULL DEFAULT 0,
  net_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  payout_provider text DEFAULT 'manual',
  payout_reference text,
  paid_at timestamptz,
  invoice_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Payout Transactions
CREATE TABLE IF NOT EXISTS payout_transactions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  payout_id text NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  seller_order_id text REFERENCES seller_orders(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('sale', 'commission', 'shipping', 'tax', 'refund', 'adjustment')),
  amount numeric(12,2) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seller Reviews
CREATE TABLE IF NOT EXISTS seller_reviews (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  seller_id text NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  store_id text REFERENCES stores(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id text REFERENCES orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  seller_reply text,
  seller_replied_at timestamptz,
  is_flagged boolean NOT NULL DEFAULT false,
  flag_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, order_id)
);

-- Seller Messages
CREATE TABLE IF NOT EXISTS seller_messages (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  seller_id text NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  order_id text REFERENCES orders(id) ON DELETE SET NULL,
  broadcast_id text,
  subject text NOT NULL,
  body text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  sender_type text NOT NULL CHECK (sender_type IN ('seller', 'buyer', 'support')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Admin Broadcasts
CREATE TABLE IF NOT EXISTS broadcasts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  admin_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  target_seller_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  seller_id text NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  store_id text REFERENCES stores(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('discount_code', 'bundle_offer', 'platform_sale', 'featured_listing', 'promoted_product')),
  title text NOT NULL,
  description text,
  code text,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(12,2),
  min_order_value numeric(12,2),
  max_discount_amount numeric(12,2),
  bundle_product_ids jsonb DEFAULT '[]'::jsonb,
  bundle_price numeric(12,2),
  applicable_categories jsonb DEFAULT '[]'::jsonb,
  applicable_products jsonb DEFAULT '[]'::jsonb,
  per_user_limit integer DEFAULT 1,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  usage_limit integer,
  usage_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promotion_usage (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  promotion_id text NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  order_id text,
  used_count integer NOT NULL DEFAULT 1,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promotion_id, user_id)
);

-- Seller Analytics (aggregated)
CREATE TABLE IF NOT EXISTS seller_analytics (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  seller_id text NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  revenue numeric(12,2) NOT NULL DEFAULT 0,
  orders_count integer NOT NULL DEFAULT 0,
  visitors_count integer NOT NULL DEFAULT 0,
  conversion_count integer NOT NULL DEFAULT 0,
  top_product_id text REFERENCES seller_products(id) ON DELETE SET NULL,
  return_rate numeric(5,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON seller_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_status ON seller_profiles (status);
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_seller_id ON seller_bank_accounts (seller_id);
CREATE INDEX IF NOT EXISTS idx_stores_seller_id ON stores (seller_id);
CREATE INDEX IF NOT EXISTS idx_stores_url_slug ON stores (url_slug);
CREATE INDEX IF NOT EXISTS idx_seller_products_seller_id ON seller_products (seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_products_store_id ON seller_products (store_id);
CREATE INDEX IF NOT EXISTS idx_seller_products_category ON seller_products (category);
CREATE INDEX IF NOT EXISTS idx_seller_products_status ON seller_products (status);
CREATE INDEX IF NOT EXISTS idx_product_coverage_areas_product_id ON product_coverage_areas (seller_product_id);
CREATE INDEX IF NOT EXISTS idx_product_serviceable_pincodes_product_id ON product_serviceable_pincodes (seller_product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media (product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs (product_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_seller_id ON seller_orders (seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_order_id ON seller_orders (order_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_status ON seller_orders (status);
CREATE INDEX IF NOT EXISTS idx_return_requests_seller_id ON return_requests (seller_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests (status);
CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON payouts (seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts (status);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_payout_id ON payout_transactions (payout_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller_id ON seller_reviews (seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_store_id ON seller_reviews (store_id);
CREATE INDEX IF NOT EXISTS idx_seller_messages_seller_id ON seller_messages (seller_id);
CREATE INDEX IF NOT EXISTS idx_promotions_seller_id ON promotions (seller_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions (code);
CREATE INDEX IF NOT EXISTS idx_seller_analytics_seller_id_date ON seller_analytics (seller_id, date);

-- One-time backfill: copy any existing pincode-only rows into the new generalized table
INSERT INTO product_coverage_areas (seller_product_id, area_type, value)
SELECT seller_product_id, 'PINCODE', pincode FROM product_serviceable_pincodes
ON CONFLICT DO NOTHING;