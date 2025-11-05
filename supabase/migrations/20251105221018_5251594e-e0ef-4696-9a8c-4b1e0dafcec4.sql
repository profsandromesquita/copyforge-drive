-- Create storage bucket for system assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-assets', 'system-assets', true)
ON CONFLICT (id) DO NOTHING;