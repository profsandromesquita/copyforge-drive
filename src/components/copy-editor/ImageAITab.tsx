import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'phosphor-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, Wand2, Shuffle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Block } from '@/types/copy-editor';

interface ImageAITabProps {
  block: Block;
  onClose: () => void;
}

export const ImageAITab = ({ block, onClose }: ImageAITabProps) => {
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [optimizePrompt, setOptimizePrompt] = useState('');
  const [variationPrompt, setVariationPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { updateBlock, addBlock, sessions, copyId } = useCopyEditor();
  const { activeWorkspace } = useWorkspace();

  const hasImage = !!block.config.imageUrl;

  // Encontrar a sessão e índice do bloco atual
  const getBlockPosition = () => {
    for (const session of sessions) {
      const blockIndex = session.blocks.findIndex(b => b.id === block.id);
      if (blockIndex !== -1) {
        return { sessionId: session.id, blockIndex };
      }
    }
    return null;
  };

  const handleGenerate = async (type: 'generate' | 'optimize' | 'variation') => {
    // Validação
    if (type === 'generate' && !generatePrompt.trim()) {
      toast.error('Digite um prompt para gerar a imagem');
      return;
    }
    
    if ((type === 'optimize' || type === 'variation') && !hasImage) {
      toast.error('Este bloco não possui uma imagem');
      return;
    }

    setIsGenerating(true);
    try {
      let finalPrompt = '';
      let imageUrlToUse = block.config.imageUrl;
      
      // Construir prompt baseado no tipo
      switch (type) {
        case 'generate':
          finalPrompt = generatePrompt.trim();
          imageUrlToUse = undefined;
          break;
          
        case 'optimize':
          finalPrompt = optimizePrompt.trim() || 
            `Enhance and optimize this image maintaining its core concept but improving:
- Overall visual quality and sharpness
- Color balance and lighting
- Composition and framing
- Professional aesthetic
- Emotional impact

${optimizePrompt.trim() ? `Additional instructions: ${optimizePrompt.trim()}` : ''}`;
          break;
          
        case 'variation':
          finalPrompt = variationPrompt.trim() || 
            `Create an alternative version of this image exploring:
- Different angle or perspective
- Alternative color palette or mood
- Different composition while keeping the main concept
- Fresh creative approach

${variationPrompt.trim() ? `Additional instructions: ${variationPrompt.trim()}` : ''}`;
          break;
      }
      
      console.log('🎨 Gerando imagem:', { type, prompt: finalPrompt.substring(0, 100) });

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: finalPrompt,
          imageUrl: imageUrlToUse,
          type: type,
          copyId,
          workspaceId: activeWorkspace?.id,
        }
      });

      if (error) {
        if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
          toast.error('Limite de requisições atingido. Tente novamente em alguns instantes.');
        } else if (error.message?.includes('insufficient_credits') || error.message?.includes('402')) {
          toast.error('Créditos insuficientes. Adicione mais créditos para continuar.');
        } else {
          throw error;
        }
        return;
      }

      if (data?.imageUrl) {
        if (type === 'variation') {
          // Criar um novo bloco de imagem com a variação
          const position = getBlockPosition();
          if (position) {
            addBlock(position.sessionId, {
              type: 'image',
              content: '',
              config: {
                imageUrl: data.imageUrl,
                aspectRatio: '1:1',
                imageSize: block.config.imageSize || 'md',
                roundedBorders: block.config.roundedBorders || false,
              }
            }, position.blockIndex + 1);
          }
        } else {
          // Atualizar o bloco existente para gerar e otimizar
          updateBlock(block.id, {
            config: {
              imageUrl: data.imageUrl,
              aspectRatio: '1:1'
            }
          });
        }

        const successMessage = type === 'generate' ? 'Imagem gerada com sucesso!' : 
                             type === 'optimize' ? 'Imagem otimizada com sucesso!' : 
                             'Variação criada com sucesso!';
        toast.success(successMessage);
        onClose();
      } else {
        throw new Error('Nenhuma imagem foi retornada');
      }

    } catch (error: any) {
      console.error('Erro ao gerar imagem:', error);
      toast.error(error.message || 'Erro ao gerar imagem');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft size={20} />
        </Button>
        <h3 className="font-semibold">Gerar Imagem com IA</h3>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Gerar</TabsTrigger>
          <TabsTrigger value="optimize" disabled={!hasImage}>Otimizar</TabsTrigger>
          <TabsTrigger value="variation" disabled={!hasImage}>Variação</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="generate-prompt">Instruções</Label>
            <Textarea
              id="generate-prompt"
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              placeholder="Descreva a imagem que você deseja gerar. Exemplo: Uma paisagem de montanhas ao pôr do sol, com cores vibrantes..."
              className="min-h-[120px]"
              disabled={isGenerating}
            />
          </div>

          <Button
            onClick={() => handleGenerate('generate')}
            disabled={isGenerating || !generatePrompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Imagem
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="optimize" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="optimize-prompt">Instruções de Otimização</Label>
            <Textarea
              id="optimize-prompt"
              value={optimizePrompt}
              onChange={(e) => setOptimizePrompt(e.target.value)}
              placeholder="Descreva como deseja otimizar a imagem. Exemplo: Aumentar o brilho e saturação, melhorar a nitidez..."
              className="min-h-[120px]"
              disabled={isGenerating}
            />
          </div>

          <Button
            onClick={() => handleGenerate('optimize')}
            disabled={isGenerating || !optimizePrompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Otimizando...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Otimizar Imagem
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="variation" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="variation-prompt">Instruções de Variação</Label>
            <Textarea
              id="variation-prompt"
              value={variationPrompt}
              onChange={(e) => setVariationPrompt(e.target.value)}
              placeholder="Descreva a variação desejada. Exemplo: Mude o horário para manhã, altere as cores para tons pastéis..."
              className="min-h-[120px]"
              disabled={isGenerating}
            />
          </div>

          <Button
            onClick={() => handleGenerate('variation')}
            disabled={isGenerating || !variationPrompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Shuffle className="mr-2 h-4 w-4" />
                Criar Variação
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};
