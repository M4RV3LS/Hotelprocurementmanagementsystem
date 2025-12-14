-- Hotel Procurement Management System - Database Schema
-- This SQL script creates all necessary tables for the procurement system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. PAYMENT METHODS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 2. ITEM CATEGORIES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS item_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 3. MASTER ITEMS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS master_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand_name TEXT,
  category TEXT,
  category_id UUID REFERENCES item_categories(id) ON DELETE SET NULL,
  uom TEXT,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_master_items_code ON master_items(code);
CREATE INDEX IF NOT EXISTS idx_master_items_category_id ON master_items(category_id);

-- ================================================================
-- 4. VENDORS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  region TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  contact_person TEXT,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  ppn_percentage NUMERIC(5,2) DEFAULT 0,
  service_charge_percentage NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  agreement_link TEXT,
  agreements JSONB DEFAULT '[]'::jsonb,
  property_type TEXT DEFAULT 'All',
  
  -- Legal/Bank Information
  nib_number TEXT,
  nib_file_link TEXT,
  ktp_number TEXT,
  ktp_file_link TEXT,
  npwpd_number TEXT,
  npwpd_file_link TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_account_doc_link TEXT,
  legal_doc_link TEXT,
  delivery_fee NUMERIC(15,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendors_code ON vendors(code);

-- ================================================================
-- 5. VENDOR CATALOG ITEMS TABLE (Many-to-Many with pricing)
-- ================================================================
CREATE TABLE IF NOT EXISTS vendor_catalog_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES master_items(id) ON DELETE CASCADE,
  price_type TEXT, -- 'fixed' or 'range'
  unit_price NUMERIC(15,2),
  min_quantity INTEGER,
  agreement_number TEXT,
  wht_percentage NUMERIC(5,2) DEFAULT 0,
  property_types JSONB DEFAULT '[]'::jsonb,
  selected_photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, item_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_catalog_vendor_id ON vendor_catalog_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_catalog_item_id ON vendor_catalog_items(item_id);

-- ================================================================
-- 6. PROCUREMENT REQUESTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS procurement_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_number TEXT UNIQUE NOT NULL,
  pr_date DATE NOT NULL,
  property_name TEXT NOT NULL,
  property_code TEXT NOT NULL,
  property_address TEXT,
  region TEXT DEFAULT 'DKI Jakarta',
  property_type TEXT DEFAULT 'Leasing',
  brand_name TEXT DEFAULT 'RedDoorz',
  requestor_name TEXT NOT NULL,
  requestor_email TEXT NOT NULL,
  pic_name TEXT,
  pic_number TEXT,
  status TEXT DEFAULT 'Waiting Vendor Assignment',
  note TEXT,
  po_file_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_procurement_requests_pr_number ON procurement_requests(pr_number);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_status ON procurement_requests(status);

-- ================================================================
-- 7. REQUEST ITEMS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS request_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES procurement_requests(id) ON DELETE CASCADE,
  master_item_id UUID REFERENCES master_items(id) ON DELETE SET NULL,
  item_name_snapshot TEXT NOT NULL,
  status TEXT DEFAULT 'Waiting Vendor Assignment',
  item_status TEXT DEFAULT 'Not Set',
  quantity INTEGER NOT NULL,
  uom TEXT NOT NULL,
  assigned_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  payment_terms TEXT,
  unit_price NUMERIC(15,2),
  tax_percentage NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(15,2),
  total_price NUMERIC(15,2),
  po_number TEXT,
  po_date DATE,
  purchase_order_id UUID,
  estimated_delivery_start DATE,
  estimated_delivery_end DATE,
  delivery_proof_id TEXT, -- Can store JSON array of proof IDs
  rejection_reason TEXT,
  rejection_proof_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_request_items_request_id ON request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_request_items_master_item_id ON request_items(master_item_id);
CREATE INDEX IF NOT EXISTS idx_request_items_vendor_id ON request_items(assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_request_items_po_id ON request_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_request_items_status ON request_items(status);

-- ================================================================
-- 8. ACTIVITY LOGS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES procurement_requests(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_logs_request_id ON activity_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);

-- ================================================================
-- 9. PURCHASE ORDERS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number TEXT UNIQUE NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  generated_date DATE NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  status TEXT DEFAULT 'Open',
  approval_status TEXT DEFAULT 'Pending',
  signed_po_link TEXT,
  delivery_proofs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

-- Add foreign key to request_items for purchase_order_id
ALTER TABLE request_items 
ADD CONSTRAINT fk_request_items_purchase_order 
FOREIGN KEY (purchase_order_id) 
REFERENCES purchase_orders(id) 
ON DELETE SET NULL;

-- ================================================================
-- 10. STORAGE BUCKETS SETUP
-- ================================================================
-- Note: Storage buckets need to be created via Supabase UI or storage API
-- Buckets needed:
-- 1. "Delivery Proof" - for delivery proof files and rejection proofs
-- 2. "Signed PO" - for signed purchase orders (if separate bucket desired)

-- ================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================
-- Enable RLS on all tables
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users (adjust as needed)
-- For development/demo purposes, allowing all operations with anon key

-- Payment Methods
CREATE POLICY "Allow all operations on payment_methods" ON payment_methods
  FOR ALL USING (true) WITH CHECK (true);

-- Item Categories
CREATE POLICY "Allow all operations on item_categories" ON item_categories
  FOR ALL USING (true) WITH CHECK (true);

-- Master Items
CREATE POLICY "Allow all operations on master_items" ON master_items
  FOR ALL USING (true) WITH CHECK (true);

-- Vendors
CREATE POLICY "Allow all operations on vendors" ON vendors
  FOR ALL USING (true) WITH CHECK (true);

-- Vendor Catalog Items
CREATE POLICY "Allow all operations on vendor_catalog_items" ON vendor_catalog_items
  FOR ALL USING (true) WITH CHECK (true);

-- Procurement Requests
CREATE POLICY "Allow all operations on procurement_requests" ON procurement_requests
  FOR ALL USING (true) WITH CHECK (true);

-- Request Items
CREATE POLICY "Allow all operations on request_items" ON request_items
  FOR ALL USING (true) WITH CHECK (true);

-- Activity Logs
CREATE POLICY "Allow all operations on activity_logs" ON activity_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Purchase Orders
CREATE POLICY "Allow all operations on purchase_orders" ON purchase_orders
  FOR ALL USING (true) WITH CHECK (true);

-- ================================================================
-- 12. SEED DATA (Optional - Basic Payment Methods)
-- ================================================================
INSERT INTO payment_methods (name, is_active) VALUES
  ('Bank Transfer', true),
  ('Cash', true),
  ('Credit', true)
ON CONFLICT (name) DO NOTHING;

-- ================================================================
-- 13. FUNCTIONS AND TRIGGERS (Optional)
-- ================================================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_item_categories_updated_at BEFORE UPDATE ON item_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_items_updated_at BEFORE UPDATE ON master_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_catalog_items_updated_at BEFORE UPDATE ON vendor_catalog_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procurement_requests_updated_at BEFORE UPDATE ON procurement_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_request_items_updated_at BEFORE UPDATE ON request_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
