import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AIPromptTemplate } from "@/types/ai-prompts";
import { Eye, FloppyDisk } from "phosphor-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PromptEditorModalProps {
  prompt: AIPromptTemplate | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, newPrompt: string, reason?: string) => void;
}

export const PromptEditorModal = ({ prompt, open, onClose, onSave }: PromptEditorModalProps) => {
  const [editedPrompt, setEditedPrompt] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [showDefault, setShowDefault] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && prompt) {
      setEditedPrompt(prompt.current_prompt);
      setChangeReason("");
      setShowDefault(false);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    if (prompt && editedPrompt.trim()) {
      onSave(prompt.id, editedPrompt, changeReason || undefined);
      onClose();
    }
  };

  if (!prompt) return null;

  const charCount = editedPrompt.length;
  const isModified = editedPrompt !== prompt.current_prompt;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {prompt.name}
            <Badge className="bg-primary/10 text-primary">{prompt.category}</Badge>
          </DialogTitle>
          <DialogDescription className="break-words">
            {prompt.purpose}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Prompt Atual</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDefault(!showDefault)}
                  className="gap-2"
                >
                  <Eye size={16} />
                  {showDefault ? "Ocultar" : "Ver"} Padrão
                </Button>
              </div>
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Digite o prompt..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                {charCount} caracteres {charCount > 10000 && <span className="text-destructive">(máximo recomendado: 10.000)</span>}
              </p>
            </div>

            {showDefault && (
              <div className="bg-muted p-4 rounded-lg">
                <Label className="mb-2 block">Prompt Padrão (referência)</Label>
                <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                  {prompt.default_prompt}
                </pre>
              </div>
            )}

            <div>
              <Label htmlFor="reason">Motivo da Alteração (opcional)</Label>
              <Input
                id="reason"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Ex: Ajuste no tom de voz, melhoria na clareza..."
                className="mt-2"
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!editedPrompt.trim() || !isModified}
            className="gap-2"
          >
            <FloppyDisk size={16} />
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
