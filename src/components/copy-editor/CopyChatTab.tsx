import { useState, useRef, useEffect, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Send, Trash2, Loader2, Check, X, MousePointer, History, Layers, Square, Hash, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VariableInput } from './VariableInput';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { HistorySheet } from './HistorySheet';
import { AIMessageWithActions } from './AIMessageWithActions';
import { ChatGeneratedPreviewModal } from './ChatGeneratedPreviewModal';
import { markdownToHtml } from '@/lib/markdown-utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Microphone, MicrophoneSlash } from 'phosphor-react';
import { toast as sonnerToast } from 'sonner';

interface ChatResponse {
  success: boolean;
  message: string;
  tokens?: any;
  intent?: 'replace' | 'insert' | 'conversational' | 'default';
  actionable?: boolean;
}
import { 
  extractVariables, 
  validateVariables, 
  getAllVariables, 
  isValidVariable,
  CONTEXT_VARIABLES,
  VARIABLE_EXAMPLES 
} from '@/lib/context-variables';
import type { Session, Block } from '@/types/copy-editor';
import type { ParsedContent } from '@/lib/ai-content-parser';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  metadata?: {
    intent?: 'replace' | 'insert' | 'conversational' | 'default';
  };
}

interface CopyChatTabProps {
  isActive?: boolean;
  contextSettings?: {
    audienceSegmentId: string;
    offerId: string;
    methodologyId: string;
  };
}

export function CopyChatTab({ isActive = true, contextSettings }: CopyChatTabProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [showVariablesHelp, setShowVariablesHelp] = useState(false);
  const [showVariableSuggestions, setShowVariableSuggestions] = useState(false);
  const [variableSearch, setVariableSearch] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { activeWorkspace } = useWorkspace();
  const { 
    copyId, 
    sessions, 
    isSelectionMode, 
    selectedItems, 
    toggleSelectionMode, 
    toggleItemSelection, 
    clearSelection,
    importSessions,
    insertSessionsAfterSelection,
    addSession,
    addBlock,
    updateBlock,
    updateSession
  } = useCopyEditor();
  const queryClient = useQueryClient();

  // Buscar histórico de mensagens
  const { data: chatHistory = [], isLoading: loadingChatHistory } = useQuery({
    queryKey: ['copy-chat-history', copyId],
    queryFn: async () => {
      if (!copyId) return [];

      const { data, error } = await supabase
        .from('copy_chat_messages')
        .select('*')
        .eq('copy_id', copyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!copyId,
  });

  // Buscar histórico de gerações de IA
  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['ai-generation-history', copyId],
    queryFn: async () => {
      if (!copyId) return [];

      const { data, error } = await supabase
        .from('ai_generation_history')
        .select('*')
        .eq('copy_id', copyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!copyId,
  });

  // Função para rolar até o final
  const scrollToBottom = () => {
    if (!scrollRef.current) return;
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);
  };

  // Auto-scroll quando o histórico muda (nova mensagem ou resposta)
  useEffect(() => {
    if (chatHistory.length > 0) {
      scrollToBottom();
    }
  }, [chatHistory]);

  // Auto-scroll quando a aba Chat fica ativa
  useEffect(() => {
    if (isActive && chatHistory.length > 0) {
      scrollToBottom();
    }
  }, [isActive, chatHistory.length]);

  // Enviar mensagem
  const sendMessageMutation = useMutation<ChatResponse, Error, string>({
    mutationFn: async (userMessage: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada');

      const { data, error } = await supabase.functions.invoke('copy-chat', {
        body: {
          copyId,
          message: userMessage,
          hasSelection: selectedItems.length > 0, // 🆕 NOVO: enviar hasSelection
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: ChatResponse) => {
      // 🆕 NOVO COMPORTAMENTO: Apenas invalidar query para atualizar o chat
      // A aplicação da mudança acontece EXCLUSIVAMENTE via modal/card
      queryClient.invalidateQueries({ queryKey: ['copy-chat-history', copyId] });
      setMessage('');
    },
    onError: (error: any) => {
      console.error('Erro ao enviar mensagem:', error);
      
      if (error.message?.includes('insufficient_credits') || error.status === 402) {
        toast({
          title: 'Créditos insuficientes',
          description: 'Adicione créditos para continuar usando o chat IA.',
          variant: 'destructive',
        });
      } else if (error.message?.includes('rate_limit') || error.status === 429) {
        toast({
          title: 'Limite de requisições atingido',
          description: 'Aguarde alguns segundos antes de tentar novamente.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao enviar mensagem',
          description: 'Tente novamente em alguns instantes.',
          variant: 'destructive',
        });
      }
    },
  });

  // Limpar histórico
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('copy_chat_messages')
        .delete()
        .eq('copy_id', copyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['copy-chat-history', copyId] });
      setShowClearConfirm(false);
    },
    onError: () => {
      toast({
        title: 'Erro ao limpar histórico',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !copyId) return;

    // Validar variáveis antes de enviar
    const { valid, invalid } = validateVariables(trimmedMessage);
    if (!valid) {
      toast({
        title: 'Variáveis inválidas detectadas',
        description: `As seguintes variáveis não existem: ${invalid.map(v => '#' + v).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    // Construir contexto dos items selecionados
    let selectionContext = '';
    if (selectedItems.length > 0) {
      selectionContext = '\n\n**CONTEXTO DOS ELEMENTOS SELECIONADOS:**\n';
      
      selectedItems.forEach((item, index) => {
        if (item.type === 'session') {
          const session = sessions.find(s => s.id === item.id);
          if (session) {
            selectionContext += `\n${index + 1}. **Sessão:** ${session.title}\n`;
            selectionContext += `   Blocos: ${session.blocks.length}\n`;
            session.blocks.forEach((block, bIndex) => {
              const content = typeof block.content === 'string' 
                ? block.content.replace(/<[^>]*>/g, '').substring(0, 100) 
                : JSON.stringify(block.content).substring(0, 100);
              selectionContext += `   - Bloco ${bIndex + 1} (${block.type}): ${content}...\n`;
            });
          }
        } else if (item.type === 'block') {
          const session = sessions.find(s => s.id === item.sessionId);
          const block = session?.blocks.find(b => b.id === item.id);
          if (block && session) {
            const content = typeof block.content === 'string' 
              ? block.content.replace(/<[^>]*>/g, '') 
              : JSON.stringify(block.content);
            selectionContext += `\n${index + 1}. **Bloco (${block.type})** da sessão "${session.title}":\n`;
            selectionContext += `   Conteúdo: ${content}\n`;
            if (block.config) {
              selectionContext += `   Configuração: ${JSON.stringify(block.config)}\n`;
            }
          }
        }
      });
    }

    const fullMessage = trimmedMessage + selectionContext;

    setIsLoading(true);
    try {
      await sendMessageMutation.mutateAsync(fullMessage);
      setMessage('');
      // Não limpar a seleção aqui - ela será limpa após aplicar a ação (substituir/adicionar)
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistoryItemClick = (item: any) => {
    // Importar sessões geradas
    importSessions(item.sessions);
    setShowHistory(false);
    toast({
      title: 'Copy importada',
      description: 'As sessões foram importadas com sucesso.',
    });
  };

  // Mapear tipo parseado para tipo de bloco
  const mapParsedTypeToBlockType = (parsedType: ParsedContent['type']): Block['type'] => {
    const mapping: Record<ParsedContent['type'], Block['type']> = {
      'headline': 'text',
      'text': 'text',
      'ad': 'text',
      'list': 'list',
      'unknown': 'text',
    };
    return mapping[parsedType] || 'text';
  };

  // Obter configuração padrão por tipo
  const getDefaultConfigForType = (blockType: Block['type']) => {
    if (blockType === 'text') {
      return { fontSize: '16px', fontWeight: 'normal' };
    }
    if (blockType === 'list') {
      return { listStyle: 'bullets' as const };
    }
    return {};
  };

  // Adicionar conteúdo (sessões completas)
  const handleAddContent = useCallback(async (generatedSessions: Session[]) => {
    if (generatedSessions.length === 0) return;

    // Se há seleção, inserir após a seleção usando insertSessionsAfterSelection
    if (selectedItems.length > 0) {
      insertSessionsAfterSelection(generatedSessions, selectedItems);
      
      toast({
        title: 'Conteúdo adicionado!',
        description: `${generatedSessions.length} sessão(ões) inserida(s) após a seleção.`,
      });
      
      clearSelection();
    } else {
      // Sem seleção: adicionar no final usando importSessions
      importSessions(generatedSessions);

      toast({
        title: 'Conteúdo adicionado!',
        description: `${generatedSessions.length} sessão(ões) adicionada(s) à sua copy.`,
      });
    }
  }, [importSessions, insertSessionsAfterSelection, selectedItems, toast, clearSelection]);

  // Inserir conteúdo após o item selecionado (não no final)
  const handleInsertAfterSelection = useCallback(async (generatedSessions: Session[]) => {
    if (generatedSessions.length === 0) return;
    
    // Se há seleção, inserir após o último bloco selecionado
    if (selectedItems.length > 0) {
      const lastSelectedBlock = selectedItems[selectedItems.length - 1];
      
      if (lastSelectedBlock.type === 'block') {
        // Encontrar a sessão do bloco
        const sessionIndex = sessions.findIndex(s => s.id === lastSelectedBlock.sessionId);
        const session = sessions[sessionIndex];
        
        if (session) {
          const blockIndex = session.blocks.findIndex(b => b.id === lastSelectedBlock.id);
          const selectedBlock = session.blocks[blockIndex]; // 🆕 Pegar bloco pai
          
          // 🆕 HERDAR tipo e formatação do bloco pai
          const newBlocks = generatedSessions.flatMap(s => s.blocks).map(generatedBlock => ({
            ...generatedBlock,
            type: selectedBlock.type, // ✅ COPIAR tipo (headline, text, list)
            config: {
              ...generatedBlock.config,
              ...selectedBlock.config, // ✅ COPIAR formatação (fontSize, fontWeight, color, etc)
            }
          }));
          
          const updatedBlocks = [
            ...session.blocks.slice(0, blockIndex + 1),
            ...newBlocks,
            ...session.blocks.slice(blockIndex + 1)
          ];
          
          updateSession(session.id, { blocks: updatedBlocks });
          
          clearSelection();
          
          toast({
            title: `${newBlocks.length} ${newBlocks.length === 1 ? 'bloco inserido' : 'blocos inseridos'}!`,
            description: `Formatação herdada: ${selectedBlock.type}`,
          });
          
          return;
        }
      }
    }
    
    // Fallback: adicionar no final (comportamento padrão)
    importSessions(generatedSessions);
    
    toast({
      title: 'Conteúdo adicionado!',
      description: `${generatedSessions.length} sessão(ões) adicionada(s) ao final.`,
    });
  }, [selectedItems, sessions, updateSession, clearSelection, importSessions, toast]);

  // Substituir conteúdo dos blocos/sessões selecionados
  const handleReplaceContent = useCallback(async (generatedSessions: Session[]) => {
    if (selectedItems.length === 0 || generatedSessions.length === 0) return;

    let replacedCount = 0;

    // Agrupar items selecionados por tipo
    const selectedSessions = selectedItems.filter(item => item.type === 'session');
    const selectedBlocks = selectedItems.filter(item => item.type === 'block');

    // Substituir sessões completas (mapear 1:1 com sessões geradas)
    selectedSessions.forEach((item, idx) => {
      if (generatedSessions[idx]) {
        updateSession(item.id, {
          title: generatedSessions[idx].title,
          blocks: generatedSessions[idx].blocks
        });
        replacedCount++;
      }
    });

    // Substituir blocos individuais (se não há sessões selecionadas)
    if (selectedBlocks.length > 0 && selectedSessions.length === 0) {
      const allGeneratedBlocks = generatedSessions.flatMap(s => s.blocks);

      // Substituição 1:1 - apenas o conteúdo, mantendo tipo e config
      selectedBlocks.forEach((item, idx) => {
        const generatedBlock = allGeneratedBlocks[idx];
        if (!generatedBlock) return;

        // Converter markdown para HTML antes de atualizar
        const content = typeof generatedBlock.content === 'string' 
          ? markdownToHtml(generatedBlock.content)
          : generatedBlock.content;

        // Atualizar APENAS o conteúdo, preservando tipo e formatação original
        updateBlock(item.id, {
          content,
        });

        replacedCount++;
      });
    }

    clearSelection();

    toast({
      title: `${replacedCount} ${replacedCount === 1 ? 'item substituído' : 'itens substituídos'}!`,
      description: 'O conteúdo foi atualizado com sucesso.',
    });
  }, [selectedItems, updateBlock, updateSession, clearSelection, toast]);

  // Substituir todo o conteúdo de todos os selecionados
  const handleReplaceAll = useCallback(async (generatedSessions: Session[]) => {
    if (selectedItems.length === 0 || generatedSessions.length === 0) return;

    let replacedCount = 0;
    const selectedSessions = selectedItems.filter(item => item.type === 'session');
    const selectedBlocks = selectedItems.filter(item => item.type === 'block');

    // Se há sessões selecionadas, substituir com sessões geradas
    if (selectedSessions.length > 0) {
      selectedSessions.forEach((item, idx) => {
        if (generatedSessions[idx]) {
          updateSession(item.id, {
            title: generatedSessions[idx].title,
            blocks: generatedSessions[idx].blocks
          });
          replacedCount += generatedSessions[idx].blocks.length;
        }
      });
    }

    // Se apenas blocos estão selecionados, distribuir blocos gerados
    if (selectedBlocks.length > 0 && selectedSessions.length === 0) {
      const allGeneratedBlocks = generatedSessions.flatMap(s => s.blocks);
      selectedBlocks.forEach((item, idx) => {
        if (allGeneratedBlocks[idx]) {
          updateBlock(item.id, { 
            content: allGeneratedBlocks[idx].content,
            type: allGeneratedBlocks[idx].type,
            config: allGeneratedBlocks[idx].config
          });
          replacedCount++;
        }
      });
    }

    clearSelection();

    toast({
      title: `${replacedCount} ${replacedCount === 1 ? 'item substituído' : 'itens substituídos'}!`,
      description: 'Todo o conteúdo foi atualizado.',
    });
  }, [selectedItems, updateBlock, updateSession, clearSelection, toast]);

  const handleMessageChange = (value: string) => {
    setMessage(value);
  };

  const handleVariableSearch = (search: string, show: boolean) => {
    setVariableSearch(search);
    setShowVariableSuggestions(show);
  };

  const insertVariable = (variable: string) => {
    if (!textareaRef.current) return;
    
    // Encontrar onde começa o #
    const lastHashIndex = message.lastIndexOf('#');
    
    if (lastHashIndex === -1) {
      // Se não há #, apenas adicionar a variável no final
      setMessage(message + variable + ' ');
    } else {
      // Substituir de # até o cursor pela variável
      const textBeforeHash = message.substring(0, lastHashIndex);
      const textAfterCursor = message.substring(message.length);
      const newText = textBeforeHash + variable + ' ' + textAfterCursor;
      setMessage(newText);
    }
    
    setShowVariableSuggestions(false);
    
    // Refocar no input
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showVariableSuggestions) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape' && showVariableSuggestions) {
      setShowVariableSuggestions(false);
    }
  };

  // Filtrar variáveis disponíveis baseado na busca
  const filteredVariables = getAllVariables().filter(v => 
    v.value.toLowerCase().includes('#' + variableSearch.toLowerCase()) ||
    v.label.toLowerCase().includes(variableSearch.toLowerCase())
  );

  // Configurar reconhecimento de voz
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        return;
      }

      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'pt-BR';

      recognitionInstance.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const lastResult = event.results[lastResultIndex];
        
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript;
          setMessage(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          sonnerToast.error('Permissão de microfone negada');
        } else {
          sonnerToast.error('Erro ao reconhecer voz');
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      sonnerToast.error('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      sonnerToast.info('Fale agora...');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      // ESC para sair do modo de seleção
      if (e.key === 'Escape' && isSelectionMode) {
        clearSelection();
      }
      
      // Ctrl/Cmd + Shift + S para ativar modo de seleção
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
        e.preventDefault();
        toggleSelectionMode();
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, [isSelectionMode, clearSelection, toggleSelectionMode]);

  if (!copyId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Carregue uma copy para usar o chat
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background">
        {/* Chat Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-2 py-4 space-y-4"
        >
          {loadingChatHistory ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
              <div>
                <p className="text-sm">Nenhuma mensagem ainda</p>
                <p className="text-xs mt-1">Comece uma conversa sobre esta copy</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-lg p-3 break-words ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                {msg.role === 'assistant' ? (
            <AIMessageWithActions
              message={msg}
              hasSelection={selectedItems.length > 0}
              selectedItems={selectedItems}
              intent={msg.metadata?.intent} // 🆕 CORRIGIDO: passar intent do metadata
              onAddContent={handleAddContent}
              onReplaceContent={handleReplaceContent}
              onReplaceAll={handleReplaceAll}
            />
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-4 bg-background border-t border-border">
          <div className="border-2 border-border/60 rounded-xl" style={{ backgroundColor: 'rgb(245, 245, 245)' }}>
            {/* Selected Items Display */}
            {selectedItems.length > 0 && (
              <div className="px-4 pt-3 pb-2 border-b border-border/40 animate-fade-in">
                <div className="flex flex-wrap gap-1.5">
                  {selectedItems.map((item) => {
                    const session = sessions.find(s => s.id === item.sessionId || s.id === item.id);
                    return (
                      <div 
                        key={item.id} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        {item.type === 'session' ? <Layers className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                        <button
                          onClick={() => toggleItemSelection(item.id, item.type, item.sessionId)}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Container */}
            <div className="p-4">
              <div className="relative">
                <VariableInput
                  ref={textareaRef}
                  value={message}
                  onChange={handleMessageChange}
                  onKeyDown={handleKeyDown}
                  onVariableSearch={handleVariableSearch}
                  placeholder="Digite sua mensagem... (Use # para variáveis contextuais)"
                  className="pr-20 pb-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  disabled={isLoading}
                />

                {/* Badge de variáveis detectadas */}
                {(() => {
                  const vars = extractVariables(message);
                  const validVars = vars.filter(v => isValidVariable(v));
                  return validVars.length > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 right-2 text-xs"
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {validVars.length}
                    </Badge>
                  );
                })()}

                {/* Autocomplete de variáveis */}
                {showVariableSuggestions && filteredVariables.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-2 w-full max-w-md z-50">
                    <Command className="rounded-lg border shadow-md bg-background">
                      <CommandInput 
                        placeholder="Buscar variável..." 
                        value={variableSearch}
                        onValueChange={setVariableSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhuma variável encontrada.</CommandEmpty>
                        <ScrollArea className="h-[200px]">
                          {Object.entries(
                            filteredVariables.reduce((acc, v) => {
                              if (!acc[v.groupKey]) acc[v.groupKey] = [];
                              acc[v.groupKey].push(v);
                              return acc;
                            }, {} as Record<string, typeof filteredVariables>)
                          ).map(([groupKey, vars]) => (
                            <CommandGroup key={groupKey} heading={groupKey.toUpperCase()}>
                              {vars.map((variable) => (
                                <CommandItem
                                  key={variable.value}
                                  value={variable.value}
                                  onSelect={() => insertVariable(variable.value)}
                                  className="cursor-pointer"
                                >
                                  <code className="text-primary mr-2">{variable.value}</code>
                                  <span className="text-xs text-muted-foreground">{variable.label}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ))}
                        </ScrollArea>
                      </CommandList>
                    </Command>
                  </div>
                )}
                
                {/* Action Buttons Overlay */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                  {/* Character Count - Left Side */}
                  <span className="text-[10px] text-muted-foreground/60 font-mono">
                    {message.length}/2000
                  </span>

                  {/* Action Buttons - Right Side */}
                  <div className="flex items-center gap-2">
                    <Dialog open={showVariablesHelp} onOpenChange={setShowVariablesHelp}>
                      <DialogTrigger asChild>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Variáveis disponíveis</p>
                          </TooltipContent>
                        </Tooltip>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Variáveis Contextuais Disponíveis</DialogTitle>
                          <DialogDescription>
                            Use #NomeDoCampo para referenciar informações específicas do seu projeto
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh] pr-4">
                          <div className="space-y-6">
                            {/* Exemplos de uso */}
                            <div>
                              <h3 className="text-sm font-semibold mb-3">📝 Exemplos de Uso</h3>
                              <div className="space-y-4">
                                {VARIABLE_EXAMPLES.map((example, idx) => (
                                  <div key={idx} className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">{example.category}</p>
                                    {example.examples.map((ex, exIdx) => (
                                      <div key={exIdx} className="bg-muted p-3 rounded-md">
                                        <code className="text-xs">{ex}</code>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Lista de variáveis por grupo */}
                            <div>
                              <h3 className="text-sm font-semibold mb-3">🔖 Variáveis por Grupo</h3>
                              <div className="space-y-4">
                                {Object.entries(CONTEXT_VARIABLES).map(([groupKey, variables]) => (
                                  <div key={groupKey} className="space-y-2">
                                    <h4 className="text-sm font-medium capitalize">{groupKey}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {Object.entries(variables).map(([varName, config]) => (
                                        <div 
                                          key={varName}
                                          className="flex items-start gap-2 p-2 bg-muted/50 rounded hover:bg-muted transition-colors"
                                        >
                                          <code className="text-xs text-primary">#{varName}</code>
                                          <span className="text-xs text-muted-foreground">{config.label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowHistory(true)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Histórico de gerações</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleSelectionMode}
                          className={`h-8 w-8 transition-all ${isSelectionMode ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          {isSelectionMode ? <Check className="h-4 w-4" /> : <MousePointer className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {isSelectionMode ? `${selectedItems.length} selecionados` : 'Selecionar conteúdo'}
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleListening}
                          className={`h-8 w-8 transition-all ${isListening ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          {isListening ? (
                            <MicrophoneSlash size={18} weight="fill" className="animate-pulse" />
                          ) : (
                            <Microphone size={18} weight="fill" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {isListening ? 'Parar gravação' : 'Gravar áudio'}
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    <Button 
                      onClick={handleSend} 
                      disabled={!message.trim() || isLoading} 
                      size="icon"
                      className="h-8 w-8 rounded-lg shadow-sm hover:shadow-md transition-all"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <HistorySheet 
          open={showHistory}
          onOpenChange={setShowHistory}
          history={history}
          loadingHistory={loadingHistory}
          onHistoryItemClick={handleHistoryItemClick}
        />

        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar histórico do chat?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todas as mensagens do chat serão permanentemente removidas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => clearHistoryMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Limpar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
