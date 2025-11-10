-- Add payment gateway fields to subscription_plans
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS payment_gateway_id uuid REFERENCES payment_gateways(id),
ADD COLUMN IF NOT EXISTS checkout_url text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_payment_gateway 
ON subscription_plans(payment_gateway_id);