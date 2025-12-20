-- Remove the duplicate foreign key constraint
-- Keeping only fk_gateways_integration to avoid ambiguity
ALTER TABLE public.payment_gateways 
DROP CONSTRAINT IF EXISTS payment_gateways_integration_id_fkey;