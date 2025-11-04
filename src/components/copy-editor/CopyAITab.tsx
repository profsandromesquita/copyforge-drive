import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@/types/copy-editor';
import { AIGeneratedPreviewModal } from './AIGeneratedPreviewModal';

type Etapa = 1 | 2;

const OBJETIVOS = [
  { value: 'venda', label: 'Venda' },
  { value: 'engajamento', label: 'Engajamento' },
];

const ESTILOS = [
  { value: 'girias', label: 'Uso de Gírias' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'didatico', label: 'Didático' },
  { value: 'emocional', label: 'Emocional' },
];

const TAMANHOS = [
  { value: 'curta', label: 'Curta' },
  { value: 'conciso', label: 'Conciso' },
  { value: 'extenso', label: 'Extenso' },
];

const PREFERENCIAS = [
  { value: 'cta', label: 'CTA' },
  { value: 'emoji', label: 'Emoji' },
];

export const CopyAITab = () => {
  const { copyType } = useCopyEditor();
  const { toast } = useToast();

  // Etapa 1: Preferências
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [estilos, setEstilos] = useState<string[]>([]);
  const [tamanhos, setTamanhos] = useState<string[]>([]);
  const [preferencias, setPreferencias] = useState<string[]>([]);

  // Etapa 2: Detalhes
  const [prompt, setPrompt] = useState('');

  // Controle de UI
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSessions, setGeneratedSessions] = useState<Session[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const toggleArrayItem = (arr: string[], setArr: (val: string[]) => void, value: string) => {
    if (arr.includes(value)) {
      setArr(arr.filter(v => v !== value));
    } else {
      setArr([...arr, value]);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, descreva os detalhes da sua copy.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-copy', {
        body: {
          copyType: copyType || 'outro',
          objetivos,
          estilos,
          tamanhos,
          preferencias,
          prompt,
        },
      });

      if (error) {
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast({
            title: 'Limite de uso excedido',
            description: 'Você atingiu o limite de gerações. Aguarde alguns minutos.',
            variant: 'destructive',
          });
        } else if (error.message?.includes('402') || error.message?.includes('Créditos')) {
          toast({
            title: 'Créditos insuficientes',
            description: 'Adicione créditos em Configurações → Workspace → Uso.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      if (data?.sessions && data.sessions.length > 0) {
        setGeneratedSessions(data.sessions);
        setShowPreviewModal(true);
      } else {
        toast({
          title: 'Nenhum conteúdo gerado',
          description: 'Tente ajustar suas preferências ou detalhes.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao gerar copy:', error);
      toast({
        title: 'Erro ao gerar copy',
        description: 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModalClose = () => {
    setShowPreviewModal(false);
  };

  const handleSuccess = () => {
    // Reset form
    setObjetivos([]);
    setEstilos([]);
    setTamanhos([]);
    setPreferencias([]);
    setPrompt('');
    setEtapa(1);
    setGeneratedSessions([]);
  };

  if (etapa === 1) {
    return (
      <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
        <div className="space-y-6">
          {/* Objetivo da Copy */}
          <div className="space-y-2">
            <Label className="font-semibold">Objetivo da Copy</Label>
            <div className="space-y-2">
              {OBJETIVOS.map((item) => (
                <div key={item.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`objetivo-${item.value}`}
                    checked={objetivos.includes(item.value)}
                    onCheckedChange={() => toggleArrayItem(objetivos, setObjetivos, item.value)}
                  />
                  <label
                    htmlFor={`objetivo-${item.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Estilo da Escrita */}
          <div className="space-y-2">
            <Label className="font-semibold">Estilo da Escrita</Label>
            <div className="space-y-2">
              {ESTILOS.map((item) => (
                <div key={item.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`estilo-${item.value}`}
                    checked={estilos.includes(item.value)}
                    onCheckedChange={() => toggleArrayItem(estilos, setEstilos, item.value)}
                  />
                  <label
                    htmlFor={`estilo-${item.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Tamanho da Copy */}
          <div className="space-y-2">
            <Label className="font-semibold">Tamanho da Copy</Label>
            <div className="space-y-2">
              {TAMANHOS.map((item) => (
                <div key={item.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tamanho-${item.value}`}
                    checked={tamanhos.includes(item.value)}
                    onCheckedChange={() => toggleArrayItem(tamanhos, setTamanhos, item.value)}
                  />
                  <label
                    htmlFor={`tamanho-${item.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Outras Preferências */}
          <div className="space-y-2">
            <Label className="font-semibold">Outras Preferências</Label>
            <div className="space-y-2">
              {PREFERENCIAS.map((item) => (
                <div key={item.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`preferencia-${item.value}`}
                    checked={preferencias.includes(item.value)}
                    onCheckedChange={() => toggleArrayItem(preferencias, setPreferencias, item.value)}
                  />
                  <label
                    htmlFor={`preferencia-${item.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={() => setEtapa(2)} className="w-full">
            Próxima Etapa
          </Button>
        </div>
      </ScrollArea>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setEtapa(1)} className="w-full justify-start">
          ← Voltar para Preferências
        </Button>

        <div className="space-y-2">
          <Label className="font-semibold">Detalhes da Copy</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Descreva o que você precisa para sua copy..."
            rows={12}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            'Gerar Copy com IA'
          )}
        </Button>
      </div>

      <AIGeneratedPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        generatedSessions={generatedSessions}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </>
  );
};
