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
import { Folder, FileText, Package, CaretRight, House } from 'phosphor-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DriveFolder {
  id: string;
  name: string;
  parent_id: string | null;
}

interface Copy {
  id: string;
  title: string;
  sessions: Session[];
  is_template?: boolean;
  folder_id?: string | null;
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
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveFolder[]>([]);
  const [selectedCopy, setSelectedCopy] = useState<Copy | null>(null);
  const [selection, setSelection] = useState<SelectionState>({});
  const [loading, setLoading] = useState(false);
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProject();

  useEffect(() => {
    if (open) {
      setCurrentFolderId(null);
      setBreadcrumbs([]);
      fetchFolders(null);
      fetchCopies(null);
      fetchTemplates();
    }
  }, [open, activeWorkspace?.id, activeProject?.id]);

  const fetchFolders = async (folderId: string | null) => {
    if (!activeWorkspace?.id) return;

    try {
      const query = supabase
        .from('folders')
        .select('id, name, parent_id')
        .eq('workspace_id', activeWorkspace.id)
        .order('name');

      if (folderId) {
        query.eq('parent_id', folderId);
      } else {
        query.is('parent_id', null);
      }

      if (activeProject?.id) {
        query.eq('project_id', activeProject.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchCopies = async (folderId: string | null = null) => {
    if (!activeWorkspace?.id) return;

    setLoading(true);
    try {
      const query = supabase
        .from('copies')
        .select('id, title, sessions, folder_id')
        .eq('workspace_id', activeWorkspace.id)
        .eq('is_template', false)
        .order('updated_at', { ascending: false });

      if (folderId) {
        query.eq('folder_id', folderId);
      } else {
        query.is('folder_id', null);
      }

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
    setCurrentFolderId(null);
    setBreadcrumbs([]);
    onOpenChange(false);
  };

  const handleBack = () => {
    setStep('select-source');
    setSelectedCopy(null);
    setSelection({});
  };

  const navigateToFolder = async (folderId: string | null) => {
    setCurrentFolderId(folderId);
    await fetchFolders(folderId);
    await fetchCopies(folderId);
    
    if (folderId) {
      const { data } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .single();
      
      if (data) {
        await buildBreadcrumbs(data);
      }
    } else {
      setBreadcrumbs([]);
    }
  };

  const buildBreadcrumbs = async (folder: DriveFolder) => {
    const crumbs: DriveFolder[] = [folder];
    let currentParentId = folder.parent_id;

    while (currentParentId) {
      const { data } = await supabase
        .from('folders')
        .select('*')
        .eq('id', currentParentId)
        .single();

      if (data) {
        crumbs.unshift(data);
        currentParentId = data.parent_id;
      } else {
        break;
      }
    }

    setBreadcrumbs(crumbs);
  };

  const DriveContent = () => (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b">
          <button
            onClick={() => navigateToFolder(null)}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <House size={16} />
            <span>Drive</span>
          </button>
          {breadcrumbs.map((crumb) => (
            <div key={crumb.id} className="flex items-center gap-2">
              <CaretRight size={14} />
              <button
                onClick={() => navigateToFolder(crumb.id)}
                className="hover:text-foreground transition-colors"
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>
      )}

      <ScrollArea className="h-[420px]">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {/* Folders Section */}
            {folders.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Pastas
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => navigateToFolder(folder.id)}
                      className="p-3 rounded-lg border border-muted hover:border-primary/60 hover:bg-accent/50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <Folder size={18} className="text-primary shrink-0" />
                        <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {folder.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Copies Section */}
            {copies.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Copies
                </h3>
                <div className="grid gap-2">
                  {copies.map((copy) => (
                    <Card
                      key={copy.id}
                      className="border-muted hover:border-primary/60 hover:shadow-sm transition-all cursor-pointer group"
                      onClick={() => handleCopySelect(copy)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {copy.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {copy.sessions.length} {copy.sessions.length === 1 ? 'sessão' : 'sessões'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {folders.length === 0 && copies.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">Nenhum item encontrado</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
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
              <DriveContent />
            </TabsContent>
            <TabsContent value="templates" className="mt-4">
              <ScrollArea className="h-[420px]">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">Nenhum modelo encontrado</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className="border-muted hover:border-primary/60 hover:shadow-sm transition-all cursor-pointer group"
                        onClick={() => handleCopySelect(template)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <Package size={18} className="text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                {template.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {template.sessions.length} {template.sessions.length === 1 ? 'sessão' : 'sessões'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
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
            
            <ScrollArea className="h-[420px] pr-4">
              <div className="space-y-4">
                {selectedCopy?.sessions.map((session) => (
                  <Card key={session.id} className="border-muted">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox
                          checked={selection[session.id]?.selected || false}
                          onCheckedChange={() => toggleSession(session.id)}
                        />
                        <h4 className="font-semibold text-sm">{session.title}</h4>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {session.blocks.length}
                        </Badge>
                      </div>
                      <div className="space-y-2 pl-6">
                        {session.blocks.map((block) => (
                          <div key={block.id} className="flex items-start gap-2 group">
                            <Checkbox
                              checked={selection[session.id]?.blocks[block.id] || false}
                              onCheckedChange={() => toggleBlock(session.id, block.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium capitalize text-muted-foreground">
                                {block.type}
                              </p>
                              <p className="text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                {Array.isArray(block.content)
                                  ? block.content.join(', ')
                                  : block.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
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
