import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, Wand2, Shuffle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCopyEditor } from '@/hooks/useCopyEditor';
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
  const { updateBlock } = useCopyEditor();

  const hasImage = !!block.config.imageUrl;

  const handleGenerate = async (type: 'generate' | 'optimize' | 'variation') => {
    const prompt = type === 'generate' ? generatePrompt : type === 'optimize' ? optimizePrompt : variationPrompt;
    
    if (!prompt.trim()) {
      toast.error('Por favor, descreva a imagem que deseja gerar');
      return;
    }

    if ((type === 'optimize' || type === 'variation') && !hasImage) {
      toast.error('Nenhuma imagem disponível para editar');
      return;
    }

    setIsGenerating(true);
    try {
      const body: any = { prompt };
      
      if (type === 'optimize' || type === 'variation') {
        body.imageUrl = block.config.imageUrl;
        body.type = type;
      }

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body
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
        updateBlock(block.id, {
          config: {
            imageUrl: data.imageUrl
          }
        });

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
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">IA de Imagens</h3>
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
