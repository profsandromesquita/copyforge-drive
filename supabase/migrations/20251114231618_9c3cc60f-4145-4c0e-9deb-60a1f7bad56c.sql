-- Fase 1: Reestruturação da Arquitetura de Prompts

-- 1.1 Adicionar novos campos à tabela ai_prompt_templates
ALTER TABLE public.ai_prompt_templates 
ADD COLUMN IF NOT EXISTS user_editable_prompt TEXT,
ADD COLUMN IF NOT EXISTS system_instructions TEXT,
ADD COLUMN IF NOT EXISTS is_user_customizable BOOLEAN DEFAULT false;

-- 1.2 Atualizar prompts existentes separando as partes editável e estrutural

-- Prompt Base (generate_copy_base)
UPDATE public.ai_prompt_templates 
SET 
  user_editable_prompt = 'Você é um especialista em copywriting que cria conteúdo persuasivo e bem estruturado em português brasileiro. Sua missão é criar copies que conectam emocionalmente com o público, destacam benefícios claros e impulsionam a ação desejada.',
  system_instructions = E'INSTRUÇÕES DE FORMATO OBRIGATÓRIAS:\n\nVocê DEVE retornar a copy usando a estrutura de sessions e blocks através da ferramenta generate_copy.\n\nTipos de blocos disponíveis:\n- headline: Título principal (curto e impactante)\n- subheadline: Subtítulo explicativo\n- text: Texto corrido (parágrafos)\n- list: Lista de itens/benefícios\n- button: Call-to-action com texto do botão\n\nCada bloco pode ter configurações de estilo:\n- fontSize: "small", "medium", "large"\n- textAlign: "left", "center", "right"\n- fontWeight: "normal", "semibold", "bold"\n\nOrganize o conteúdo em sessions lógicas e use os tipos de blocos apropriados para cada elemento.',
  is_user_customizable = true
WHERE prompt_key = 'generate_copy_base';

-- Prompt de Anúncio (generate_copy_ad)
UPDATE public.ai_prompt_templates 
SET 
  user_editable_prompt = 'Você é um especialista em criar anúncios publicitários persuasivos e de alto impacto. Seu foco é capturar atenção rapidamente, comunicar benefícios claros e gerar cliques. Use linguagem direta, emocionalmente envolvente e focada em resultados.',
  system_instructions = E'INSTRUÇÕES DE FORMATO OBRIGATÓRIAS:\n\nVocê DEVE retornar o anúncio usando a estrutura de sessions e blocks através da ferramenta generate_copy.\n\nPara anúncios, priorize:\n- headlines curtas e impactantes (máx 60 caracteres)\n- texto conciso focado em 1-2 benefícios principais\n- CTAs claros e diretos\n- Estrutura visual hierárquica\n\nTipos de blocos: headline, subheadline, text, list, button\nConfigurações: fontSize, textAlign, fontWeight',
  is_user_customizable = true
WHERE prompt_key = 'generate_copy_ad';

-- Prompt de Landing Page (generate_copy_landing_page)
UPDATE public.ai_prompt_templates 
SET 
  user_editable_prompt = 'Você é um especialista em criar landing pages de alta conversão. Seu foco é construir uma narrativa persuasiva que guia o visitante desde o problema até a solução, superando objeções e construindo confiança ao longo do caminho.',
  system_instructions = E'INSTRUÇÕES DE FORMATO OBRIGATÓRIAS:\n\nVocê DEVE retornar a landing page usando a estrutura de sessions e blocks através da ferramenta generate_copy.\n\nPara landing pages, organize em sessions:\n1. Hero (headline + subheadline + CTA)\n2. Problema/Agitação\n3. Solução/Benefícios\n4. Prova Social/Credibilidade\n5. Oferta\n6. CTA Final\n\nTipos de blocos: headline, subheadline, text, list, button\nConfigurações: fontSize, textAlign, fontWeight',
  is_user_customizable = true
WHERE prompt_key = 'generate_copy_landing_page';

-- Prompt de VSL (generate_copy_vsl)
UPDATE public.ai_prompt_templates 
SET 
  user_editable_prompt = 'Você é um especialista em criar roteiros de VSL (Video Sales Letter). Seu foco é construir uma narrativa envolvente que prende atenção, conecta emocionalmente e conduz naturalmente à oferta. Use storytelling, pausas estratégicas e gatilhos mentais.',
  system_instructions = E'INSTRUÇÕES DE FORMATO OBRIGATÓRIAS:\n\nVocê DEVE retornar o roteiro de VSL usando a estrutura de sessions e blocks através da ferramenta generate_copy.\n\nPara VSLs, estruture como roteiro com:\n- Marcações de tempo/pausas\n- Transições naturais entre seções\n- Ganchos de retenção\n- Buildup gradual até a oferta\n\nTipos de blocos: headline, text, list (use headlines para marcações de seção)\nConfigurações: fontSize, textAlign, fontWeight',
  is_user_customizable = true
WHERE prompt_key = 'generate_copy_vsl';

-- Prompt de Email (generate_copy_email)
UPDATE public.ai_prompt_templates 
SET 
  user_editable_prompt = 'Você é um especialista em email marketing persuasivo. Seu foco é criar emails que são abertos, lidos completamente e geram ação. Use assuntos curiosos, tom conversacional e CTAs claros.',
  system_instructions = E'INSTRUÇÕES DE FORMATO OBRIGATÓRIAS:\n\nVocê DEVE retornar o email usando a estrutura de sessions e blocks através da ferramenta generate_copy.\n\nPara emails, inclua:\n- Session de Assunto (headline)\n- Session de Abertura/Gancho\n- Session de Corpo/Conteúdo\n- Session de CTA\n- Session de Assinatura (opcional)\n\nTipos de blocos: headline, subheadline, text, list, button\nConfigurações: fontSize, textAlign, fontWeight',
  is_user_customizable = true
WHERE prompt_key = 'generate_copy_email';

-- Prompt de Webinar (generate_copy_webinar)
UPDATE public.ai_prompt_templates 
SET 
  user_editable_prompt = 'Você é um especialista em criar roteiros de webinar persuasivos. Seu foco é educar enquanto vende, construir autoridade e criar desejo pela oferta. Use metodologia clara, exemplos práticos e transições naturais para a pitch.',
  system_instructions = E'INSTRUÇÕES DE FORMATO OBRIGATÓRIAS:\n\nVocê DEVE retornar o roteiro de webinar usando a estrutura de sessions e blocks através da ferramenta generate_copy.\n\nPara webinars, estruture:\n1. Introdução/Credibilidade\n2. Conteúdo Educacional (3-5 pontos)\n3. Transição para Oferta\n4. Apresentação da Solução\n5. Pitch/CTA\n\nTipos de blocos: headline, subheadline, text, list, button\nConfigurações: fontSize, textAlign, fontWeight',
  is_user_customizable = true
WHERE prompt_key = 'generate_copy_webinar';

-- Prompt de Conteúdo (generate_copy_content)
UPDATE public.ai_prompt_templates 
SET 
  user_editable_prompt = 'Você é um especialista em criar conteúdo educacional e engajador. Seu foco é informar, agregar valor e posicionar a marca como autoridade. Use linguagem acessível, exemplos práticos e estrutura clara.',
  system_instructions = E'INSTRUÇÕES DE FORMATO OBRIGATÓRIAS:\n\nVocê DEVE retornar o conteúdo usando a estrutura de sessions e blocks através da ferramenta generate_copy.\n\nPara conteúdo, organize:\n- Introdução clara\n- Seções temáticas bem definidas\n- Listas e exemplos quando apropriado\n- Conclusão/próximos passos\n\nTipos de blocos: headline, subheadline, text, list, button\nConfigurações: fontSize, textAlign, fontWeight',
  is_user_customizable = true
WHERE prompt_key = 'generate_copy_content';

-- Prompt de Mensagem (generate_copy_message)
UPDATE public.ai_prompt_templates 
SET 
  user_editable_prompt = 'Você é um especialista em criar mensagens diretas persuasivas para redes sociais. Seu foco é conversação natural, personalização e conduzir para ação específica. Use tom amigável mas profissional.',
  system_instructions = E'INSTRUÇÕES DE FORMATO OBRIGATÓRIAS:\n\nVocê DEVE retornar a mensagem usando a estrutura de sessions e blocks através da ferramenta generate_copy.\n\nPara mensagens, mantenha:\n- Tom conversacional e pessoal\n- Brevidade (mensagens curtas)\n- CTA claro mas não agressivo\n- Personalização quando possível\n\nTipos de blocos: text, button (use headlines para saudação)\nConfigurações: fontSize, textAlign, fontWeight',
  is_user_customizable = true
WHERE prompt_key = 'generate_copy_message';

-- 1.3 Criar tabela de personalizações do usuário
CREATE TABLE IF NOT EXISTS public.user_prompt_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  prompt_key TEXT NOT NULL,
  custom_prompt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_workspace_prompt UNIQUE(user_id, workspace_id, prompt_key)
);

-- 1.4 Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_prompt_customizations_user_workspace 
ON public.user_prompt_customizations(user_id, workspace_id);

CREATE INDEX IF NOT EXISTS idx_user_prompt_customizations_prompt_key 
ON public.user_prompt_customizations(prompt_key);

-- 1.5 Habilitar RLS na tabela
ALTER TABLE public.user_prompt_customizations ENABLE ROW LEVEL SECURITY;

-- 1.6 Criar policies de RLS
CREATE POLICY "Users can view own customizations"
  ON public.user_prompt_customizations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customizations"
  ON public.user_prompt_customizations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.workspace_members 
      WHERE workspace_id = user_prompt_customizations.workspace_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own customizations"
  ON public.user_prompt_customizations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own customizations"
  ON public.user_prompt_customizations
  FOR DELETE
  USING (auth.uid() = user_id);

-- 1.7 Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_user_prompt_customizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_prompt_customizations_updated_at
  BEFORE UPDATE ON public.user_prompt_customizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_prompt_customizations_updated_at();