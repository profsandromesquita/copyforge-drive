/**
 * Construtor de Prompt da Copy
 * Gera prompt_Copy = prompt_TipoCopy + prompt_Estrutura + prompt_Publico + 
 *                    prompt_Oferta + prompt_Objetivo + prompt_Estilos + prompt_FocoEmocional
 */

interface CopyContext {
  copyType: string;
  framework?: string;
  audience?: any;
  offer?: any;
  objective?: string;
  styles?: string[];
  emotionalFocus?: string;
}

export function buildCopyPrompt(context: CopyContext): string {
  const parts: string[] = [];

  // prompt_TipoCopy (obrigatório)
  if (context.copyType) {
    parts.push(`## Tipo de Copy\n${getCopyTypeDescription(context.copyType)}`);
  }

  // prompt_Estrutura (opcional)
  if (context.framework) {
    parts.push(`## Estrutura/Framework\n${context.framework}`);
  }

  // prompt_Publico (opcional)
  if (context.audience) {
    const audienceParts: string[] = [];
    
    if (context.audience.segment_name) {
      audienceParts.push(`Segmento: ${context.audience.segment_name}`);
    }
    
    if (context.audience.description) {
      audienceParts.push(`Descrição: ${context.audience.description}`);
    }
    
    if (context.audience.demographics) {
      audienceParts.push(`Demografia: ${formatDemographics(context.audience.demographics)}`);
    }
    
    if (context.audience.pain_points && context.audience.pain_points.length > 0) {
      audienceParts.push(`Dores:\n${context.audience.pain_points.map((p: string) => `- ${p}`).join('\n')}`);
    }
    
    if (context.audience.desires && context.audience.desires.length > 0) {
      audienceParts.push(`Desejos:\n${context.audience.desires.map((d: string) => `- ${d}`).join('\n')}`);
    }
    
    if (audienceParts.length > 0) {
      parts.push(`## Público-Alvo\n${audienceParts.join('\n')}`);
    }
  }

  // prompt_Oferta (opcional)
  if (context.offer) {
    const offerParts: string[] = [];
    
    if (context.offer.offer_name) {
      offerParts.push(`Nome: ${context.offer.offer_name}`);
    }
    
    if (context.offer.description) {
      offerParts.push(`Descrição: ${context.offer.description}`);
    }
    
    if (context.offer.value_proposition) {
      offerParts.push(`Proposta de Valor: ${context.offer.value_proposition}`);
    }
    
    if (context.offer.main_benefit) {
      offerParts.push(`Benefício Principal: ${context.offer.main_benefit}`);
    }
    
    if (context.offer.secondary_benefits && context.offer.secondary_benefits.length > 0) {
      offerParts.push(`Benefícios Secundários:\n${context.offer.secondary_benefits.map((b: string) => `- ${b}`).join('\n')}`);
    }
    
    if (context.offer.differentials && context.offer.differentials.length > 0) {
      offerParts.push(`Diferenciais:\n${context.offer.differentials.map((d: string) => `- ${d}`).join('\n')}`);
    }
    
    if (offerParts.length > 0) {
      parts.push(`## Oferta\n${offerParts.join('\n')}`);
    }
  }

  // prompt_Objetivo (opcional)
  if (context.objective) {
    parts.push(`## Objetivo da Copy\n${context.objective}`);
  }

  // prompt_Estilos (opcional)
  if (context.styles && context.styles.length > 0) {
    parts.push(`## Estilos\n${context.styles.join(', ')}`);
  }

  // prompt_FocoEmocional (opcional)
  if (context.emotionalFocus) {
    parts.push(`## Foco Emocional\n${context.emotionalFocus}`);
  }

  return parts.join('\n\n');
}

function getCopyTypeDescription(copyType: string): string {
  const descriptions: Record<string, string> = {
    'landing_page': 'Landing Page - Página de captura ou conversão focada em uma única ação',
    'email': 'E-mail Marketing - Comunicação direta via e-mail',
    'social_post': 'Post para Redes Sociais - Conteúdo para engajamento em mídias sociais',
    'ads': 'Anúncios Pagos - Copy para campanhas de mídia paga',
    'blog_post': 'Artigo de Blog - Conteúdo educativo ou informativo',
    'sales_page': 'Página de Vendas - Página focada em conversão de vendas',
    'video_script': 'Roteiro de Vídeo - Script para produção de vídeo',
    'webinar': 'Webinar - Apresentação online ao vivo ou gravada',
    'outro': 'Outro tipo de copy'
  };

  return descriptions[copyType] || copyType;
}

function formatDemographics(demographics: any): string {
  const parts: string[] = [];
  
  if (demographics.age_range) {
    parts.push(`Faixa etária: ${demographics.age_range}`);
  }
  
  if (demographics.gender) {
    parts.push(`Gênero: ${demographics.gender}`);
  }
  
  if (demographics.location) {
    parts.push(`Localização: ${demographics.location}`);
  }
  
  if (demographics.income_level) {
    parts.push(`Nível de renda: ${demographics.income_level}`);
  }
  
  if (demographics.education_level) {
    parts.push(`Escolaridade: ${demographics.education_level}`);
  }
  
  return parts.join(', ');
}

export function generateContextHash(projectPrompt: string, copyPrompt: string): string {
  const context = `${projectPrompt}||${copyPrompt}`;
  
  // Gerar hash simples (no ambiente Deno usaremos crypto.subtle)
  return btoa(context).slice(0, 32);
}
