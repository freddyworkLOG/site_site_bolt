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

-- Admin policies (for future use - authenticated users can manage)
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

-- Insert sample products for testing
INSERT INTO products (name_en, name_fr, name_ar, description_en, description_fr, description_ar, images, category) VALUES
  ('Elegant Black Abaya', 'Abaya Noire Élégante', 'عباية سوداء أنيقة', 'A stunning black abaya with intricate embroidery', 'Une magnifique abaya noire avec des broderies délicates', 'عباية سوداء جميلة بتطريز معقد', '["https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=600"]'::jsonb, 'abayas'),
  ('Flowing Jilbab', 'Jilbab Fluide', 'جلباب واسع', 'Comfortable and stylish jilbab for everyday wear', 'Jilbab confortable et élégant pour le quotidien', 'جلباب مريح وأنيق للاستخدام اليومي', '["https://images.pexels.com/photos/6767538/pexels-photo-6767538.jpeg?auto=compress&cs=tinysrgb&w=600"]'::jsonb, 'jilbabs'),
  ('Silk Kimono', 'Kimono en Soie', 'كيمونو حرير', 'Luxurious silk kimono with delicate patterns', 'Kimono luxueux en soie aux motifs délicats', 'كيمونو حرير فاخر بأنماط دقيقة', '["https://images.pexels.com/photos/5370682/pexels-photo-5370682.jpeg?auto=compress&cs=tinysrgb&w=600"]'::jsonb, 'kimonos'),
  ('Modest Ensemble', 'Ensemble Modeste', 'طقم محتشم', 'Complete modest outfit perfect for any occasion', 'Tenue modeste complète parfaite pour toute occasion', 'طقم محتشم كامل مثالي لأي مناسبة', '["https://images.pexels.com/photos/6269449/pexels-photo-6269449.jpeg?auto=compress&cs=tinysrgb&w=600"]'::jsonb, 'ensembles'),
  ('Embroidered Abaya', 'Abaya Brodée', 'عباة مطرزة', 'Beautiful abaya with golden thread embroidery', 'Belle abaya avec broderie de fil doré', 'عباية جميلة بتطريز خيوط ذهبية', '["https://images.pexels.com/photos/7578390/pexels-photo-7578390.jpeg?auto=compress&cs=tinysrgb&w=600"]'::jsonb, 'abayas'),
  ('Casual Jilbab', 'Jilbab Décontracté', 'جلباب كاجوال', 'Light and breathable jilbab for casual outings', 'Jilbab léger et respirant pour les sorties décontractées', 'جلباب خفيف مريح للخروجات الكاجوال', '["https://images.pexels.com/photos/6767540/pexels-photo-6767540.jpeg?auto=compress&cs=tinysrgb&w=600"]'::jsonb, 'jilbabs');

-- Insert variants with different prices
INSERT INTO product_variants (product_id, sku, size, price_dzd, stock_quantity) VALUES
  ((SELECT id FROM products WHERE name_en = 'Elegant Black Abaya'), 'ABA-BLK-S', 'S', 8500, 10),
  ((SELECT id FROM products WHERE name_en = 'Elegant Black Abaya'), 'ABA-BLK-M', 'M', 8500, 15),
  ((SELECT id FROM products WHERE name_en = 'Elegant Black Abaya'), 'ABA-BLK-L', 'L', 9000, 8),
  ((SELECT id FROM products WHERE name_en = 'Flowing Jilbab'), 'JIL-FLW-S', 'S', 7200, 12),
  ((SELECT id FROM products WHERE name_en = 'Flowing Jilbab'), 'JIL-FLW-M', 'M', 7200, 18),
  ((SELECT id FROM products WHERE name_en = 'Flowing Jilbab'), 'JIL-FLW-L', 'L', 7500, 5),
  ((SELECT id FROM products WHERE name_en = 'Silk Kimono'), 'KIM-SIL-FS', 'Free Size', 12000, 6),
  ((SELECT id FROM products WHERE name_en = 'Modest Ensemble'), 'ENS-MOD-S', 'S', 15000, 4),
  ((SELECT id FROM products WHERE name_en = 'Modest Ensemble'), 'ENS-MOD-M', 'M', 15000, 7),
  ((SELECT id FROM products WHERE name_en = 'Modest Ensemble'), 'ENS-MOD-L', 'L', 15500, 3),
  ((SELECT id FROM products WHERE name_en = 'Embroidered Abaya'), 'ABA-EMB-S', 'S', 11000, 9),
  ((SELECT id FROM products WHERE name_en = 'Embroidered Abaya'), 'ABA-EMB-M', 'M', 11000, 11),
  ((SELECT id FROM products WHERE name_en = 'Casual Jilbab'), 'JIL-CAS-S', 'S', 6500, 20),
  ((SELECT id FROM products WHERE name_en = 'Casual Jilbab'), 'JIL-CAS-M', 'M', 6500, 25),
  ((SELECT id FROM products WHERE name_en = 'Casual Jilbab'), 'JIL-CAS-L', 'L', 6800, 15);