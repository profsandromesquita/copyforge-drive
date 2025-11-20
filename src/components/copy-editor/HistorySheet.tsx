import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Wand2, Eye } from 'lucide-react';
import { Copy as CopyIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface HistoryItem {
  id: string;
  generation_type: string;
  generation_category: string | null;
  created_at: string;
  prompt: string;
  model_used: string | null;
  sessions: any;
  original_content: any;
  copy_type: string | null;
  was_auto_routed: boolean | null;
  parameters: any;
}

interface HistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: HistoryItem[];
  loadingHistory: boolean;
  onHistoryItemClick: (item: HistoryItem) => void;
}

export function HistorySheet({ 
  open, 
  onOpenChange, 
  history, 
  loadingHistory,
  onHistoryItemClick 
}: HistorySheetProps) {
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [selectedPromptItem, setSelectedPromptItem] = useState<HistoryItem | null>(null);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Histórico de Gerações IA</SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p>Nenhuma geração anterior</p>
              </div>
            ) : (
              <div className="grid gap-2 pr-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all hover:shadow-md hover:border-primary/30"
                  >
                    <div className="space-y-2">
                      {/* Header com tipo e data */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {item.generation_type === 'optimize' ? (
                            <>
                              <Wand2 className="h-3.5 w-3.5 text-primary" />
                              <Badge variant="secondary" className="text-xs py-0 h-5">Otimização</Badge>
                            </>
                          ) : item.generation_type === 'variation' ? (
                            <>
                              <CopyIcon className="h-3.5 w-3.5 text-primary" />
                              <Badge variant="secondary" className="text-xs py-0 h-5">Variação</Badge>
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-xs py-0 h-5">Criação</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPromptItem(item);
                              setShowPromptDialog(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(item.created_at), "MMM d, h:mm a", { locale: ptBR })}
                          </span>
                        </div>
                      </div>

                      {/* Prompt - clicável para visualizar */}
                      <button
                        onClick={() => onHistoryItemClick(item)}
                        className="w-full text-left"
                      >
                        <p className="text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {item.prompt}
                        </p>
                      </button>

                      {/* Footer com informações adicionais */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                          <span className="px-2 py-0.5 bg-muted rounded text-xs">
                            {item.sessions?.length || 0} sessão(ões)
                          </span>
                          {item.copy_type && (
                            <span className="px-2 py-0.5 bg-muted rounded capitalize text-xs">
                              {item.copy_type.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onHistoryItemClick(item)}
                          className="text-xs h-7"
                        >
                          Visualizar Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Dialog para visualizar prompt completo */}
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Detalhes do Prompt</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {selectedPromptItem && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Prompt:</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedPromptItem.prompt}
                  </p>
                </div>

                {selectedPromptItem.parameters && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Parâmetros:</h4>
                    <div className="space-y-2">
                      {selectedPromptItem.parameters.objectives && selectedPromptItem.parameters.objectives.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Objetivos:</span>
                          {selectedPromptItem.parameters.objectives.map((obj: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">{obj}</Badge>
                          ))}
                        </div>
                      )}
                      {selectedPromptItem.parameters.styles && selectedPromptItem.parameters.styles.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Estilos:</span>
                          {selectedPromptItem.parameters.styles.map((style: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">{style}</Badge>
                          ))}
                        </div>
                      )}
                      {selectedPromptItem.parameters.size && (
                        <div className="flex gap-2">
                          <span className="text-xs text-muted-foreground">Tamanho:</span>
                          <Badge variant="outline" className="text-xs">{selectedPromptItem.parameters.size}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-3 border-t">
                  <span className="text-xs px-2 py-1 bg-muted rounded">
                    {selectedPromptItem.sessions?.length || 0} sessão(ões) geradas
                  </span>
                  {selectedPromptItem.copy_type && (
                    <span className="text-xs px-2 py-1 bg-muted rounded capitalize">
                      {selectedPromptItem.copy_type.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
