
-- Create coupon_codes table if it doesn't exist (it already exists based on the schema)
-- But we need to add some additional fields for better coupon management

-- Add discount_type and discount_value columns to coupon_codes table
ALTER TABLE public.coupon_codes 
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'category_override' CHECK (discount_type IN ('percentage', 'fixed_amount', 'category_override'));

ALTER TABLE public.coupon_codes 
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.coupon_codes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing coupons to use category_override type
UPDATE public.coupon_codes 
SET discount_type = 'category_override' 
WHERE discount_type IS NULL;
