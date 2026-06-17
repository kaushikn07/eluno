-- Frames table
CREATE TABLE frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('eyeglasses', 'sunglasses', 'clipon')),
  gender TEXT CHECK (gender IN ('men', 'women', 'unisex')),
  price_inr INTEGER NOT NULL,
  stock_qty INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lens catalog
CREATE TABLE lens_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lens_type TEXT CHECK (lens_type IN ('single_vision', 'progressive', 'bifocal')),
  index NUMERIC(3,2),
  coating TEXT CHECK (coating IN ('UC', 'HC', 'HMC', 'SHMC', 'Blue')),
  sla_days INTEGER NOT NULL,
  price_inr INTEGER NOT NULL
);

-- Lens inventory
CREATE TABLE lens_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lens_catalog_id UUID REFERENCES lens_catalog(id),
  sph_min NUMERIC(4,2),
  sph_max NUMERIC(4,2),
  cyl_min NUMERIC(4,2),
  cyl_max NUMERIC(4,2),
  qty_in_stock INTEGER DEFAULT 0,
  reorder_threshold INTEGER DEFAULT 5,
  supplier_lead_days INTEGER DEFAULT 3,
  CONSTRAINT chk_stock_positive CHECK (qty_in_stock >= 0)
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'dummy',
  store_location TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  frame_id UUID REFERENCES frames(id),
  lens_catalog_id UUID REFERENCES lens_catalog(id),
  sph_right NUMERIC(4,2),
  cyl_right NUMERIC(4,2),
  axis_right INTEGER,
  sph_left NUMERIC(4,2),
  cyl_left NUMERIC(4,2),
  axis_left INTEGER,
  pd NUMERIC(4,1),
  add_power NUMERIC(3,2),
  fulfilment_mode TEXT CHECK (fulfilment_mode IN ('in_house', 'sourcing_required')),
  status TEXT,
  sla_deadline TIMESTAMPTZ,
  is_reorder BOOLEAN DEFAULT FALSE,
  parent_order_id UUID REFERENCES orders(id),
  qc_fail_count INTEGER DEFAULT 0,
  max_reorder_attempts INTEGER DEFAULT 3,
  breach_risk_score NUMERIC(3,2),
  breach_predicted_date TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order status log
CREATE TABLE order_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT,
  delay_reason TEXT,
  version_at_change INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ops team members
CREATE TABLE ops_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('ops_manager', 'store_staff')),
  store_location TEXT,
  whatsapp_number TEXT,
  email TEXT
);

-- Alerts log
CREATE TABLE alerts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  recipient_id UUID REFERENCES ops_team_members(id),
  channel TEXT CHECK (channel IN ('whatsapp', 'email')),
  breach_risk_score NUMERIC(3,2),
  message_body TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_status ON orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_store ON orders(store_location) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_lens_type ON orders(lens_catalog_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_sla ON orders(sla_deadline) WHERE deleted_at IS NULL;

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
