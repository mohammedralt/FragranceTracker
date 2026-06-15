-- Run this in Supabase SQL editor to add a variant label column.
-- Stores the Shopify variant title (e.g. "100ml", "3.4 oz", "Sample", "Travel Spray")
-- so the website can show what each listing actually is, not just the retailer name.

ALTER TABLE tracked_products ADD COLUMN IF NOT EXISTS variant_label TEXT;
