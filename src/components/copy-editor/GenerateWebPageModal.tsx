import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { WebChatPanel } from './web-generation/WebChatPanel';
import { WebPreviewPanel } from './web-generation/WebPreviewPanel';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { supabase } from '@/integrations/supabase/client';

interface GenerateWebPageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateWebPageModal({ open, onOpenChange }: GenerateWebPageModalProps) {
  const { copyId, copyTitle, copyType, sessions } = useCopyEditor();
  const [generatedCode, setGeneratedCode] = useState<{ html: string; css: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
        },
      });

      if (error) throw error;

      if (data.html && data.css) {
        handleCodeGenerated(data.html, data.css);
      }
    } catch (error) {
      console.error('Erro na geração automática:', error);
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
