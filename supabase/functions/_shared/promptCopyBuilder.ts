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
    parts.push(`## Estrutura/Framework\n${getFrameworkDescription(context.framework)}`);
  }

  // prompt_Publico (opcional)
  if (context.audience) {
    const audienceParts: string[] = [];
    
    // Campos básicos (Fase 1)
    if (context.audience.who_is) {
      audienceParts.push(`**Quem é essa pessoa:** ${context.audience.who_is}`);
    }
    
    if (context.audience.biggest_desire) {
      audienceParts.push(`**Maior Desejo:** ${context.audience.biggest_desire}`);
    }
    
    if (context.audience.biggest_pain) {
      audienceParts.push(`**Maior Dor:** ${context.audience.biggest_pain}`);
    }
    
    if (context.audience.failed_attempts) {
      audienceParts.push(`**O que já tentou:** ${context.audience.failed_attempts}`);
    }
    
    if (context.audience.beliefs) {
      audienceParts.push(`**Crenças:** ${context.audience.beliefs}`);
    }
    
    if (context.audience.behavior) {
      audienceParts.push(`**Comportamento/Linguagem:** ${context.audience.behavior}`);
    }
    
    if (context.audience.journey) {
      audienceParts.push(`**Jornada (Onde está → Onde quer chegar):** ${context.audience.journey}`);
    }
    
    // Análise Psicográfica Avançada (Fase 2)
    if (context.audience.advanced_analysis) {
      const analysis = context.audience.advanced_analysis;
      
      audienceParts.push('\n### ANÁLISE PSICOGRÁFICA AVANÇADA');
      
      // Dimensão Emocional
      if (analysis.emotional_state || analysis.hidden_pain || analysis.primary_fear || analysis.emotional_desire) {
        audienceParts.push('\n**Dimensão Emocional:**');
        if (analysis.emotional_state) audienceParts.push(`- Estado Emocional: ${analysis.emotional_state}`);
        if (analysis.hidden_pain) audienceParts.push(`- Dor Oculta (não verbalizada): ${analysis.hidden_pain}`);
        if (analysis.primary_fear) audienceParts.push(`- Medo Primário: ${analysis.primary_fear}`);
        if (analysis.emotional_desire) audienceParts.push(`- Desejo Emocional: ${analysis.emotional_desire}`);
      }
      
      // Dimensão Cognitiva
      if (analysis.problem_misperception || analysis.limiting_belief || analysis.internal_narrative) {
        audienceParts.push('\n**Dimensão Cognitiva:**');
        if (analysis.problem_misperception) audienceParts.push(`- Percepção Errada do Problema: ${analysis.problem_misperception}`);
        if (analysis.limiting_belief) audienceParts.push(`- Crença Limitante: ${analysis.limiting_belief}`);
        if (analysis.internal_narrative) audienceParts.push(`- Narrativa Interna: ${analysis.internal_narrative}`);
        if (analysis.internal_contradiction) audienceParts.push(`- Contradição Interna: ${analysis.internal_contradiction}`);
      }
      
      // Dimensão Comportamental
      if (analysis.decision_trigger || analysis.communication_style) {
        audienceParts.push('\n**Dimensão Comportamental:**');
        if (analysis.decision_trigger) audienceParts.push(`- Gatilho de Decisão: ${analysis.decision_trigger}`);
        if (analysis.communication_style) audienceParts.push(`- Estilo de Comunicação/Vocabulário: ${analysis.communication_style}`);
        if (analysis.psychological_resistances) audienceParts.push(`- Resistências Psicológicas: ${analysis.psychological_resistances}`);
      }
      
      // Gatilhos Mentais Ranqueados
      if (analysis.mental_triggers) {
        const triggers = analysis.mental_triggers;
        const sortedTriggers = Object.entries(triggers)
          .sort(([,a], [,b]) => (a as any).rank - (b as any).rank)
          .slice(0, 4); // Top 4
        
        audienceParts.push('\n**Gatilhos Mentais Mais Efetivos:**');
        sortedTriggers.forEach(([name, data]: [string, any]) => {
          audienceParts.push(`${data.rank}. ${name.toUpperCase()}: ${data.justificativa}`);
        });
      }
    }
    
    if (audienceParts.length > 0) {
      parts.push(`## PÚBLICO-ALVO E PERSONA\n${audienceParts.join('\n')}`);
    }
  }

  // prompt_Oferta (opcional)
  if (context.offer) {
    const offerParts: string[] = [];
    
    if (context.offer.name) {
      offerParts.push(`**Nome da Oferta:** ${context.offer.name}`);
    }
    
    if (context.offer.type) {
      offerParts.push(`**Tipo:** ${context.offer.type}`);
    }
    
    if (context.offer.short_description) {
      offerParts.push(`**Descrição:** ${context.offer.short_description}`);
    }
    
    if (context.offer.main_benefit) {
      offerParts.push(`**Promessa Central:** ${context.offer.main_benefit}`);
    }
    
    if (context.offer.unique_mechanism) {
      offerParts.push(`**Mecanismo Único (Por que funciona):** ${context.offer.unique_mechanism}`);
    }
    
    if (context.offer.differentials && context.offer.differentials.length > 0) {
      offerParts.push(`**Diferenciais:**\n${context.offer.differentials.map((d: string) => `- ${d}`).join('\n')}`);
    }
    
    if (context.offer.proof) {
      offerParts.push(`**Prova/Autoridade:** ${context.offer.proof}`);
    }
    
    if (context.offer.guarantee) {
      offerParts.push(`**Garantia:** ${context.offer.guarantee}`);
    }
    
    if (context.offer.cta) {
      offerParts.push(`**CTA/Objetivo:** ${context.offer.cta}`);
    }
    
    if (offerParts.length > 0) {
      parts.push(`## OFERTA\n${offerParts.join('\n')}`);
    }
  }

  // prompt_Objetivo (opcional)
  if (context.objective) {
    parts.push(`## Objetivo da Copy\n${getObjectiveDescription(context.objective)}`);
  }

  // prompt_Estilos (opcional)
  if (context.styles && context.styles.length > 0) {
    const stylesContent = getStylesDescription(context.styles);
    if (stylesContent) {
      parts.push(`## Estilos\n${stylesContent}`);
    }
  }

  // prompt_FocoEmocional (opcional)
  if (context.emotionalFocus) {
    parts.push(`## Foco Emocional\n${getEmotionalFocusDescription(context.emotionalFocus)}`);
  }

  return parts.join('\n\n');
}

function getCopyTypeDescription(copyType: string): string {
  const normalizedType = copyType.toLowerCase().trim();
  
  const descriptions: Record<string, string> = {
    'landing_page': `Estruture o texto como uma página de conversão completa.
A copy deve conter:
- Headline principal clara e impactante
- Subheadline explicativa
- Seção de benefícios principais
- Explicação do mecanismo ou método
- Provas (quando fornecidas)
- Chamada para ação (CTA) forte e repetida
- Quebra de objeções
- Seção final de reforço da oferta
- Garantia (caso exista)

Foque na clareza, escaneabilidade e persuasão.
Utilize frases curtas, estruturas em blocos e CTAs visíveis e diretas.
Toda landing page deve conduzir o leitor logicamente até a ação desejada.`,

    'anuncio': `TIPO: ANÚNCIO PUBLICITÁRIO

=== DISTINÇÃO CRÍTICA: COPY PARA ARTE vs LEGENDA ===

**1. COPY PARA ARTE/IMAGEM/CRIATIVO** (quando pedir "texto para arte", "copy do criativo", "headline de anúncio"):
- MÁXIMO 30 palavras TOTAIS
- Estrutura obrigatória:
  • HEADLINE: Máximo 8 palavras (benefício direto ou provocação)
  • SUBHEADLINE: Máximo 12 palavras (complemento ou especificação)  
  • CTA: Máximo 4 palavras (verbo imperativo + benefício)
- Absorção em 3 segundos
- ZERO parágrafos - apenas frases soltas e impactantes
- Foco 100% no BENEFÍCIO, não na característica

**2. LEGENDA/CAPTION** (quando pedir "legenda", "caption", "texto do post"):
- Até 150 palavras
- 2-3 parágrafos curtos permitidos
- Pode incluir emojis e hashtags
- Permite storytelling condensado

=== PRINCÍPIOS UNIVERSAIS PARA ANÚNCIOS ===
- Capturar atenção INSTANTANEAMENTE (primeiras 3 palavras são cruciais)
- Foco no BENEFÍCIO: O que o cliente GANHA? (não o que o produto É)
- CTA com verbo imperativo: "Baixe", "Compre", "Garanta", "Acesse"
- Gatilhos: Urgência, Escassez, Prova Social, Gratuidade

=== LÓGICA DE VARIAÇÃO (TESTE A/B) ===
Se pedir variações, mude o ÂNGULO, não apenas palavras:
- Ângulo DOR: "Cansado de perder dinheiro?"
- Ângulo PRAZER: "Comece a lucrar hoje!"
- Ângulo PROVA: "10.000 empresários já usam"
- Ângulo URGÊNCIA: "Só até meia-noite"

=== RESTRIÇÕES NEGATIVAS (NUNCA FAZER) ===
❌ Parágrafos longos para artes de imagem
❌ Jargões técnicos complexos
❌ Lista de features do produto (a menos que pedido)
❌ Linguagem passiva ou indireta
❌ Clichês: "Descubra como...", "Você sabia que...", "Conheça o..."
❌ Textos genéricos sem benefício claro`,

    'vsl': `Estruture o texto no formato de um roteiro persuasivo.
Inclua:
- Abertura forte com identificação do problema
- História ou contexto
- Apresentação do mecanismo único
- Demonstração da solução
- Benefícios principais
- Provas e validações
- Oferta
- Bônus (se houver)
- Garantia
- Chamada para ação final

Mantenha ritmo narrativo, tom envolvente e estrutura dramática.
Esse formato é focado em retenção + persuasão.`,

    'email': `Produza textos que priorizem:
- Assunto irresistível
- Abertura que prende atenção
- Conexão emocional ou lógica
- Entrega de valor real
- Transição suave para oferta (quando houver)
- Chamada para ação clara

Adapte o tom ao objetivo:
- informativo
- promocional
- relacionamento
- sequência de nutrição

Use blocos curtos, parágrafos simples e tom mais pessoal.`,

    'webinar': `Estruture o conteúdo como um roteiro/estrutura de apresentação ao vivo.
Inclua:
- Abertura e apresentação do especialista
- Criação de rapport
- Exposição do problema
- Quebra de objeções iniciais
- Ensinos principais (princípios, fundamentos, segredos)
- Introdução do método/oferta
- Prova e diferenciação
- Pitch de venda
- Chamada final para ação

O ritmo deve ser envolvente, pedagógico e com momentos estratégicos de persuasão.`,

    'conteudo': `Gere textos com foco em educação, explicação ou valor puro.
Ex.: post de Instagram, artigo, dica, tutorial, carrossel, aula curta etc.

A estrutura deve priorizar:
- Título chamativo
- Apresentação do tema
- Passos, dicas ou fundamentos
- Exemplos práticos
- Conclusão com chamada para ação leve (ou CTA estratégica, se solicitado)

Evite linguagem excessivamente promocional — foco em valor.`,

    'mensagem': `Produza copy curta, pessoal e direta, no estilo:
- WhatsApp
- DM (Instagram/Facebook)
- Mensagens rápidas

Características:
- Tom pessoal
- Parágrafos curtos
- Rapidez na leitura
- Ações diretas (clique, responder, confirmar, acessar)

Parece uma conversa humana, não um anúncio ou texto longo.`,

    'outro': `Adapte a estrutura ao contexto informado pelo usuário.
Use as informações do projeto + informações específicas da peça para criar um formato personalizado.

Seja flexível, mas mantenha:
- clareza
- persuasão
- estrutura coerente
- adaptação ao canal e objetivo descrito

Quando necessário, solicite informações complementares ou utilize padrões de copywriting adequados ao tipo de peça.`
  };

  return descriptions[normalizedType] || copyType;
}

function getFrameworkDescription(framework: string | { value: string; ai_instruction?: string; description?: string }): string {
  // Se for objeto, priorizar ai_instruction
  if (typeof framework === 'object' && framework.ai_instruction) {
    return framework.ai_instruction;
  }
  
  // Se for objeto mas sem ai_instruction, usar value para buscar hardcoded
  const normalizedFramework = (typeof framework === 'string' ? framework : framework.value).toUpperCase().trim();
  
  const descriptions: Record<string, string> = {
    'AIDA': `Organize toda a copy seguindo a sequência:
Atenção → Interesse → Desejo → Ação.

- Atenção: Comece com algo que capture imediatamente o leitor (headline, pergunta, choque ou benefício direto).
- Interesse: Explique brevemente o problema, contexto ou oportunidade, criando curiosidade e conexão.
- Desejo: Aumente o desejo mostrando benefícios, diferenciais, mecanismos e transformações reais.
- Ação: Finalize com uma chamada para ação clara, direta e irresistível.

O texto deve fluir naturalmente através dos 4 estágios sem pular etapas.`,

    'PAS': `Monte a copy na ordem:
Problema → Agitação → Solução.

- Problema: Descreva o problema central do público com clareza e empatia.
- Agitação: Aprofunde as dores, consequências e frustrações relacionadas ao problema.
- Solução: Apresente a oferta como resposta direta e lógica ao que foi descrito.

Essa estrutura deve gerar identificação profunda antes de apresentar a solução.`,

    'FAB': `Desenvolva a copy seguindo:
Características → Vantagens → Benefícios.

- Características: Detalhe o que o produto/serviço contém ou oferece.
- Vantagens: Mostre por que essas características são importantes.
- Benefícios: Traduza tudo isso em ganhos reais para o cliente.

Priorize clareza e tangibilidade ao conectar cada característica ao benefício real.`,

    '4PS': `Estruture o texto seguindo:
Imagem → Promessa → Prova → Empurrão.

- Imagem: Crie uma cena mental que represente a dor ou o sonho do público.
- Promessa: Declare o benefício principal ou transformação oferecida.
- Prova: Use provas, dados, diferenciais e credibilidade para validar.
- Empurrão: Finalize com CTA forte, urgência ou convite direto.

Essa estrutura equilibra emoção com lógica.`,

    'QUEST': `Organize a copy usando:
Qualificar → Compreender → Educar → Estimular → Transição.

- Qualificar: Mostre para quem é a mensagem.
- Compreender: Demonstre entendimento profundo do problema ou desejo.
- Educar: Apresente insights, fundamentos ou explicações úteis.
- Estimular: Gere desejo, urgência ou descoberta.
- Transição: Conduza à ação com um CTA coerente.

Ideal para conteúdos mais educativos e narrativos.`,

    'BAB': `Siga a lógica:
Antes → Depois → Ponte.

- Antes: Mostre a situação atual do público (problema).
- Depois: Mostre o cenário ideal após a transformação.
- Ponte: Apresente a oferta como o caminho que leva do "antes" ao "depois".

Essa estrutura é perfeita para alto impacto emocional.`,

    'PASTOR': `Construa o texto seguindo:
Problema → Amplificar → História → Transformação → Oferta → Resposta.

- Problema: Apresente o problema central.
- Amplificar: Reforce consequências e frustrações.
- História: Conecte através de narrativa ou exemplo.
- Transformação: Mostre a mudança possível.
- Oferta: Apresente a solução com detalhes.
- Resposta: Finalize com CTA forte e direcionado.

É uma estrutura longa e muito persuasiva, ideal para VSLs, LPs e anúncios detalhados.`
  };

  return descriptions[normalizedFramework] || (typeof framework === 'string' ? framework : framework.value);
}

function getObjectiveDescription(objective: string | { value: string; ai_instruction?: string; description?: string }): string {
  // Se for objeto, priorizar ai_instruction
  if (typeof objective === 'object' && objective.ai_instruction) {
    return objective.ai_instruction;
  }
  
  // Se for objeto mas sem ai_instruction, usar value para buscar hardcoded
  const normalizedObjective = (typeof objective === 'string' ? objective : objective.value).toUpperCase().trim();
  
  const descriptions: Record<string, string> = {
    'VENDA DIRETA': `Estruture a copy com foco total na conversão imediata.
Priorize clareza, urgência e prova.
A mensagem deve levar o leitor a tomar uma decisão agora, reforçando benefícios, diferenciais, promessa e garantia.
A chamada para ação deve ser explícita, forte e repetida ao longo da copy.`,

    'GERAÇÃO DE LEADS': `Foque em despertar interesse suficiente para que a pessoa deixe seus dados.
Priorize valor percebido, curiosidade e baixa fricção.
Destaque o que o lead recebe (materiais, aula, diagnóstico, bônus etc.) e por que vale a pena se cadastrar agora.`,

    'ENGAJAMENTO / VIRALIZAÇÃO': `A copy deve ser leve, compartilhável, memorável ou provocativa.
Priorize entretenimento, identificação e emoção.
Mantenha uma linguagem que incentive curtidas, comentários, compartilhamentos ou discussões.`,

    'EDUCAÇÃO / CONHECIMENTO': `Estruture a mensagem para ensinar algo valioso ao leitor.
Priorize clareza, exemplos práticos e linguagem didática.
A copy deve entregar valor real, reforçar autoridade e preparar terreno para futuras ações (mesmo que a CTA seja leve).`,

    'RETENÇÃO / FIDELIZAÇÃO': `A copy deve fortalecer relacionamento, confiança e conexão emocional.
Priorize reconhecimento, personalização, valorização do cliente e construção de proximidade.
A CTA é opcional, mas quando existir, deve ser suave e alinhada ao relacionamento.`,

    'UPSELL / CROSS-SELL': `A copy deve apresentar algo complementar ao que a pessoa já possui.
Mostre como a nova oferta potencializa, melhora ou completa o que ela já adquiriu.
Priorize clareza, lógica e aumento de valor percebido.`,

    'REATIVAÇÃO': `Construa a copy de forma acolhedora, amigável e convidativa.
Relembre o valor, desperte interesse novamente e minimize barreiras para retorno.
Mostre o que mudou, o que melhorou e por que agora é o melhor momento para voltar.`
  };

  return descriptions[normalizedObjective] || (typeof objective === 'string' ? objective : objective.value);
}

function getStylesDescription(styles: Array<string | { value: string; ai_instruction?: string; description?: string }>): string {
  if (!styles || styles.length === 0) {
    return '';
  }

  const styleDescriptions: Record<string, string> = {
    'STORYTELLING': `Utilize narrativa envolvente, com personagens, contexto, conflito e transformação.
Crie uma história que conduza naturalmente ao ponto central da copy.`,

    'CONTROVERSO / DISRUPTIVO': `Use afirmações fortes, opiniões incomuns e quebras de padrão.
Gere choque, debate ou reflexão, sempre mantendo coerência com a marca.`,

    'ASPIRACIONAL / LUXO': `Utilize linguagem elegante, sensorial e sofisticada.
Foque em exclusividade, status, elevação de vida e desejo por algo superior.`,

    'URGENTE / ALARMISTA': `Enfatize riscos, prazos, consequências e necessidade de ação imediata.
Crie senso de urgência claro e forte.`,

    'CIENTÍFICO / BASEADO EM DADOS': `Utilize lógica, fatos, números, evidências e explicações racionais.
O tom deve transmitir credibilidade e objetividade.`,

    'CONVERSACIONAL / AMIGÁVEL': `Escreva como se estivesse conversando com uma pessoa específica.
Frases simples, curtas, próximas e naturais.
Tom leve, humano e acolhedor.`,

    'MÍSTICO / ESPIRITUAL': `Utilize elementos introspectivos, energéticos, simbólicos ou metafóricos.
Conduza o leitor a uma sensação de propósito, conexão ou transcendência.`
  };

  const matchedDescriptions = styles
    .map(style => {
      // Se for objeto e tiver ai_instruction, usar ai_instruction
      if (typeof style === 'object' && style.ai_instruction) {
        return style.ai_instruction;
      }
      
      // Se for objeto sem ai_instruction ou string, buscar hardcoded
      const normalizedStyle = (typeof style === 'string' ? style : style.value).toUpperCase().trim();
      return styleDescriptions[normalizedStyle] || (typeof style === 'string' ? style : style.value);
    })
    .filter(desc => desc);

  return matchedDescriptions.join('\n\n---\n\n');
}

function getEmotionalFocusDescription(focus: string | { value: string; ai_instruction?: string; description?: string }): string {
  // Se for objeto, priorizar ai_instruction
  if (typeof focus === 'object' && focus.ai_instruction) {
    return focus.ai_instruction;
  }
  
  // Se for objeto mas sem ai_instruction, usar value para buscar hardcoded
  const normalizedFocus = (typeof focus === 'string' ? focus : focus.value).toUpperCase().trim();
  
  const descriptions: Record<string, string> = {
    'DOR': `Amplifique o problema, frustração ou sofrimento atual do público.
Mostre que você entende profundamente a dor e as consequências de não resolvê-la.
A copy deve levar o leitor a reconhecer a urgência de mudança.`,

    'DESEJO': `Foque na aspiração, sonhos e vontades do público.
Mostre detalhes atraentes da vida ideal que ele deseja viver.
A copy deve despertar motivação, ambição e vontade de agir.`,

    'TRANSFORMAÇÃO': `Mostre o contraste entre o antes e o depois.
A copy deve mostrar a jornada da mudança, reforçando esperança, clareza e superação.
Ideal para histórias e provas.`,

    'PREVENÇÃO': `Enfatize riscos futuros, problemas potenciais ou perdas evitáveis.
A copy deve mostrar que agir agora é a melhor forma de evitar prejuízos, dores ou retrocessos.`
  };

  return descriptions[normalizedFocus] || (typeof focus === 'string' ? focus : focus.value);
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

export async function generateContextHash(projectPrompt: string, copyPrompt: string): Promise<string> {
  const context = `${projectPrompt}||${copyPrompt}`;
  
  // ✅ Usar TextEncoder nativo do Deno (suporta UTF-8)
  const encoder = new TextEncoder();
  const data = encoder.encode(context);
  
  // ✅ Gerar hash SHA-256 usando crypto.subtle
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Converter para Base64
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  
  return hashBase64.slice(0, 32);
}
