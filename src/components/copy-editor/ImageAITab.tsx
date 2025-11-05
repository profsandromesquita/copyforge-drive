import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCopyEditor } from '@/hooks/useCopyEditor';

interface ImageAITabProps {
  blockId: string;
  onClose: () => void;
}

export const ImageAITab = ({ blockId, onClose }: ImageAITabProps) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { updateBlock } = useCopyEditor();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, descreva a imagem que deseja gerar');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt }
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
        // Atualizar o bloco com a imagem gerada
        updateBlock(blockId, {
          config: {
            imageUrl: data.imageUrl
          }
        });

        toast.success('Imagem gerada com sucesso!');
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
        <h3 className="text-lg font-semibold">Gerar Imagem com IA</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai-prompt">Instruções</Label>
        <Textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Descreva a imagem que você deseja gerar. Exemplo: Uma paisagem de montanhas ao pôr do sol, com cores vibrantes..."
          className="min-h-[120px]"
          disabled={isGenerating}
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
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
    </div>
  );
};
