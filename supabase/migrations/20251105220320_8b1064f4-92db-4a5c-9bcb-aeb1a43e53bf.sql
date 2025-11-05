-- Create system_settings table for general settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_name TEXT NOT NULL DEFAULT 'CopyDrive',
  system_description TEXT,
  logo_light_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.system_settings (system_name, system_description)
VALUES ('CopyDrive', 'Plataforma de gerenciamento de copy');

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can read and update system settings
CREATE POLICY "Super admins can view system settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update system settings"
  ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (has_system_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_system_role(auth.uid(), 'super_admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default integrations
INSERT INTO public.integrations (name, slug, description, is_enabled)
VALUES 
  ('Ticto', 'ticto', 'Integração com a plataforma Ticto', false),
  ('Stripe', 'stripe', 'Processamento de pagamentos', false);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage integrations
CREATE POLICY "Super admins can view integrations"
  ON public.integrations
  FOR SELECT
  TO authenticated
  USING (has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update integrations"
  ON public.integrations
  FOR UPDATE
  TO authenticated
  USING (has_system_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_system_role(auth.uid(), 'super_admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();