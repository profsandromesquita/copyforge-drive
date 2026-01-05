import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Session, Block, CopyType, Variation } from '@/types/copy-editor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SelectedItem {
  id: string;
  type: 'session' | 'block';
  sessionId?: string;
}

const DEFAULT_VARIATION_ID = 'default-variation';
const DEFAULT_VARIATION_NAME = 'Variação Principal';

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
  lastAddedBlockId: string | null;
  
  // Variation state and functions
  activeVariationId: string | null;
  variations: Variation[];
  setActiveVariationId: (id: string) => void;
  addVariation: (name?: string) => void;
  renameVariation: (variationId: string, name: string) => void;
  deleteVariation: (variationId: string) => void;
  duplicateVariation: (variationId: string) => void;
  toggleVariationCollapse: (variationId: string) => void;
  
  setCopyId: (id: string) => void;
  setCopyTitle: (title: string) => void;
  addSession: (variationId?: string) => void;
  addSessionAndGetId: (variationId?: string) => string;
  removeSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  duplicateSession: (sessionId: string) => void;
  reorderSessions: (startIndex: number, endIndex: number) => void;
  importSessions: (sessions: Session[], variationId?: string) => void;
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
  clearLastAddedBlock: () => void;
  
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
  const [lastAddedBlockId, setLastAddedBlockId] = useState<string | null>(null);
  const [activeVariationId, setActiveVariationId] = useState<string | null>(DEFAULT_VARIATION_ID);
  const { toast } = useToast();

  // Compute variations from sessions (grouped by variationId)
  const variations = useMemo<Variation[]>(() => {
    const variationMap = new Map<string, { name: string; sessions: Session[]; isCollapsed: boolean }>();
    
    sessions.forEach((session, index) => {
      const varId = session.variationId || DEFAULT_VARIATION_ID;
      
      if (!variationMap.has(varId)) {
        variationMap.set(varId, {
          name: session.variationName || (varId === DEFAULT_VARIATION_ID ? DEFAULT_VARIATION_NAME : `Variação ${variationMap.size + 1}`),
          sessions: [],
          isCollapsed: session.isVariationCollapsed || false,
        });
      }
      variationMap.get(varId)!.sessions.push(session);
    });
    
    // Ensure at least one variation exists
    if (variationMap.size === 0) {
      variationMap.set(DEFAULT_VARIATION_ID, {
        name: DEFAULT_VARIATION_NAME,
        sessions: [],
        isCollapsed: false,
      });
    }
    
    return Array.from(variationMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      sessions: data.sessions,
      isCollapsed: data.isCollapsed,
    }));
  }, [sessions]);

  // Auto-save every 3 seconds
  useEffect(() => {
    if (!copyId || sessions.length === 0) return;
    
    const timer = setTimeout(() => {
      saveCopy();
    }, 3000);

    return () => clearTimeout(timer);
  }, [sessions, copyTitle, copyId]);

  // Migrate existing sessions without variationId to default variation
  const migrateSessionsToVariations = useCallback((rawSessions: Session[]): Session[] => {
    if (!rawSessions || rawSessions.length === 0) return [];
    
    // Check if any session already has variationId
    const hasVariations = rawSessions.some(s => s.variationId);
    if (hasVariations) return rawSessions;
    
    // Migrate all sessions to default variation
    return rawSessions.map((session, index) => ({
      ...session,
      variationId: DEFAULT_VARIATION_ID,
      variationName: index === 0 ? DEFAULT_VARIATION_NAME : undefined,
    }));
  }, []);

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
      
      // Migrate sessions if needed
      const migratedSessions = migrateSessionsToVariations((data.sessions as any) || []);
      setSessions(migratedSessions);
      
      // Set active variation to the first one
      if (migratedSessions.length > 0) {
        setActiveVariationId(migratedSessions[0].variationId || DEFAULT_VARIATION_ID);
      }
      
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
  }, [toast, migrateSessionsToVariations]);

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

  // ============================================================================
  // VARIATION FUNCTIONS
  // ============================================================================

  const addVariation = useCallback((name?: string) => {
    const newVariationId = `variation-${Date.now()}`;
    const variationCount = variations.length;
    const variationName = name || `Variação ${variationCount + 1}`;
    
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: `Sessão 1`,
      blocks: [],
      variationId: newVariationId,
      variationName: variationName,
    };
    
    setSessions(prev => [...prev, newSession]);
    setActiveVariationId(newVariationId);
    
    toast({
      title: 'Variação criada',
      description: `"${variationName}" foi adicionada.`,
    });
  }, [variations.length, toast]);

  const renameVariation = useCallback((variationId: string, name: string) => {
    setSessions(prev => prev.map((session, index) => {
      if (session.variationId === variationId) {
        // Find if this is the first session of this variation
        const isFirstOfVariation = prev.findIndex(s => s.variationId === variationId) === index;
        if (isFirstOfVariation) {
          return { ...session, variationName: name };
        }
      }
      return session;
    }));
  }, []);

  const deleteVariation = useCallback((variationId: string) => {
    // Don't delete the last variation
    if (variations.length <= 1) {
      toast({
        title: 'Não é possível excluir',
        description: 'Você precisa manter pelo menos uma variação.',
        variant: 'destructive',
      });
      return;
    }
    
    const variationToDelete = variations.find(v => v.id === variationId);
    setSessions(prev => prev.filter(s => s.variationId !== variationId));
    
    // Set active to first remaining variation
    if (activeVariationId === variationId) {
      const remainingVariation = variations.find(v => v.id !== variationId);
      if (remainingVariation) {
        setActiveVariationId(remainingVariation.id);
      }
    }
    
    toast({
      title: 'Variação excluída',
      description: `"${variationToDelete?.name}" foi removida.`,
    });
  }, [variations, activeVariationId, toast]);

  const duplicateVariation = useCallback((variationId: string) => {
    const variationToDuplicate = variations.find(v => v.id === variationId);
    if (!variationToDuplicate) return;
    
    const newVariationId = `variation-${Date.now()}`;
    const newVariationName = `${variationToDuplicate.name} (Cópia)`;
    
    const duplicatedSessions = variationToDuplicate.sessions.map((session, index) => ({
      ...session,
      id: `session-${Date.now()}-${index}-${Math.random()}`,
      variationId: newVariationId,
      variationName: index === 0 ? newVariationName : undefined,
      blocks: session.blocks.map(block => ({
        ...block,
        id: `block-${Date.now()}-${Math.random()}`,
      })),
    }));
    
    setSessions(prev => [...prev, ...duplicatedSessions]);
    setActiveVariationId(newVariationId);
    
    toast({
      title: 'Variação duplicada',
      description: `"${newVariationName}" foi criada.`,
    });
  }, [variations, toast]);

  const toggleVariationCollapse = useCallback((variationId: string) => {
    setSessions(prev => prev.map((session, index) => {
      if (session.variationId === variationId) {
        const isFirstOfVariation = prev.findIndex(s => s.variationId === variationId) === index;
        if (isFirstOfVariation) {
          return { ...session, isVariationCollapsed: !session.isVariationCollapsed };
        }
      }
      return session;
    }));
  }, []);

  // ============================================================================
  // SESSION FUNCTIONS (updated to support variations)
  // ============================================================================

  const addSession = useCallback((variationId?: string) => {
    const targetVariationId = variationId || activeVariationId || DEFAULT_VARIATION_ID;
    const targetVariation = variations.find(v => v.id === targetVariationId);
    const sessionCount = targetVariation?.sessions.length || 0;
    
    const newSession: Session = {
      id: `session-${Date.now()}`,
      title: `Sessão ${sessionCount + 1}`,
      blocks: [],
      variationId: targetVariationId,
    };
    
    // Insert after last session of this variation
    setSessions(prev => {
      const lastIndexOfVariation = prev.reduce((lastIdx, s, idx) => 
        s.variationId === targetVariationId ? idx : lastIdx, -1);
      
      if (lastIndexOfVariation === -1) {
        return [...prev, newSession];
      }
      
      const result = [...prev];
      result.splice(lastIndexOfVariation + 1, 0, newSession);
      return result;
    });
  }, [activeVariationId, variations]);

  const addSessionAndGetId = useCallback((variationId?: string) => {
    const targetVariationId = variationId || activeVariationId || DEFAULT_VARIATION_ID;
    const targetVariation = variations.find(v => v.id === targetVariationId);
    const sessionCount = targetVariation?.sessions.length || 0;
    const newSessionId = `session-${Date.now()}`;
    
    const newSession: Session = {
      id: newSessionId,
      title: `Sessão ${sessionCount + 1}`,
      blocks: [],
      variationId: targetVariationId,
    };
    
    setSessions(prev => {
      const lastIndexOfVariation = prev.reduce((lastIdx, s, idx) => 
        s.variationId === targetVariationId ? idx : lastIdx, -1);
      
      if (lastIndexOfVariation === -1) {
        return [...prev, newSession];
      }
      
      const result = [...prev];
      result.splice(lastIndexOfVariation + 1, 0, newSession);
      return result;
    });
    
    return newSessionId;
  }, [activeVariationId, variations]);

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

  const importSessions = useCallback((importedSessions: Session[], variationId?: string) => {
    const targetVariationId = variationId || activeVariationId || DEFAULT_VARIATION_ID;
    
    // Regenerar IDs únicos para sessões e blocos importados
    let blockCounter = 0;
    let firstBlockId: string | null = null;
    const sessionsWithNewIds = importedSessions.map((session, sessionIndex) => ({
      ...session,
      id: `session-${Date.now()}-${sessionIndex}-${Math.random()}`,
      variationId: targetVariationId,
      variationName: undefined, // Don't override the variation name
      blocks: session.blocks.map((block) => {
        blockCounter++;
        const newBlockId = `block-${Date.now()}-${blockCounter}-${Math.random()}`;
        if (!firstBlockId) firstBlockId = newBlockId;
        return {
          ...block,
          id: newBlockId,
          config: block.config || {} // Garantir que config sempre existe
        };
      })
    }));
    
    // Insert after last session of this variation
    setSessions(prev => {
      const lastIndexOfVariation = prev.reduce((lastIdx, s, idx) => 
        s.variationId === targetVariationId ? idx : lastIdx, -1);
      
      if (lastIndexOfVariation === -1) {
        return [...prev, ...sessionsWithNewIds];
      }
      
      const result = [...prev];
      result.splice(lastIndexOfVariation + 1, 0, ...sessionsWithNewIds);
      return result;
    });
    
    if (firstBlockId) setLastAddedBlockId(firstBlockId);
  }, [activeVariationId]);

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
      let firstBlockId: string | null = null;
      const allNewBlocks = importedSessions.flatMap(s => 
        s.blocks.map(block => {
          const newBlockId = `block-${Date.now()}-${Math.random()}`;
          if (!firstBlockId) firstBlockId = newBlockId;
          return {
            ...block,
            id: newBlockId,
            config: { ...block.config, isNewFromChat: true }
          };
        })
      );
      
      const updatedBlocks = [...session.blocks];
      updatedBlocks.splice(blockIndex + 1, 0, ...allNewBlocks);
      
      const newSessions = [...sessions];
      newSessions[sessionIndex] = { ...session, blocks: updatedBlocks };
      setSessions(newSessions);
      if (firstBlockId) setLastAddedBlockId(firstBlockId);
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
      let firstBlockId: string | null = null;
      const sessionsWithNewIds = importedSessions.map((session, idx) => ({
        ...session,
        id: `session-${Date.now()}-${idx}-${Math.random()}`,
        blocks: session.blocks.map((block) => {
          blockCounter++;
          const newBlockId = `block-${Date.now()}-${blockCounter}-${Math.random()}`;
          if (!firstBlockId) firstBlockId = newBlockId;
          return {
            ...block,
            id: newBlockId,
            config: block.config || {}
          };
        })
      }));

      const newSessions = [...sessions];
      newSessions.splice(sessionIndex + 1, 0, ...sessionsWithNewIds);
      setSessions(newSessions);
      if (firstBlockId) setLastAddedBlockId(firstBlockId);
    } else {
      importSessions(importedSessions);
    }
  }, [sessions, importSessions]);

  const addBlock = useCallback((sessionId: string, block: Omit<Block, 'id'>, index?: number) => {
    const newBlockId = `block-${Date.now()}-${Math.random()}`;
    const newBlock: Block = {
      ...block,
      id: newBlockId,
    };

    // Usar callback pattern (prev => ...) para evitar race condition
    // quando addBlock é chamado logo após addSessionAndGetId
    setSessions(prev => prev.map(session => {
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
    
    setLastAddedBlockId(newBlockId);
  }, []); // Sem dependência de sessions - usa prev

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
    setSessions(prev => prev.map(session => ({
      ...session,
      blocks: session.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b),
    })));
  }, []);

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

  const clearLastAddedBlock = useCallback(() => {
    setLastAddedBlockId(null);
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
    lastAddedBlockId,
    // Variation state and functions
    activeVariationId,
    variations,
    setActiveVariationId,
    addVariation,
    renameVariation,
    deleteVariation,
    duplicateVariation,
    toggleVariationCollapse,
    // Session functions
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
    clearLastAddedBlock,
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
