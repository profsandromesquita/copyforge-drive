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
  anuncio: 'generate_anuncio',
  landing_page: 'generate_landing_page',
  vsl: 'generate_vsl',
  email: 'generate_email',
  webinar: 'generate_webinar',
  conteudo: 'generate_conteudo',
  mensagem: 'generate_mensagem',
  outro: 'generate_outro'
};

export const SystemPromptEditorModal = ({ open, onClose, copyType }: SystemPromptEditorModalProps) => {
  const { prompts, updatePrompt, restoreDefault } = useAIPrompts();
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

  if (!currentPrompt) return null;

  const charCount = editedPrompt.length;
  const isModified = editedPrompt !== currentPrompt.current_prompt;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Personalizar System Prompt Base</DialogTitle>
          <DialogDescription>
            Edite o prompt que orienta a IA na geração de {copyType}. Este prompt define o comportamento e estilo da IA.
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
};
