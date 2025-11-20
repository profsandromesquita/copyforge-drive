import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
        } else if (data.error === 'AI configuration missing') {
          toast({
            title: 'Erro de Configuração',
            description: 'Problema interno de configuração da IA. Contate o suporte.',
            variant: 'destructive',
          });
        } else if (data.error.includes('AI API error')) {
          toast({
            title: 'Erro Temporário',
            description: 'Falha temporária no modelo de IA. Tente novamente em alguns instantes.',
            variant: 'destructive',
          });
        } else if (data.error.includes('AI did not return valid HTML/CSS')) {
          toast({
            title: 'Erro na Geração',
            description: 'A IA não retornou um HTML/CSS válido. Tente novamente com outra instrução.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro',
            description: data.error || 'Erro ao gerar página. Tente novamente.',
            variant: 'destructive',
          });
        }
        return;
      }

      if (data.html && data.css) {
        handleCodeGenerated(data.html, data.css);
      } else {
        toast({
          title: 'Erro na Geração',
          description: 'A IA não retornou um código válido. Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erro na geração automática:', error);
      
      let errorMessage = 'Erro ao gerar a página. Tente novamente.';
      if (error.message?.includes('insufficient_credits') || error.message?.includes('402')) {
        errorMessage = 'Créditos insuficientes. Adicione créditos para continuar.';
      } else if (error.message?.includes('Usuário não autenticado') || error.message?.includes('401')) {
        errorMessage = 'Sua sessão expirou. Por favor, recarregue a página e faça login novamente.';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle>Gerar Landing Page Web</DialogTitle>
          <DialogDescription>
            Crie e refine sua landing page com assistência de IA. Ajuste o design, adicione seções e otimize a conversão.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex h-[calc(100%-80px)]">
          {/* Painel esquerdo - Chat */}
          <div className="w-[40%] border-r border-border flex flex-col">
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
