import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { WebChatPanel } from './web-generation/WebChatPanel';
import { WebPreviewPanel } from './web-generation/WebPreviewPanel';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useWorkspace } from '@/hooks/useWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerateWebPageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateWebPageModal({ open, onOpenChange }: GenerateWebPageModalProps) {
  const { copyId, copyTitle, copyType, sessions } = useCopyEditor();
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [generatedCode, setGeneratedCode] = useState<{ html: string; css: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Obter userId
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setGeneratedCode(null);
      setIsGenerating(false);
    }
  }, [open]);

  const handleCodeGenerated = (html: string, css: string) => {
    setGeneratedCode({ html, css });
    setIsGenerating(false);
  };

  // Auto-geração inicial
  useEffect(() => {
    if (open && !generatedCode && !isGenerating && copyId) {
      setIsGenerating(true);
      // Dispara geração automática ao abrir
      setTimeout(() => {
        handleAutoGeneration();
      }, 500);
    }
  }, [open]);

  const handleAutoGeneration = async () => {
    if (!userId || !activeWorkspace?.id) {
      toast({
        title: 'Erro',
        description: 'Sua sessão expirou. Por favor, recarregue a página.',
        variant: 'destructive',
      });
      setIsGenerating(false);
      return;
    }

    const autoPrompt = 'Gere uma landing page profissional e completa com base no conteúdo da copy fornecida. Use as melhores práticas de design e conversão.';
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-web-page', {
        body: {
          copyId,
          copyTitle,
          copyType,
          sessions,
          userInstruction: autoPrompt,
          previousCode: null,
          conversationHistory: [],
          workspaceId: activeWorkspace.id,
          userId,
        },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error === 'insufficient_credits') {
          toast({
            title: 'Créditos Insuficientes',
            description: 'Você não tem créditos suficientes. Adicione créditos para continuar.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro',
            description: 'Erro ao gerar página. Tente novamente.',
            variant: 'destructive',
          });
        }
        setIsGenerating(false);
        return;
      }

      if (data.html && data.css) {
        handleCodeGenerated(data.html, data.css);
      }
    } catch (error: any) {
      console.error('Erro na geração automática:', error);
      
      let errorMessage = 'Erro ao gerar a página. Tente novamente.';
      if (error.message?.includes('insufficient_credits')) {
        errorMessage = 'Créditos insuficientes. Adicione créditos para continuar.';
      } else if (error.message?.includes('Usuário não autenticado') || error.message?.includes('401')) {
        errorMessage = 'Sua sessão expirou. Por favor, recarregue a página e faça login novamente.';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] max-h-screen p-0 gap-0">
        <div className="flex h-full">
          {/* Painel Esquerdo - Chat (40%) */}
          <div className="w-[40%] border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Gerar Landing Page Web</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Converse com a IA para criar e ajustar sua página
              </p>
            </div>
            <WebChatPanel
              copyId={copyId}
              copyTitle={copyTitle}
              copyType={copyType}
              sessions={sessions}
              onCodeGenerated={handleCodeGenerated}
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
              generatedCode={generatedCode}
              workspaceId={activeWorkspace?.id || null}
              userId={userId}
            />
          </div>

          {/* Painel Direito - Preview (60%) */}
          <div className="w-[60%] flex flex-col bg-muted/30">
            <WebPreviewPanel
              generatedCode={generatedCode}
              isGenerating={isGenerating}
              copyTitle={copyTitle}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
