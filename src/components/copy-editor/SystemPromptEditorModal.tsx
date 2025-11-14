import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAIPrompts } from "@/hooks/useAIPrompts";
import { RotateCcw, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CopyType } from "@/lib/ai-models";

interface SystemPromptEditorModalProps {
  open: boolean;
  onClose: () => void;
  copyType: CopyType;
}

const COPY_TYPE_TO_PROMPT_KEY: Record<CopyType, string> = {
  anuncio: 'generate_copy_ad',
  landing_page: 'generate_copy_landing_page',
  vsl: 'generate_copy_vsl',
  email: 'generate_copy_email',
  webinar: 'generate_copy_webinar',
  conteudo: 'generate_copy_content',
  mensagem: 'generate_copy_message',
  outro: 'generate_copy_base'
};

export const SystemPromptEditorModal = ({ open, onClose, copyType }: SystemPromptEditorModalProps) => {
  const { prompts, isLoading, updatePrompt, restoreDefault } = useAIPrompts();
  const { toast } = useToast();
  const [editedPrompt, setEditedPrompt] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  // Buscar o prompt correspondente ao tipo de copy
  const promptKey = COPY_TYPE_TO_PROMPT_KEY[copyType];
  const currentPrompt = prompts?.find(p => p.prompt_key === promptKey);

  // Sincronizar editedPrompt quando modal abrir ou prompt mudar
  useEffect(() => {
    if (open && currentPrompt?.current_prompt) {
      setEditedPrompt(currentPrompt.current_prompt);
    }
  }, [open, currentPrompt?.current_prompt]);

  const handleSave = () => {
    if (!currentPrompt || !editedPrompt.trim()) return;
    
    updatePrompt.mutate({
      id: currentPrompt.id,
      current_prompt: editedPrompt,
      change_reason: "Personalização pelo usuário no fluxo de criação"
    }, {
      onSuccess: () => {
        toast({
          title: "✅ Prompt atualizado",
          description: "O system prompt foi personalizado com sucesso."
        });
        onClose();
      },
      onError: () => {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível atualizar o prompt. Tente novamente.",
          variant: "destructive"
        });
      }
    });
  };

  const handleRestore = () => {
    if (!currentPrompt) return;
    
    setIsRestoring(true);
    restoreDefault.mutate(currentPrompt.id, {
      onSuccess: () => {
        setEditedPrompt(currentPrompt.default_prompt);
        toast({
          title: "✅ Prompt restaurado",
          description: "O prompt foi restaurado para o padrão original."
        });
        setIsRestoring(false);
      },
      onError: () => {
        toast({
          title: "Erro ao restaurar",
          description: "Não foi possível restaurar o prompt. Tente novamente.",
          variant: "destructive"
        });
        setIsRestoring(false);
      }
    });
  };

  const charCount = editedPrompt.length;
  const isModified = currentPrompt ? editedPrompt !== currentPrompt.current_prompt : false;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Personalizar System Prompt Base</DialogTitle>
          <DialogDescription>
            Edite o prompt que orienta a IA na geração de {copyType}. Este prompt define o comportamento e estilo da IA.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Carregando prompt...</p>
            </div>
          </div>
        ) : !currentPrompt ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Prompt não encontrado para este tipo de copy.
              </p>
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto space-y-4 py-4">
              <div>
                <Label className="mb-2 block">Prompt Atual</Label>
                <Textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="min-h-[350px] font-mono text-sm"
                  placeholder="Digite o system prompt..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {charCount} caracteres {charCount > 10000 && <span className="text-amber-600">(máximo recomendado: 10.000)</span>}
                </p>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={handleRestore}
                disabled={isRestoring}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Restaurar Original
              </Button>
              
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!isModified || !editedPrompt.trim()}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </DialogFooter>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
};
