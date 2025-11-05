import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Criar prompt para geração de imagem
    let enhancedPrompt = '';
    
    if (type === 'generate') {
      enhancedPrompt = `Generate a high-quality, detailed image: ${prompt}`;
    } else if (type === 'optimize') {
      enhancedPrompt = `Improve this image based on: ${prompt}. Enhance quality and details.`;
    } else {
      enhancedPrompt = `Create a variation of this image: ${prompt}. Generate a creative alternative version.`;
    }
    
    console.log(`${type === 'generate' ? 'Gerando' : type === 'optimize' ? 'Otimizando' : 'Criando variação de'} imagem com prompt:`, enhancedPrompt);

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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: messageContent
          }
        ],
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
      
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && copyId && workspaceId) {
        const historyData = {
          copy_id: copyId,
          workspace_id: workspaceId,
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
          console.error('Erro ao salvar histórico:', await historyResponse.text());
        } else {
          console.log('Histórico de imagem salvo com sucesso');
        }
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
