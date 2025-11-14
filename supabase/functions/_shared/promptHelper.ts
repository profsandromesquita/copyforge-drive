import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Busca o prompt completo para geração de copy
 * Prioriza personalização do usuário, depois user_editable_prompt do template
 * SEMPRE concatena com system_instructions (parte estrutural oculta)
 */
export async function getFullPrompt(
  supabase: any, // Aceita qualquer versão do SupabaseClient
  promptKey: string,
  userId: string,
  workspaceId: string
): Promise<string> {
  try {
    // 1. Tentar buscar personalização do usuário
    const { data: customization } = await supabase
      .from('user_prompt_customizations')
      .select('custom_prompt')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .eq('prompt_key', promptKey)
      .eq('is_active', true)
      .single();

    // 2. Buscar template (para system_instructions e fallback)
    const { data: template } = await supabase
      .from('ai_prompt_templates')
      .select('user_editable_prompt, system_instructions')
      .eq('prompt_key', promptKey)
      .eq('is_active', true)
      .single();

    if (!template) {
      console.warn(`Template ${promptKey} não encontrado, usando fallback`);
      return getFallbackPrompt(promptKey);
    }

    // 3. Montar prompt completo
    const userEditablePart = customization?.custom_prompt || template.user_editable_prompt || '';
    const systemInstructions = template.system_instructions || '';

    // SEMPRE concatenar: parte editável + instruções estruturais
    return userEditablePart + '\n\n' + systemInstructions;
  } catch (err) {
    console.error(`Erro ao buscar prompt completo ${promptKey}:`, err);
    return getFallbackPrompt(promptKey);
  }
}

/**
 * Helper para buscar prompts do banco de dados com fallback para hardcoded
 * @deprecated Use getFullPrompt() para geração com personalização
 */
export async function getPrompt(
  supabase: SupabaseClient,
  promptKey: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .select('current_prompt')
      .eq('prompt_key', promptKey)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.warn(`Prompt ${promptKey} não encontrado no DB, usando fallback hardcoded`);
      return getFallbackPrompt(promptKey);
    }

    return data.current_prompt;
  } catch (err) {
    console.error(`Erro ao buscar prompt ${promptKey}:`, err);
    return getFallbackPrompt(promptKey);
  }
}

/**
 * Fallbacks hardcoded caso o banco falhe
 */
function getFallbackPrompt(promptKey: string): string {
  const fallbacks: Record<string, string> = {
    'generate_copy_base': `Você é um especialista em copywriting que cria conteúdo persuasivo e bem estruturado em português brasileiro.

IMPORTANTE: Você tem acesso a diferentes tipos de blocos (headline, subheadline, text, list, button), mas deve usar APENAS os que fazem sentido para o contexto específico da copy. Não force o uso de todos os tipos de blocos se eles não agregarem valor ao conteúdo.`,

    'generate_copy_ad': `Especializado em anúncios diretos e impactantes. Para anúncios:
- Priorize headline + text curto + button (estrutura mínima e direta)
- Use list apenas se os benefícios forem o foco principal
- Mantenha conciso e direto ao ponto`,

    'generate_copy_landing_page': `Especializado em landing pages que convertem. Para landing pages:
- Use headline obrigatoriamente
- Subheadline útil para expandir a proposta de valor
- Lists são importantes para benefícios, features e prova social
- Button é essencial para conversão`,

    'generate_copy_vsl': `Especializado em Video Sales Letters com storytelling envolvente. Para VSL:
- Priorize text para contar a história e criar conexão
- Headline para gancho inicial forte
- Use list apenas para resumir pontos-chave ou benefícios finais`,

    'generate_copy_email': `Especializado em emails de conversão. Para emails:
- Headline como assunto/abertura impactante
- Text para corpo do email (mantenha escaneável)
- List opcional para benefícios ou pontos-chave
- Button para CTA claro`,

    'generate_copy_webinar': `Especializado em conteúdo para webinars. Para webinars:
- Headline para título da sessão
- Text para introdução e desenvolvimento de tópicos
- List para agenda, takeaways ou pontos-chave`,

    'generate_copy_content': `Especializado em conteúdo de valor educativo. Para conteúdo:
- Foco em text para desenvolvimento profundo
- Headline para títulos de seções
- List quando houver passos, dicas ou conceitos múltiplos`,

    'generate_copy_message': `Especializado em mensagens diretas para WhatsApp/Telegram. Para mensagens:
- MINIMALISTA: use o mínimo de blocos possível
- Priorize text para manter conversacional`,

    'optimize_copy_otimizar': `Você é um especialista em copywriting. Sua tarefa é OTIMIZAR o conteúdo fornecido, mantendo a estrutura similar mas melhorando qualidade, clareza e persuasão.`,

    'optimize_copy_variacao': `Você é um especialista em copywriting. Sua tarefa é CRIAR UMA VARIAÇÃO do conteúdo fornecido, explorando diferentes ângulos e formatos.`,

    'analyze_audience_psychographic': `Você é um especialista em análise de público e psicografia de consumidor. Analise o segmento fornecido e gere um perfil psicográfico PROFUNDO e DETALHADO.`
  };

  return fallbacks[promptKey] || 'Você é um assistente útil.';
}
