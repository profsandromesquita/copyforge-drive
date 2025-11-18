import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildImageSystemPrompt(projectIdentity?: any): string {
  let systemPrompt = `You are a professional image generation AI specialized in creating high-quality, impactful images for marketing and copywriting.

=== IMAGE QUALITY STANDARDS ===
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

  if (projectIdentity) {
    systemPrompt += `\n\n=== PROJECT CONTEXT ===`;
    
    if (projectIdentity.brand_name) {
      systemPrompt += `\nBrand: ${projectIdentity.brand_name}`;
    }
    
    if (projectIdentity.sector) {
      systemPrompt += `\nSector: ${projectIdentity.sector}`;
    }
    
    if (projectIdentity.brand_personality && projectIdentity.brand_personality.length > 0) {
      systemPrompt += `\nBrand Personality: ${projectIdentity.brand_personality.join(', ')}`;
    }
    
    if (projectIdentity.central_purpose) {
      systemPrompt += `\nPurpose: ${projectIdentity.central_purpose}`;
    }
    
    systemPrompt += `\n\nGenerate images that align with this brand identity and visual style.`;
  }
  
  return systemPrompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, imageUrl, type = 'generate', copyId, workspaceId } = await req.json();

    if (!prompt || !prompt.trim()) {
      throw new Error('Prompt é obrigatório');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Buscar contexto da copy se copyId foi fornecido
    let projectIdentity = null;
    let copyContext = null;
    
    if (copyId) {
      console.log('🔍 Buscando contexto da copy:', copyId);
      
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        const { data: copyData, error: copyError } = await supabaseClient
          .from('copies')
          .select(`
            id,
            title,
            copy_type,
            project_id,
            projects (
              brand_name,
              sector,
              central_purpose,
              brand_personality,
              voice_tones,
              keywords
            )
          `)
          .eq('id', copyId)
          .single();
        
        if (copyError) {
          console.error('⚠️ Erro ao buscar contexto da copy:', copyError);
        } else if (copyData) {
          console.log('✅ Contexto da copy recuperado');
          copyContext = {
            title: copyData.title,
            copy_type: copyData.copy_type
          };
          
          if (copyData.projects) {
            projectIdentity = {
              brand_name: copyData.projects.brand_name,
              sector: copyData.projects.sector,
              central_purpose: copyData.projects.central_purpose,
              brand_personality: copyData.projects.brand_personality,
              voice_tones: copyData.projects.voice_tones,
              keywords: copyData.projects.keywords
            };
            console.log('📊 Project identity:', projectIdentity);
          }
        }
      }
    }

    // Construir enhanced prompt com contexto
    let enhancedPrompt = prompt;
    
    if (copyContext) {
      enhancedPrompt = `Context: Creating image for "${copyContext.title}" (${copyContext.copy_type})\n\n${prompt}`;
    }
    
    // Adicionar system prompt
    const systemPrompt = buildImageSystemPrompt(projectIdentity);
    
    console.log('📝 System prompt length:', systemPrompt.length);
    console.log('📝 User prompt:', enhancedPrompt.substring(0, 100) + '...');
    console.log(`${type === 'generate' ? 'Gerando' : type === 'optimize' ? 'Otimizando' : 'Criando variação de'} imagem`);

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

    // Preparar mensagens com system prompt
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
      console.error('Erro na API:', response.status, errorText);
      
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
    console.log('Resposta da API recebida:', JSON.stringify(data, null, 2));

    // Extrair informações de uso (tokens)
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;

    // Extrair a imagem base64 da resposta - tentar diferentes estruturas
    let generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    // Tentar estrutura alternativa para imagens geradas/editadas
    if (!generatedImageUrl && data.choices?.[0]?.message?.content) {
      // Às vezes a imagem vem no content
      const content = data.choices[0].message.content;
      if (Array.isArray(content)) {
        const imageContent = content.find(c => c.type === 'image_url');
        if (imageContent) {
          generatedImageUrl = imageContent.image_url?.url;
        }
      }
    }
    
    // Tentar outra estrutura alternativa
    if (!generatedImageUrl && data.data?.[0]?.url) {
      generatedImageUrl = data.data[0].url;
    }
    
    if (!generatedImageUrl) {
      console.error('Estrutura de resposta inesperada:', data);
      throw new Error('Nenhuma imagem foi gerada - estrutura de resposta inesperada');
    }
    
    console.log('Imagem extraída com sucesso');

    // Salvar no histórico se copyId e workspaceId forem fornecidos
    try {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      console.log("=== DEBUG HISTÓRICO IMAGEM ===");
      console.log("SUPABASE_URL:", !!SUPABASE_URL);
      console.log("SUPABASE_SERVICE_ROLE_KEY:", !!SUPABASE_SERVICE_ROLE_KEY);
      console.log("copyId:", copyId);
      console.log("workspaceId:", workspaceId);
      
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && copyId && workspaceId) {
        console.log("Iniciando salvamento do histórico de imagem...");
        // Obter o auth header do request para pegar o usuário autenticado
        const authHeader = req.headers.get('Authorization');
        let userId = null;
        
        if (authHeader) {
          try {
            // Criar cliente Supabase com service role para verificar o token
            const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
            const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            
            // Obter usuário do token
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
            
            if (error) {
              console.error('Error getting user:', error);
            } else {
              userId = user?.id;
              console.log('User ID obtido:', userId);
            }
          } catch (e) {
            console.error('Error getting user from token:', e);
          }
        }
        
        const historyData = {
          copy_id: copyId,
          workspace_id: workspaceId,
          created_by: userId,
          generation_type: type === 'generate' ? 'create' : type === 'optimize' ? 'optimize' : 'variation',
          copy_type: 'image',
          prompt,
          parameters: {
            type,
            hasImageUrl: !!imageUrl,
          },
          sessions: [{ title: 'Imagem Gerada', blocks: [{ type: 'image', content: generatedImageUrl }] }],
          model_used: 'google/gemini-2.5-flash-image-preview',
          generation_category: 'image',
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: totalTokens,
        };

        const historyResponse = await fetch(`${SUPABASE_URL}/rest/v1/ai_generation_history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(historyData),
        });

        if (!historyResponse.ok) {
          const errorText = await historyResponse.text();
          console.error('Erro ao salvar histórico:', errorText);
        } else {
          console.log('✓ Histórico de imagem salvo com sucesso!');
        }
      } else {
        console.log("⚠️ Não foi possível salvar histórico de imagem - parâmetros faltando");
      }
    } catch (historyError) {
      console.error('Erro ao salvar histórico de imagem:', historyError);
      // Não falhar a requisição se o histórico falhar
    }

    return new Response(
      JSON.stringify({ imageUrl: generatedImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao gerar imagem:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar imagem' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
