import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserPromptCustomization } from "@/hooks/useUserPromptCustomization";
import { RotateCcw, Save, Sparkles, Info } from "lucide-react";
import { CopyType } from "@/lib/ai-models";
import { COPY_TYPE_LABELS } from "@/lib/prompt-keys";

interface SystemPromptEditorModalProps {
  open: boolean;
  onClose: () => void;
  copyType: CopyType;
}

const MAX_PROMPT_LENGTH = 5000;

export const SystemPromptEditorModal = ({ open, onClose, copyType }: SystemPromptEditorModalProps) => {
  const { 
    prompt, 
    isCustomized, 
    isLoading, 
    saveCustomization, 
    restoreDefault, 
    isSaving, 
    isRestoring 
  } = useUserPromptCustomization(copyType);
  
  const [editedPrompt, setEditedPrompt] = useState("");

  // Sincronizar editedPrompt quando modal abrir ou prompt mudar
  useEffect(() => {
    if (open && prompt) {
      setEditedPrompt(prompt);
    }
  }, [open, prompt]);

  const handleSave = async () => {
    if (!editedPrompt.trim()) return;
    
    try {
      await saveCustomization(editedPrompt);
      onClose();
    } catch (error) {
      // Erro já tratado pelo hook com toast
    }
  };

  const handleRestore = async () => {
    try {
      await restoreDefault();
      // O hook já atualiza o prompt, vamos sincronizar
      setEditedPrompt(prompt);
    } catch (error) {
      // Erro já tratado pelo hook com toast
    }
  };

  const charCount = editedPrompt.length;
  const isOverLimit = charCount > MAX_PROMPT_LENGTH;
  const isModified = editedPrompt !== prompt;
  const canSave = editedPrompt.trim() && isModified && !isOverLimit;
  const canRestore = isCustomized && !isRestoring;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle>Personalizar Prompt Base</DialogTitle>
            {isCustomized && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                Personalizado
              </Badge>
            )}
          </div>
          <DialogDescription>
            Personalize como a IA gera {COPY_TYPE_LABELS[copyType]}. Defina a identidade, tom e habilidades do agente.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Carregando prompt...</p>
            </div>
          </div>
        ) : (
          <>
            <Alert className="border-primary/20 bg-primary/5">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm space-y-1">
                <p><strong>Dicas de personalização:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Defina a identidade do agente (ex: "Você é um copywriter especialista em...")</li>
                  <li>Especifique o tom de voz desejado (formal, casual, persuasivo...)</li>
                  <li>Liste habilidades específicas que a IA deve ter</li>
                  <li>A estrutura de sessões/blocos será mantida automaticamente</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompt">Prompt Base</Label>
                <span className={`text-xs ${
                  isOverLimit 
                    ? 'text-destructive font-medium' 
                    : charCount > MAX_PROMPT_LENGTH * 0.9 
                      ? 'text-orange-500' 
                      : 'text-muted-foreground'
                }`}>
                  {charCount} / {MAX_PROMPT_LENGTH} caracteres
                  {isOverLimit && ' (limite excedido)'}
                </span>
              </div>
              <Textarea
                id="prompt"
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className={`min-h-[300px] font-mono text-sm resize-none ${
                  isOverLimit ? 'border-destructive focus-visible:ring-destructive' : ''
                }`}
                placeholder="Digite o prompt personalizado..."
              />
            </div>
          </>
        )}

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleRestore}
            disabled={!canRestore || isLoading}
            className="gap-2"
          >
            {isRestoring ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Restaurando...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Restaurar Original
              </>
            )}
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose} disabled={isSaving || isRestoring}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!canSave || isSaving || isLoading}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Personalização
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};