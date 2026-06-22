-- Products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_fr text NOT NULL,
  name_ar text NOT NULL,
  description_en text,
  description_fr text,
  description_ar text,
  images jsonb DEFAULT '[]'::jsonb,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product variants (sizes, colors, prices)
CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text UNIQUE,
  size text,
  color_en text,
  color_fr text,
  color_ar text,
  price_dzd integer NOT NULL,
  stock_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable (catalog is public)
CREATE POLICY "products_select_public" ON products FOR SELECT
  USING (is_active = true);

-- Variants are publicly readable when product is active
CREATE POLICY "variants_select_public" ON product_variants FOR SELECT
  USING (
    product_id IN (SELECT id FROM products WHERE is_active = true)
    AND is_active = true
  );

-- Admin policies
CREATE POLICY "products_insert_admin" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "products_update_admin" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "products_delete_admin" ON products FOR DELETE
  TO authenticated USING (true);

CREATE POLICY "variants_insert_admin" ON product_variants FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "variants_update_admin" ON product_variants FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "variants_delete_admin" ON product_variants FOR DELETE
  TO authenticated USING (true);
