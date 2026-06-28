-- Orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  wilaya text NOT NULL,
  commune text NOT NULL,
  address text NOT NULL,
  delivery_method text NOT NULL CHECK (delivery_method IN ('yalidine', 'zr')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal integer NOT NULL,
  delivery_fee integer DEFAULT 0,
  total integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  tracking_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_phone ON orders(customer_phone);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Orders are readable by anyone (for order confirmation page)
CREATE POLICY "orders_select_public" ON orders FOR SELECT
  USING (true);

-- Orders can be inserted by anyone (checkout flow)
CREATE POLICY "orders_insert_public" ON orders FOR INSERT
  WITH CHECK (true);

-- Admin policies for managing orders
CREATE POLICY "orders_update_admin" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "orders_delete_admin" ON orders FOR DELETE
  TO authenticated USING (true);
