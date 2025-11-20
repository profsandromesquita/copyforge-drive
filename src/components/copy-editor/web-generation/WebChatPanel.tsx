import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaperPlaneRight, Sparkle } from 'phosphor-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@/types/copy-editor';

interface WebChatPanelProps {
  copyId: string | null;
  copyTitle: string;
  copyType: string | null;
  sessions: Session[];
  onCodeGenerated: (html: string, css: string) => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  generatedCode: { html: string; css: string } | null;
  workspaceId: string | null;
  userId: string | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_SUGGESTIONS = [
  'Adicione um formulário de captura de email',
  'Melhore o design do hero section',
  'Adicione uma seção de depoimentos',
  'Inclua um contador de tempo limitado',
  'Adicione animações suaves nos elementos',
];

export function WebChatPanel({
  copyId,
  copyTitle,
  copyType,
  sessions,
  onCodeGenerated,
  isGenerating,
  setIsGenerating,
  generatedCode,
  workspaceId,
  userId,
}: WebChatPanelProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || !copyId || isGenerating) return;

    if (!workspaceId || !userId) {
      toast({
        title: 'Erro',
        description: 'Sua sessão expirou. Por favor, recarregue a página.',
        variant: 'destructive',
      });
      return;
    }

    const newUserMessage: Message = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setMessage('');
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-web-page', {
        body: {
          copyId,
          copyTitle,
          copyType,
          sessions,
          userInstruction: userMessage,
          previousCode: generatedCode,
          conversationHistory: messages,
          workspaceId,
          userId,
        },
      });

      if (error) throw error;

      if (data?.error) {
        let errorMessage = 'Erro ao gerar a página. Tente novamente.';
        
        if (data.error === 'insufficient_credits') {
          errorMessage = 'Créditos insuficientes. Adicione créditos para continuar.';
        } else if (data.error === 'AI configuration missing') {
          errorMessage = 'Problema interno de configuração da IA. Contate o suporte.';
        } else if (data.error.includes('AI API error')) {
          errorMessage = 'Falha temporária no modelo de IA. Tente novamente em alguns instantes.';
        } else if (data.error.includes('AI did not return valid HTML/CSS')) {
          errorMessage = 'A IA não retornou um código válido. Tente reformular sua solicitação.';
        }
        
        throw new Error(errorMessage);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || 'Página gerada com sucesso!',
      };
      setMessages((prev) => [...prev, assistantMessage]);
      
      if (data.html && data.css) {
        onCodeGenerated(data.html, data.css);
      } else {
        throw new Error('A IA não retornou um código válido. Tente novamente.');
      }
    } catch (error: any) {
      console.error('Erro ao gerar página:', error);
      
      let errorMessage = 'Erro ao gerar a página. Tente novamente.';
      if (error.message?.includes('insufficient_credits') || error.message?.includes('402')) {
        errorMessage = 'Créditos insuficientes. Adicione créditos para continuar.';
      } else if (error.message?.includes('Usuário não autenticado') || error.message?.includes('401')) {
        errorMessage = 'Sua sessão expirou. Por favor, recarregue a página e faça login novamente.';
      } else if (error.message?.includes('429')) {
        errorMessage = 'Muitas requisições. Aguarde alguns segundos e tente novamente.';
      } else if (error.message?.includes('AI configuration missing')) {
        errorMessage = 'Problema interno de configuração da IA. Contate o suporte.';
      } else if (error.message?.includes('AI API error')) {
        errorMessage = 'Falha temporária no modelo de IA. Tente novamente em alguns instantes.';
      } else if (error.message?.includes('AI did not return valid')) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Erro: ${errorMessage}` },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = () => {
    sendMessage(message);
  };

  const handleQuickSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Histórico de mensagens */}
      <ScrollArea className="flex-1 p-4">
        <div ref={scrollRef} className="space-y-4">
          {messages.length === 0 && !isGenerating && (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Sparkle size={24} weight="fill" className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">✨ Gerando preview inicial...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estou criando sua landing page com base na copy. Aguarde alguns instantes.
                </p>
              </div>
            </div>
          )}

          {messages.length === 0 && isGenerating && (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Sparkle size={24} weight="fill" className="text-primary animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium">Aguarde...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Gerando seu preview inicial
                </p>
              </div>
            </div>
          )}

          {messages.length > 0 && messages.length === 1 && messages[0].role === 'assistant' && (
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ✅ Preview gerado! Você pode pedir ajustes como: "adicione um formulário", "mude as cores", "adicione animações", etc.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
                  </div>
                  <p className="text-sm text-muted-foreground">Gerando página...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input de mensagem */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva como deseja a página ou peça ajustes..."
            className="min-h-[100px] max-h-[200px] resize-none overflow-y-auto"
            disabled={isGenerating}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isGenerating}
            size="icon"
            className="h-[100px] w-[100px]"
          >
            <PaperPlaneRight size={20} weight="fill" />
          </Button>
        </div>
      </div>
    </div>
  );
}
