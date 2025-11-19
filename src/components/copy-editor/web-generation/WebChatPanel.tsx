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
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_SUGGESTIONS = [
  'Gere a landing page inicial com base na copy',
  'Adicione um formulário de captura de email',
  'Melhore o design do hero section',
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
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || 'Página gerada com sucesso!',
      };
      setMessages((prev) => [...prev, assistantMessage]);
      
      if (data.html && data.css) {
        onCodeGenerated(data.html, data.css);
      }
    } catch (error: any) {
      console.error('Erro ao gerar página:', error);
      
      let errorMessage = 'Erro ao gerar a página. Tente novamente.';
      if (error.message?.includes('429')) {
        errorMessage = 'Limite de requisições atingido. Aguarde alguns instantes.';
      } else if (error.message?.includes('402')) {
        errorMessage = 'Créditos insuficientes. Adicione créditos para continuar.';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMessage },
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
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Sparkle size={24} weight="fill" className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Comece a conversa</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Peça para a IA gerar sua landing page com base na copy
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSuggestion(suggestion)}
                    disabled={isGenerating}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
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
            className="min-h-[80px] resize-none"
            disabled={isGenerating}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isGenerating}
            size="icon"
            className="h-[80px] w-[80px]"
          >
            <PaperPlaneRight size={20} weight="fill" />
          </Button>
        </div>
      </div>
    </div>
  );
}
