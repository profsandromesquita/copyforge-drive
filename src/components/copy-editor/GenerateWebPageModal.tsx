import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { WebChatPanel } from './web-generation/WebChatPanel';
import { WebPreviewPanel } from './web-generation/WebPreviewPanel';
import { useCopyEditor } from '@/hooks/useCopyEditor';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0">
        <div className="flex h-full">
          {/* Painel Esquerdo - Chat */}
          <div className="w-1/2 border-r border-border flex flex-col">
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

          {/* Painel Direito - Preview */}
          <div className="w-1/2 flex flex-col bg-muted/30">
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
