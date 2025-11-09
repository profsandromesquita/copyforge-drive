import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Helper para buscar prompts do banco de dados com fallback para hardcoded
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

    'generate_copy_anuncio': `Especializado em anúncios diretos e impactantes. Para anúncios:
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

    'generate_copy_conteudo': `Especializado em conteúdo de valor educativo. Para conteúdo:
- Foco em text para desenvolvimento profundo
- Headline para títulos de seções
- List quando houver passos, dicas ou conceitos múltiplos`,

    'generate_copy_mensagem': `Especializado em mensagens diretas para WhatsApp/Telegram. Para mensagens:
- MINIMALISTA: use o mínimo de blocos possível
- Priorize text para manter conversacional`,

    'optimize_copy_otimizar': `Você é um especialista em copywriting. Sua tarefa é OTIMIZAR o conteúdo fornecido, mantendo a estrutura similar mas melhorando qualidade, clareza e persuasão.`,

    'optimize_copy_variacao': `Você é um especialista em copywriting. Sua tarefa é CRIAR UMA VARIAÇÃO do conteúdo fornecido, explorando diferentes ângulos e formatos.`,

    'analyze_audience_psychographic': `Você é um especialista em análise de público e psicografia de consumidor. Analise o segmento fornecido e gere um perfil psicográfico PROFUNDO e DETALHADO.`
  };

  return fallbacks[promptKey] || 'Você é um assistente útil.';
}
