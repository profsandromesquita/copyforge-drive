-- Create model_routing_config table
CREATE TABLE IF NOT EXISTS public.model_routing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copy_type TEXT NOT NULL UNIQUE,
  copy_type_label TEXT NOT NULL,
  default_model TEXT NOT NULL,
  available_models TEXT[] NOT NULL DEFAULT ARRAY['google/gemini-2.5-flash', 'openai/gpt-5-mini'],
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);

-- Index for performance
CREATE INDEX idx_model_routing_copy_type ON public.model_routing_config(copy_type);

-- Trigger for updated_at
CREATE TRIGGER update_model_routing_config_updated_at
  BEFORE UPDATE ON public.model_routing_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default configurations
INSERT INTO public.model_routing_config (copy_type, copy_type_label, default_model, description) VALUES
  ('anuncio', 'Anúncios', 'google/gemini-2.5-flash', 'Anúncios para redes sociais e mídia paga'),
  ('landing_page', 'Landing Page', 'openai/gpt-5-mini', 'Páginas de captura e vendas'),
  ('vsl', 'VSL (Vídeo de Vendas)', 'openai/gpt-5-mini', 'Scripts para vídeos de vendas'),
  ('email', 'E-mail Marketing', 'google/gemini-2.5-flash', 'E-mails promocionais e newsletters'),
  ('webinar', 'Webinar', 'openai/gpt-5-mini', 'Scripts e apresentações para webinários'),
  ('conteudo', 'Conteúdo', 'google/gemini-2.5-flash', 'Conteúdo geral e posts'),
  ('mensagem', 'Mensagem', 'google/gemini-2.5-flash', 'Mensagens diretas e atendimento'),
  ('outro', 'Outro', 'google/gemini-2.5-flash', 'Outros tipos de copy')
ON CONFLICT (copy_type) DO NOTHING;

-- Enable RLS
ALTER TABLE public.model_routing_config ENABLE ROW LEVEL SECURITY;

-- Super admins can manage routing config
CREATE POLICY "Super admins can manage routing config"
  ON public.model_routing_config
  FOR ALL
  TO authenticated
  USING (has_system_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_system_role(auth.uid(), 'super_admin'));

-- Everyone can view routing config
CREATE POLICY "Anyone can view routing config"
  ON public.model_routing_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Create model_routing_history table for audit trail
CREATE TABLE IF NOT EXISTS public.model_routing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copy_type TEXT NOT NULL,
  old_model TEXT NOT NULL,
  new_model TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);

CREATE INDEX idx_model_routing_history_copy_type ON public.model_routing_history(copy_type);
CREATE INDEX idx_model_routing_history_changed_at ON public.model_routing_history(changed_at DESC);