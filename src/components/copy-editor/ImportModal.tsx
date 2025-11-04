import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Session, Block } from '@/types/copy-editor';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useProject } from '@/hooks/useProject';
import { Folder, FileText, Package } from 'phosphor-react';
import { toast } from 'sonner';

interface Copy {
  id: string;
  title: string;
  sessions: Session[];
  is_template?: boolean;
}

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (sessions: Session[]) => void;
}

interface SelectionState {
  [sessionId: string]: {
    selected: boolean;
    blocks: {
      [blockId: string]: boolean;
    };
  };
}

export const ImportModal = ({ open, onOpenChange, onImport }: ImportModalProps) => {
  const [step, setStep] = useState<'select-source' | 'select-content'>('select-source');
  const [copies, setCopies] = useState<Copy[]>([]);
  const [templates, setTemplates] = useState<Copy[]>([]);
  const [selectedCopy, setSelectedCopy] = useState<Copy | null>(null);
  const [selection, setSelection] = useState<SelectionState>({});
  const [loading, setLoading] = useState(false);
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProject();

  useEffect(() => {
    if (open) {
      fetchCopies();
      fetchTemplates();
    }
  }, [open, activeWorkspace?.id, activeProject?.id]);

  const fetchCopies = async () => {
    if (!activeWorkspace?.id) return;

    setLoading(true);
    try {
      const query = supabase
        .from('copies')
        .select('id, title, sessions')
        .eq('workspace_id', activeWorkspace.id)
        .eq('is_template', false)
        .order('updated_at', { ascending: false });

      if (activeProject?.id) {
        query.eq('project_id', activeProject.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCopies((data as any[]).map(item => ({
        ...item,
        sessions: item.sessions as Session[]
      })));
    } catch (error) {
      console.error('Error fetching copies:', error);
      toast.error('Erro ao carregar copies');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    if (!activeWorkspace?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('copies')
        .select('id, title, sessions')
        .eq('workspace_id', activeWorkspace.id)
        .eq('is_template', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates((data as any[]).map(item => ({
        ...item,
        sessions: item.sessions as Session[]
      })));
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySelect = (copy: Copy) => {
    setSelectedCopy(copy);
    // Initialize selection state
    const initialSelection: SelectionState = {};
    copy.sessions.forEach((session) => {
      initialSelection[session.id] = {
        selected: false,
        blocks: {},
      };
      session.blocks.forEach((block) => {
        initialSelection[session.id].blocks[block.id] = false;
      });
    });
    setSelection(initialSelection);
    setStep('select-content');
  };

  const handleSelectAll = () => {
    if (!selectedCopy) return;
    
    const newSelection: SelectionState = {};
    selectedCopy.sessions.forEach((session) => {
      newSelection[session.id] = {
        selected: true,
        blocks: {},
      };
      session.blocks.forEach((block) => {
        newSelection[session.id].blocks[block.id] = true;
      });
    });
    setSelection(newSelection);
  };

  const toggleSession = (sessionId: string) => {
    const session = selectedCopy?.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const isCurrentlySelected = selection[sessionId]?.selected;
    const newSelection = { ...selection };
    
    newSelection[sessionId] = {
      selected: !isCurrentlySelected,
      blocks: {},
    };

    session.blocks.forEach((block) => {
      newSelection[sessionId].blocks[block.id] = !isCurrentlySelected;
    });

    setSelection(newSelection);
  };

  const toggleBlock = (sessionId: string, blockId: string) => {
    const newSelection = { ...selection };
    const currentValue = newSelection[sessionId].blocks[blockId];
    newSelection[sessionId].blocks[blockId] = !currentValue;

    // Check if all blocks are selected to update session selection
    const session = selectedCopy?.sessions.find((s) => s.id === sessionId);
    if (session) {
      const allBlocksSelected = session.blocks.every(
        (block) => newSelection[sessionId].blocks[block.id]
      );
      newSelection[sessionId].selected = allBlocksSelected;
    }

    setSelection(newSelection);
  };

  const handleImport = () => {
    if (!selectedCopy) return;

    const sessionsToImport: Session[] = [];

    selectedCopy.sessions.forEach((session) => {
      const selectedBlocks = session.blocks.filter(
        (block) => selection[session.id]?.blocks[block.id]
      );

      if (selectedBlocks.length > 0) {
        // Generate new IDs to avoid conflicts
        const newSession: Session = {
          ...session,
          id: `session-${Date.now()}-${Math.random()}`,
          blocks: selectedBlocks.map((block) => ({
            ...block,
            id: `block-${Date.now()}-${Math.random()}`,
          })),
        };
        sessionsToImport.push(newSession);
      }
    });

    if (sessionsToImport.length === 0) {
      toast.error('Selecione pelo menos um bloco para importar');
      return;
    }

    onImport(sessionsToImport);
    handleClose();
    toast.success('Conteúdo importado com sucesso!');
  };

  const handleClose = () => {
    setStep('select-source');
    setSelectedCopy(null);
    setSelection({});
    onOpenChange(false);
  };

  const handleBack = () => {
    setStep('select-source');
    setSelectedCopy(null);
    setSelection({});
  };

  const CopyList = ({ items, icon: Icon }: { items: Copy[]; icon: any }) => (
    <ScrollArea className="h-[400px]">
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum item encontrado
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((copy) => (
            <button
              key={copy.id}
              onClick={() => handleCopySelect(copy)}
              className="w-full p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-3"
            >
              <Icon size={24} className="text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{copy.title}</p>
                <p className="text-sm text-muted-foreground">
                  {copy.sessions.length} {copy.sessions.length === 1 ? 'sessão' : 'sessões'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </ScrollArea>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {step === 'select-source' ? 'Importar Conteúdo' : 'Selecionar Conteúdo'}
          </DialogTitle>
        </DialogHeader>

        {step === 'select-source' ? (
          <Tabs defaultValue="drive" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="drive">
                <Folder className="h-4 w-4 mr-2" />
                Drive
              </TabsTrigger>
              <TabsTrigger value="templates">
                <Package className="h-4 w-4 mr-2" />
                Modelos
              </TabsTrigger>
            </TabsList>
            <TabsContent value="drive" className="mt-4">
              <CopyList items={copies} icon={FileText} />
            </TabsContent>
            <TabsContent value="templates" className="mt-4">
              <CopyList items={templates} icon={Package} />
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">{selectedCopy?.title}</h3>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Selecionar tudo
              </Button>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {selectedCopy?.sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Checkbox
                        checked={selection[session.id]?.selected || false}
                        onCheckedChange={() => toggleSession(session.id)}
                      />
                      <h4 className="font-semibold text-lg">{session.title}</h4>
                    </div>
                    <div className="space-y-2 pl-6">
                      {session.blocks.map((block) => (
                        <div key={block.id} className="flex items-start gap-2">
                          <Checkbox
                            checked={selection[session.id]?.blocks[block.id] || false}
                            onCheckedChange={() => toggleBlock(session.id, block.id)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium capitalize">{block.type}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {Array.isArray(block.content)
                                ? block.content.join(', ')
                                : block.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <Button onClick={handleImport}>Importar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
