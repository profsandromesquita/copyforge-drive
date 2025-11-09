import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AIPromptTemplate, AIPromptHistory } from "@/types/ai-prompts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowCounterClockwise } from "phosphor-react";

interface PromptHistoryModalProps {
  prompt: AIPromptTemplate | null;
  open: boolean;
  onClose: () => void;
}

export const PromptHistoryModal = ({ prompt, open, onClose }: PromptHistoryModalProps) => {
  // Use useQuery diretamente no componente para evitar hooks condicionais
  const historyQuery = useQuery({
    queryKey: ['prompt-history', prompt?.id],
    queryFn: async () => {
      if (!prompt?.id) return [];
      
      const { data, error } = await supabase
        .from('ai_prompt_history')
        .select('*')
        .eq('template_id', prompt.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Buscar perfis dos usuários que modificaram
      const userIds = [...new Set(data.map(h => h.modified_by).filter(Boolean))];
      let profiles: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);
        
        if (profilesData) {
          profiles = Object.fromEntries(profilesData.map(p => [p.id, p]));
        }
      }
      
      // Combinar dados
      return data.map(h => ({
        ...h,
        profiles: h.modified_by ? profiles[h.modified_by] : undefined
      })) as (AIPromptHistory & { profiles?: { name: string; email: string } })[];
    },
    enabled: !!prompt?.id && open
  });

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
