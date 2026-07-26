-- Delivery slips table (tracking numbers from carriers like ZR Express, Yalidine)
CREATE TABLE delivery_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number text,
  service text NOT NULL CHECK (service IN ('zr', 'yalidine')),
  raw_response jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_delivery_slips_order_id ON delivery_slips(order_id);
CREATE INDEX idx_delivery_slips_tracking ON delivery_slips(tracking_number);

-- Enable RLS
ALTER TABLE delivery_slips ENABLE ROW LEVEL SECURITY;

-- Admin (authenticated) can read delivery slips
CREATE POLICY "delivery_slips_select_admin" ON delivery_slips FOR SELECT
  TO authenticated USING (true);

-- Admin (authenticated) can insert delivery slips
CREATE POLICY "delivery_slips_insert_admin" ON delivery_slips FOR INSERT
  TO authenticated WITH CHECK (true);

-- Admin (authenticated) can update delivery slips
CREATE POLICY "delivery_slips_update_admin" ON delivery_slips FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Admin (authenticated) can delete delivery slips
CREATE POLICY "delivery_slips_delete_admin" ON delivery_slips FOR DELETE
  TO authenticated USING (true);
