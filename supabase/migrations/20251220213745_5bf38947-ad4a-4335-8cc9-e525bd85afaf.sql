-- Create table for multiple gateway IDs per offer
CREATE TABLE public.plan_offer_gateway_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_offer_id UUID NOT NULL REFERENCES plan_offers(id) ON DELETE CASCADE,
  gateway_offer_id VARCHAR NOT NULL,
  description VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(gateway_offer_id)
);

-- Enable RLS
ALTER TABLE public.plan_offer_gateway_ids ENABLE ROW LEVEL SECURITY;

-- Super admins can manage gateway ids
CREATE POLICY "Super admins can manage gateway ids" ON public.plan_offer_gateway_ids
  FOR ALL USING (has_system_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_system_role(auth.uid(), 'super_admin'));

-- Migrate existing gateway_offer_id to new table
INSERT INTO public.plan_offer_gateway_ids (plan_offer_id, gateway_offer_id, description)
SELECT id, gateway_offer_id, 'ID Principal (migrado)'
FROM public.plan_offers
WHERE gateway_offer_id IS NOT NULL AND gateway_offer_id != '';