import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AIPromptTemplate } from "@/types/ai-prompts";
import { useAIPrompts } from "@/hooks/useAIPrompts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowCounterClockwise } from "phosphor-react";

interface PromptHistoryModalProps {
  prompt: AIPromptTemplate | null;
  open: boolean;
  onClose: () => void;
}

export const PromptHistoryModal = ({ prompt, open, onClose }: PromptHistoryModalProps) => {
  const { getHistory } = useAIPrompts();
  const historyQuery = prompt ? getHistory(prompt.id) : { data: [], isLoading: false };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="break-words">Histórico: {prompt?.name}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {historyQuery.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando histórico...
            </div>
          ) : historyQuery.data?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma alteração registrada ainda
            </div>
          ) : (
            <div className="space-y-4">
              {historyQuery.data?.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {entry.change_reason && (
                          <Badge variant="outline" className="break-words">
                            {entry.change_reason}
                          </Badge>
                        )}
                      </div>
                      {entry.profiles && (
                        <p className="text-xs text-muted-foreground mt-1 break-words">
                          Por: {entry.profiles.name || entry.profiles.email}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {entry.old_prompt && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver alterações
                      </summary>
                      <div className="mt-2 space-y-2">
                        <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded">
                          <p className="font-medium mb-1">Anterior:</p>
                          <pre className="whitespace-pre-wrap break-words">{entry.old_prompt}</pre>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded">
                          <p className="font-medium mb-1">Novo:</p>
                          <pre className="whitespace-pre-wrap break-words">{entry.new_prompt}</pre>
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
