import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Loader2, Check, X, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface CopyChatTabProps {
  isActive?: boolean;
}

export function CopyChatTab({ isActive = true }: CopyChatTabProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    clearSelection 
  } = useCopyEditor();
  const queryClient = useQueryClient();

  // Buscar histórico de mensagens
  const { data: chatHistory = [], isLoading: loadingHistory } = useQuery({
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
  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada');

      const { data, error } = await supabase.functions.invoke('copy-chat', {
        body: {
          copyId,
          message: userMessage,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
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
      toast({
        title: 'Histórico limpo',
        description: 'O histórico do chat foi removido com sucesso.',
      });
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
      clearSelection();
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-foreground">Chat IA Especialista</h3>
            <p className="text-sm text-muted-foreground">
              Converse sobre esta copy com a IA
            </p>
          </div>
          {chatHistory.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearHistoryMutation.mutate()}
              disabled={clearHistoryMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>

        {/* Chat Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {loadingHistory ? (
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
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
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

        {/* Botão Selecionar e Input */}
        <div className="px-4 pt-4 pb-2 border-t">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isSelectionMode ? "default" : "outline"}
                size="sm"
                onClick={toggleSelectionMode}
                className="w-full mb-2"
              >
                {isSelectionMode ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Modo Seleção ({selectedItems.length})
                  </>
                ) : (
                  <>
                    <MousePointer className="h-4 w-4 mr-2" />
                    Selecionar Blocos/Sessões
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Selecione blocos ou sessões (Ctrl+Shift+S)</p>
            </TooltipContent>
          </Tooltip>

          {selectedItems.length > 0 && (
            <div className="mb-2 p-2 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Selecionados:</p>
              <div className="flex flex-wrap gap-1">
                {selectedItems.map((item) => {
                  const session = sessions.find(s => s.id === item.sessionId || s.id === item.id);
                  return (
                    <div key={item.id} className="flex items-center gap-1 px-2 py-1 bg-background rounded text-xs">
                      <span>{item.type === 'session' ? '📋' : '📝'}</span>
                      <button onClick={() => toggleItemSelection(item.id, item.type, item.sessionId)}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 pt-0 space-y-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="min-h-[80px] resize-none"
            disabled={isLoading}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{message.length}/2000</span>
            <Button onClick={handleSend} disabled={!message.trim() || isLoading} size="sm">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
