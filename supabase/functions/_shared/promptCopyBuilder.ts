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

    'anuncio': `Produza um texto curto, direto e altamente persuasivo.
A copy deve:
- Capturar atenção imediatamente
- Destacar o benefício principal
- Criar curiosidade ou urgência
- Conduzir para um clique ou ação específica

Evite excesso de detalhes.
Use gatilhos mentais apropriados ao canal (Facebook, Google, Instagram, etc.).
O foco é sempre atrair cliques, não explicar tudo.`,

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

function getFrameworkDescription(framework: string): string {
  const normalizedFramework = framework.toUpperCase().trim();
  
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

  return descriptions[normalizedFramework] || framework;
}

function getObjectiveDescription(objective: string): string {
  const normalizedObjective = objective.toUpperCase().trim();
  
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

  return descriptions[normalizedObjective] || objective;
}

function getStylesDescription(styles: string[]): string {
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
      const normalizedStyle = style.toUpperCase().trim();
      return styleDescriptions[normalizedStyle] || style;
    })
    .filter(desc => desc);

  return matchedDescriptions.join('\n\n---\n\n');
}

function getEmotionalFocusDescription(focus: string): string {
  const normalizedFocus = focus.toUpperCase().trim();
  
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

  return descriptions[normalizedFocus] || focus;
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
