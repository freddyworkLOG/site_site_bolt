-- Add category column to products
ALTER TABLE products ADD COLUMN category text;

-- Backfill existing products with categories
UPDATE products SET category = 'abayas' WHERE name_en IN ('Elegant Black Abaya', 'Embroidered Abaya');
UPDATE products SET category = 'jilbabs' WHERE name_en IN ('Flowing Jilbab', 'Casual Jilbab');
UPDATE products SET category = 'kimonos' WHERE name_en = 'Silk Kimono';
UPDATE products SET category = 'ensembles' WHERE name_en = 'Modest Ensemble';

-- Create index for category filtering
CREATE INDEX idx_products_category ON products(category);