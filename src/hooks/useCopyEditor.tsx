import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Session, Block, CopyType } from '@/types/copy-editor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SelectedItem {
  id: string;
  type: 'session' | 'block';
  sessionId?: string;
}

interface CopyEditorContextType {
  copyId: string | null;
  copyTitle: string;
  copyType: CopyType | undefined;
  sessions: Session[];
  selectedBlockId: string | null;
  isSaving: boolean;
  isLoading: boolean;
  status: 'draft' | 'published';
  selectedItems: SelectedItem[];
  isSelectionMode: boolean;
  
  setCopyId: (id: string) => void;
  setCopyTitle: (title: string) => void;
  addSession: () => void;
  addSessionAndGetId: () => string;
  removeSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  duplicateSession: (sessionId: string) => void;
  reorderSessions: (startIndex: number, endIndex: number) => void;
  importSessions: (sessions: Session[]) => void;
  insertSessionsAfterSelection: (sessions: Session[], selectedItems: SelectedItem[]) => void;
  
  addBlock: (sessionId: string, block: Omit<Block, 'id'>, index?: number) => void;
  removeBlock: (blockId: string) => void;
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  duplicateBlock: (blockId: string) => void;
  moveBlock: (blockId: string, toSessionId: string, toIndex: number) => void;
  selectBlock: (blockId: string | null) => void;
  
  toggleSelectionMode: () => void;
  toggleItemSelection: (id: string, type: 'session' | 'block', sessionId?: string) => void;
  clearSelection: () => void;
  
  updateStatus: (newStatus: 'draft' | 'published') => Promise<void>;
  saveCopy: () => Promise<void>;
  loadCopy: (id: string) => Promise<void>;
}

const CopyEditorContext = createContext<CopyEditorContextType | undefined>(undefined);

export const CopyEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [copyId, setCopyId] = useState<string | null>(null);
  const [copyTitle, setCopyTitle] = useState('Nova Copy');
  const [copyType, setCopyType] = useState<CopyType | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const { toast } = useToast();

  // Auto-save every 3 seconds
  useEffect(() => {
    if (!copyId || sessions.length === 0) return;
    
    const timer = setTimeout(() => {
      saveCopy();
    }, 3000);

    return () => clearTimeout(timer);
  }, [sessions, copyTitle, copyId]);

  const loadCopy = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      // Criar uma promise de timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar copy')), 10000);
      });

      // Query com timeout de 10 segundos
      const queryPromise = supabase
        .from('copies')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      if (error) throw error;

      setCopyId(data.id);
      setCopyTitle(data.title);
      setCopyType(data.copy_type as CopyType);
      setSessions((data.sessions as any) || []);
      setStatus((data.status as 'draft' | 'published') || 'draft');
      
      // Pequeno delay para garantir renderização suave
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error: any) {
      console.error('Error loading copy:', error);
      const isTimeout = error?.message?.includes('Timeout');
      toast({
        title: isTimeout ? 'Tempo esgotado' : 'Erro ao carregar',
        description: isTimeout 
          ? 'O servidor demorou muito para responder. Tente novamente em alguns instantes.' 
          : 'Não foi possível carregar a copy.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const saveCopy = useCallback(async () => {
    if (!copyId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('copies')
        .update({
          title: copyTitle,
          sessions: sessions as any,
          status,
        })
        .eq('id', copyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving copy:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a copy.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [copyId, copyTitle, sessions, status, toast]);

  const addSession = useCallback(() => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: `Sessão ${sessions.length + 1}`,
      blocks: [],
    };
    setSessions([...sessions, newSession]);
  }, [sessions]);

  const addSessionAndGetId = useCallback(() => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: Session = {
      id: newSessionId,
      title: `Sessão ${sessions.length + 1}`,
      blocks: [],
    };
    setSessions(prev => [...prev, newSession]);
    return newSessionId;
  }, [sessions.length]);

  const removeSession = useCallback((sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
  }, [sessions]);

  const updateSession = useCallback((sessionId: string, updates: Partial<Session>) => {
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s));
  }, [sessions]);

  const duplicateSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const newSession: Session = {
      ...session,
      id: `session-${Date.now()}`,
      title: `${session.title} (Cópia)`,
      blocks: session.blocks.map(block => ({
        ...block,
        id: `block-${Date.now()}-${Math.random()}`,
      })),
    };
    setSessions([...sessions, newSession]);
  }, [sessions]);

  const reorderSessions = useCallback((startIndex: number, endIndex: number) => {
    const result = Array.from(sessions);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setSessions(result);
  }, [sessions]);

  const importSessions = useCallback((importedSessions: Session[]) => {
    // Regenerar IDs únicos para sessões e blocos importados
    let blockCounter = 0;
    const sessionsWithNewIds = importedSessions.map((session, sessionIndex) => ({
      ...session,
      id: `session-${Date.now()}-${sessionIndex}-${Math.random()}`,
      blocks: session.blocks.map((block) => {
        blockCounter++;
        return {
          ...block,
          id: `block-${Date.now()}-${blockCounter}-${Math.random()}`,
          config: block.config || {} // Garantir que config sempre existe
        };
      })
    }));
    
    setSessions([...sessions, ...sessionsWithNewIds]);
  }, [sessions]);

  const insertSessionsAfterSelection = useCallback((importedSessions: Session[], selectedItems: SelectedItem[]) => {
    const lastSelected = selectedItems[selectedItems.length - 1];
    
    if (!lastSelected) {
      importSessions(importedSessions);
      return;
    }

    // CASO 1: Bloco selecionado → inserir blocos DENTRO da mesma sessão
    if (lastSelected.type === 'block' && lastSelected.sessionId) {
      const sessionIndex = sessions.findIndex(s => s.id === lastSelected.sessionId);
      if (sessionIndex === -1) {
        importSessions(importedSessions);
        return;
      }
      
      const session = sessions[sessionIndex];
      const blockIndex = session.blocks.findIndex(b => b.id === lastSelected.id);
      
      // Extrair todos os blocos das sessões importadas e marcar como novos
      const allNewBlocks = importedSessions.flatMap(s => 
        s.blocks.map(block => ({
          ...block,
          id: `block-${Date.now()}-${Math.random()}`,
          config: { ...block.config, isNewFromChat: true }
        }))
      );
      
      const updatedBlocks = [...session.blocks];
      updatedBlocks.splice(blockIndex + 1, 0, ...allNewBlocks);
      
      const newSessions = [...sessions];
      newSessions[sessionIndex] = { ...session, blocks: updatedBlocks };
      setSessions(newSessions);
      return;
    }

    // CASO 2: Sessão selecionada → inserir sessões após (comportamento existente)
    if (lastSelected.type === 'session') {
      const sessionIndex = sessions.findIndex(s => s.id === lastSelected.id);
      
      if (sessionIndex === -1) {
        importSessions(importedSessions);
        return;
      }

      // Regenerar IDs únicos para sessões e blocos importados
      let blockCounter = 0;
      const sessionsWithNewIds = importedSessions.map((session, idx) => ({
        ...session,
        id: `session-${Date.now()}-${idx}-${Math.random()}`,
        blocks: session.blocks.map((block) => {
          blockCounter++;
          return {
            ...block,
            id: `block-${Date.now()}-${blockCounter}-${Math.random()}`,
            config: block.config || {}
          };
        })
      }));

      const newSessions = [...sessions];
      newSessions.splice(sessionIndex + 1, 0, ...sessionsWithNewIds);
      setSessions(newSessions);
    } else {
      importSessions(importedSessions);
    }
  }, [sessions, importSessions]);

  const addBlock = useCallback((sessionId: string, block: Omit<Block, 'id'>, index?: number) => {
    const newBlock: Block = {
      ...block,
      id: `block-${Date.now()}-${Math.random()}`,
    };

    setSessions(sessions.map(session => {
      if (session.id === sessionId) {
        const newBlocks = [...session.blocks];
        // If index is provided, insert at that position, otherwise add at end
        if (index !== undefined && index >= 0) {
          newBlocks.splice(index, 0, newBlock);
        } else {
          newBlocks.push(newBlock);
        }
        return { ...session, blocks: newBlocks };
      }
      return session;
    }));
  }, [sessions]);

  const removeBlock = useCallback((blockId: string) => {
    setSessions(sessions.map(session => ({
      ...session,
      blocks: session.blocks.filter(b => b.id !== blockId),
    })));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [sessions, selectedBlockId]);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    setSessions(sessions.map(session => ({
      ...session,
      blocks: session.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b),
    })));
  }, [sessions]);

  const duplicateBlock = useCallback((blockId: string) => {
    setSessions(sessions.map(session => {
      const blockIndex = session.blocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return session;

      const block = session.blocks[blockIndex];
      const newBlock: Block = {
        ...block,
        id: `block-${Date.now()}`,
      };

      const newBlocks = [...session.blocks];
      newBlocks.splice(blockIndex + 1, 0, newBlock);

      return { ...session, blocks: newBlocks };
    }));
  }, [sessions]);

  const moveBlock = useCallback((blockId: string, toSessionId: string, toIndex: number) => {
    let blockToMove: Block | null = null;

    // Remove block from current session
    const sessionsWithoutBlock = sessions.map(session => ({
      ...session,
      blocks: session.blocks.filter(b => {
        if (b.id === blockId) {
          blockToMove = b;
          return false;
        }
        return true;
      }),
    }));

    if (!blockToMove) return;

    // Add block to new session
    setSessions(sessionsWithoutBlock.map(session => {
      if (session.id === toSessionId) {
        const newBlocks = [...session.blocks];
        newBlocks.splice(toIndex, 0, blockToMove!);
        return { ...session, blocks: newBlocks };
      }
      return session;
    }));
  }, [sessions]);

  const selectBlock = useCallback((blockId: string | null) => {
    setSelectedBlockId(blockId);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    setSelectedItems([]);
  }, []);

  const toggleItemSelection = useCallback((id: string, type: 'session' | 'block', sessionId?: string) => {
    setSelectedItems(prev => {
      const exists = prev.some(item => item.id === id);
      if (exists) {
        return prev.filter(item => item.id !== id);
      } else {
        return [...prev, { id, type, sessionId }];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    setIsSelectionMode(false);
  }, []);

  const updateStatus = useCallback(async (newStatus: 'draft' | 'published') => {
    if (!copyId) return;

    try {
      const { error } = await supabase
        .from('copies')
        .update({ status: newStatus })
        .eq('id', copyId);

      if (error) throw error;

      setStatus(newStatus);
      toast({
        title: newStatus === 'published' ? 'Copy publicada!' : 'Salvo como rascunho!',
        description: newStatus === 'published' 
          ? 'Sua copy está agora publicada.' 
          : 'Sua copy foi salva como rascunho.',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    }
  }, [copyId, toast]);

  const value: CopyEditorContextType = {
    copyId,
    copyTitle,
    copyType,
    sessions,
    selectedBlockId,
    isSaving,
    isLoading,
    status,
    selectedItems,
    isSelectionMode,
    setCopyId,
    setCopyTitle,
    addSession,
    addSessionAndGetId,
    removeSession,
    updateSession,
    duplicateSession,
    reorderSessions,
    importSessions,
    insertSessionsAfterSelection,
    addBlock,
    removeBlock,
    updateBlock,
    duplicateBlock,
    moveBlock,
    selectBlock,
    toggleSelectionMode,
    toggleItemSelection,
    clearSelection,
    updateStatus,
    saveCopy,
    loadCopy,
  };

  return (
    <CopyEditorContext.Provider value={value}>
      {children}
    </CopyEditorContext.Provider>
  );
};

export const useCopyEditor = () => {
  const context = useContext(CopyEditorContext);
  if (!context) {
    throw new Error('useCopyEditor must be used within CopyEditorProvider');
  }
  return context;
};
