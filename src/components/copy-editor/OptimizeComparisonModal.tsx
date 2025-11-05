import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Session, Block } from "@/types/copy-editor";
import { ArrowRight, Copy, Replace, RotateCw } from "lucide-react";
import { ContentBlock } from "./ContentBlock";

interface OptimizeComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalContent: Session[];
  generatedContent: Session[];
  onReplace: () => void;
  onAdd: () => void;
  onRegenerate: (instructions: string) => void;
  isRegenerating?: boolean;
}

export function OptimizeComparisonModal({
  open,
  onOpenChange,
  originalContent,
  generatedContent,
  onReplace,
  onAdd,
  onRegenerate,
  isRegenerating = false
}: OptimizeComparisonModalProps) {
  const [showRegenerateField, setShowRegenerateField] = useState(false);
  const [regenerateInstructions, setRegenerateInstructions] = useState("");

  const handleRegenerate = () => {
    if (showRegenerateField && regenerateInstructions.trim()) {
      onRegenerate(regenerateInstructions);
      setRegenerateInstructions("");
      setShowRegenerateField(false);
    } else {
      setShowRegenerateField(true);
    }
  };

  const handleClose = () => {
    setShowRegenerateField(false);
    setRegenerateInstructions("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Comparar Conteúdo</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 h-[600px]">
          {/* Original Content */}
          <div className="flex flex-col border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
              <h3 className="font-semibold text-lg">Conteúdo Original</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-4 p-4">
                {originalContent.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 bg-background">
                    <h4 className="font-medium mb-3 text-sm text-muted-foreground">
                      {session.title}
                    </h4>
                    <div className="space-y-2 pointer-events-none opacity-90">
                      {session.blocks.map((block) => (
                        <ContentBlock
                          key={block.id}
                          block={block}
                          sessionId={session.id}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Arrow Separator */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="bg-background border rounded-full p-3 shadow-lg">
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Generated Content */}
          <div className="flex flex-col border rounded-lg overflow-hidden border-primary/20">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-primary/10">
              <h3 className="font-semibold text-lg text-primary">Conteúdo Gerado</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-4 p-4">
                {generatedContent.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 bg-primary/5">
                    <h4 className="font-medium mb-3 text-sm text-muted-foreground">
                      {session.title}
                    </h4>
                    <div className="space-y-2 pointer-events-none opacity-90">
                      {session.blocks.map((block) => (
                        <ContentBlock
                          key={block.id}
                          block={block}
                          sessionId={session.id}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Regenerate Instructions Field */}
        {showRegenerateField && (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Instruções Extras para Regenerar</label>
            <Textarea
              value={regenerateInstructions}
              onChange={(e) => setRegenerateInstructions(e.target.value)}
              placeholder="Ex: Torne mais direto, reduza o tamanho, ajuste o tom..."
              rows={3}
            />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={isRegenerating || (showRegenerateField && !regenerateInstructions.trim())}
          >
            <RotateCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerar
          </Button>
          <Button variant="outline" onClick={onAdd}>
            <Copy className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
          <Button onClick={onReplace}>
            <Replace className="h-4 w-4 mr-2" />
            Substituir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
