import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= FALLBACKS ============= 
const FALLBACK_SYSTEM_PROMPT = `You are a professional Visual Design Strategist specialized in translating brand concepts into impactful images.

=== VISUAL QUALITY STANDARDS ===
- Generate photorealistic, high-resolution images (1024x1024 minimum)
- Ensure proper lighting, composition, and color balance
- Avoid text, watermarks, or low-quality artifacts
- Focus on emotional impact and visual storytelling

=== STYLE GUIDELINES ===
- Professional and modern aesthetic
- Clean, uncluttered compositions
- Strong focal points and visual hierarchy
- Color palettes that evoke the desired emotion

=== TECHNICAL REQUIREMENTS ===
- Sharp focus on main subject
- Proper depth of field
- Natural lighting when appropriate
- Consistent style within a project`;

const FALLBACK_PROMPTS = {
  generate: '{{user_prompt}}',
  optimize: 'Optimize this image maintaining its core concept: {{user_prompt}}',
  variation: 'Create a creative variation of this image: {{user_prompt}}',
};

// ============= TEMPLATE FETCHING ============= 
async function fetchImageTemplates(
  supabaseClient: any,
  type: 'generate' | 'optimize' | 'variation'
): Promise<any[]> {
  const templateKeys = {
    'generate': ['image_generation_base', 'image_generation_prompt'],
    'optimize': ['image_generation_base', 'image_optimization'],
    'variation': ['image_generation_base', 'image_variation'],
  };
  
  const keys = templateKeys[type];
  
  try {
    const { data: templates, error } = await supabaseClient
      .from('ai_prompt_templates')
      .select('prompt_key, current_prompt')
      .in('prompt_key', keys)
      .eq('is_active', true);
      
    if (error) {
      console.error('⚠️ Erro ao buscar templates:', error);
      return [];
    }
    
    console.log(`✅ Templates carregados: ${templates?.map((t: any) => t.prompt_key).join(', ')}`);
    return templates || [];
  } catch (error) {
    console.error('⚠️ Exceção ao buscar templates:', error);
    return [];
  }
}

// ============= VARIABLE INTERPOLATION ============= 
function interpolateTemplate(template: string, context: {
  project_identity?: any;
  visual_identity?: any;
  methodology?: any;
  user_prompt: string;
}): string {
  if (!template) return '';
  
  let result = template;
  
  // Substituir variáveis simples: {{user_prompt}}
  result = result.replace(/\{\{user_prompt\}\}/g, context.user_prompt);
  
  // Substituir variáveis de project_identity
  if (context.project_identity) {
    result = result.replace(/\{\{project_identity\.brand_name\}\}/g, context.project_identity.brand_name || '');
    result = result.replace(/\{\{project_identity\.sector\}\}/g, context.project_identity.sector || '');
    result = result.replace(/\{\{project_identity\.central_purpose\}\}/g, context.project_identity.central_purpose || '');
    result = result.replace(/\{\{project_identity\.brand_personality\}\}/g, context.project_identity.brand_personality || '');
    result = result.replace(/\{\{project_identity\.voice_tones\}\}/g, context.project_identity.voice_tones || '');
  }
  
  // Substituir variáveis de visual_identity
  if (context.visual_identity) {
    result = result.replace(/\{\{visual_identity\.visual_style\}\}/g, context.visual_identity.visual_style || '');
    result = result.replace(/\{\{visual_identity\.imagery_style\}\}/g, context.visual_identity.imagery_style || '');
    result = result.replace(/\{\{visual_identity\.color_palette\.primary\}\}/g, context.visual_identity.color_palette?.primary || '');
    result = result.replace(/\{\{visual_identity\.color_palette\.secondary\}\}/g, context.visual_identity.color_palette?.secondary || '');
    result = result.replace(/\{\{visual_identity\.color_palette\.accent\}\}/g, context.visual_identity.color_palette?.accent || '');
    result = result.replace(/\{\{visual_identity\.color_palette\.background\}\}/g, context.visual_identity.color_palette?.background || '');
  }
  
  // Substituir variáveis de methodology
  if (context.methodology) {
    result = result.replace(/\{\{methodology\.name\}\}/g, context.methodology.name || '');
    result = result.replace(/\{\{methodology\.tese_central\}\}/g, context.methodology.tese_central || '');
  }
  
  // Processar condicionais simples: {{#if visual_identity}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
    const contextValue = condition === 'visual_identity' ? context.visual_identity :
                        condition === 'project_identity' ? context.project_identity :
                        condition === 'methodology' ? context.methodology : null;
    
    return contextValue ? content : '';
  });
  
  return result;
}

// ============= DYNAMIC PROMPT BUILDING ============= 
async function buildDynamicImagePrompt(
  supabaseClient: any,
  type: 'generate' | 'optimize' | 'variation',
  projectData: any,
  userPrompt: string
): Promise<{ systemPrompt: string; userMessage: string }> {
  
  console.log('🔧 Construindo prompts dinâmicos...');
  
  // 1. Buscar templates do banco
  const templates = await fetchImageTemplates(supabaseClient, type);
  
  // 2. Preparar contexto completo
  const context = {
    project_identity: projectData ? {
      brand_name: projectData.brand_name,
      sector: projectData.sector,
      central_purpose: projectData.central_purpose,
      brand_personality: projectData.brand_personality?.join(', '),
      voice_tones: projectData.voice_tones?.join(', '),
    } : undefined,
    visual_identity: projectData ? {
      visual_style: projectData.visual_style?.join(', '),
      color_palette: projectData.color_palette,
      imagery_style: projectData.imagery_style,
    } : undefined,
    methodology: projectData?.methodology,
    user_prompt: userPrompt,
  };
  
  console.log('📊 Contexto Completo:');
  console.log('  - Brand:', context.project_identity?.brand_name || 'N/A');
  console.log('  - Visual Styles:', context.visual_identity?.visual_style || 'N/A');
  console.log('  - Color Palette:', context.visual_identity?.color_palette ? 'Sim' : 'Não');
  console.log('  - Imagery Style:', context.visual_identity?.imagery_style || 'N/A');
  console.log('  - Has Methodology:', !!context.methodology);
  
  // 3. Interpolar templates
  const baseTemplate = templates.find((t: any) => t.prompt_key === 'image_generation_base');
  const mainTemplate = templates.find((t: any) => 
    t.prompt_key === (type === 'generate' ? 'image_generation_prompt' : 
                      type === 'optimize' ? 'image_optimization' : 'image_variation')
  );
  
  let systemPrompt = FALLBACK_SYSTEM_PROMPT;
  let userMessage = FALLBACK_PROMPTS[type].replace('{{user_prompt}}', userPrompt);
  
  if (baseTemplate?.current_prompt) {
    systemPrompt = interpolateTemplate(baseTemplate.current_prompt, context);
    console.log('✅ System prompt interpolado do banco');
  } else {
    console.log('⚠️ Usando fallback system prompt');
  }
  
  if (mainTemplate?.current_prompt) {
    userMessage = interpolateTemplate(mainTemplate.current_prompt, context);
    console.log('✅ User prompt interpolado do banco');
  } else {
    console.log('⚠️ Usando fallback user prompt');
  }
  
  return { systemPrompt, userMessage };
}

// ============= MAIN HANDLER ============= 
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== FASE 1: VALIDAÇÃO DE AUTENTICAÇÃO =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Configuração do Supabase não encontrada');
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Validar usuário autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Erro de autenticação:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Usuário autenticado:', user.id);

    const { prompt, imageUrl, type = 'generate', copyId, workspaceId } = await req.json();

    if (!prompt || !prompt.trim()) {
      throw new Error('Prompt é obrigatório');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // ===== BUSCAR CONTEXTO COMPLETO =====
    let projectData = null;
    let copyContext = null;
    
    if (copyId) {
      console.log('🔍 Buscando contexto COMPLETO da copy:', copyId);
      
      const { data: copyData, error: copyError } = await supabaseAdmin
        .from('copies')
        .select(`
          id,
          title,
          copy_type,
          project_id,
          workspace_id,
          projects (
            brand_name,
            sector,
            central_purpose,
            brand_personality,
            voice_tones,
            keywords,
            visual_style,
            color_palette,
            imagery_style,
            methodology,
            audience_segments,
            offers
          )
        `)
        .eq('id', copyId)
        .single();
      
      if (copyError) {
        console.error('⚠️ Erro ao buscar contexto da copy:', copyError);
      } else if (copyData) {
        console.log('✅ Contexto COMPLETO da copy recuperado');
        copyContext = {
          title: copyData.title,
          copy_type: copyData.copy_type
        };
        
        if (copyData.projects) {
          projectData = copyData.projects;
          console.log('📊 Project data completo carregado');
        }
      }
    }

    // ===== CONSTRUIR PROMPTS DINÂMICOS =====
    let systemPrompt: string;
    let enhancedPrompt: string;
    
    if (projectData) {
      const { systemPrompt: dynSystem, userMessage: dynUser } = await buildDynamicImagePrompt(
        supabaseAdmin,
        type as 'generate' | 'optimize' | 'variation',
        projectData,
        prompt
      );
      
      systemPrompt = dynSystem;
      enhancedPrompt = dynUser;
      
      // Adicionar contexto da copy se disponível
      if (copyContext) {
        enhancedPrompt = `Context: Creating image for "${copyContext.title}" (${copyContext.copy_type})\n\n${enhancedPrompt}`;
      }
    } else {
      // Fallback sem banco
      console.log('⚠️ Usando modo fallback (sem contexto de projeto)');
      systemPrompt = FALLBACK_SYSTEM_PROMPT;
      const typeKey = type as keyof typeof FALLBACK_PROMPTS;
      enhancedPrompt = FALLBACK_PROMPTS[typeKey].replace('{{user_prompt}}', prompt);
    }
    
    console.log('📝 System prompt length:', systemPrompt.length);
    console.log('📝 Enhanced prompt preview:', enhancedPrompt.substring(0, 150) + '...');
    console.log(`🎨 ${type === 'generate' ? 'Gerando' : type === 'optimize' ? 'Otimizando' : 'Criando variação de'} imagem`);

    // Preparar conteúdo da mensagem
    const messageContent: any = type === 'generate' 
      ? enhancedPrompt 
      : [
          {
            type: 'text',
            text: enhancedPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl
            }
          }
        ];

    // Preparar mensagens
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: messageContent
      }
    ];

    // Chamar API de geração de imagem
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: messages,
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione mais créditos para continuar.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();

    // Extrair informações de uso
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;

    // Extrair a imagem gerada
    let generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImageUrl && data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      if (Array.isArray(content)) {
        const imageContent = content.find((c: any) => c.type === 'image_url');
        if (imageContent) {
          generatedImageUrl = imageContent.image_url?.url;
        }
      }
    }
    
    if (!generatedImageUrl && data.data?.[0]?.url) {
      generatedImageUrl = data.data[0].url;
    }
    
    if (!generatedImageUrl) {
      console.error('❌ Estrutura de resposta inesperada:', data);
      throw new Error('Nenhuma imagem foi gerada - estrutura de resposta inesperada');
    }
    
    console.log('✅ Imagem extraída com sucesso');

    // Salvar no histórico (usando usuário autenticado)
    if (copyId && workspaceId) {
      try {
        const historyData = {
          copy_id: copyId,
          workspace_id: workspaceId,
          created_by: user.id,
          generation_type: type === 'generate' ? 'create' : type === 'optimize' ? 'optimize' : 'variation',
          copy_type: 'image',
          prompt,
          parameters: {
            type,
            hasImageUrl: !!imageUrl,
            usedTemplates: projectData ? 'database' : 'fallback'
          },
          sessions: [{ title: 'Imagem Gerada', blocks: [{ type: 'image', content: generatedImageUrl }] }],
          model_used: 'google/gemini-2.5-flash-image-preview',
          generation_category: 'image',
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: totalTokens,
          project_identity: projectData ? {
            brand_name: projectData.brand_name,
            sector: projectData.sector,
          } : null,
        };

        const { error: historyError } = await supabaseAdmin
          .from('ai_generation_history')
          .insert(historyData);

        if (historyError) {
          console.error('⚠️ Erro ao salvar histórico:', historyError);
        } else {
          console.log('✅ Histórico de imagem salvo com sucesso');
        }
      } catch (historyError) {
        console.error('⚠️ Exceção ao salvar histórico:', historyError);
      }
    }

    return new Response(
      JSON.stringify({ imageUrl: generatedImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro ao gerar imagem:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar imagem' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
