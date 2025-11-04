import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useProject } from '@/hooks/useProject';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@/types/copy-editor';
import { AIGeneratedPreviewModal } from './AIGeneratedPreviewModal';
import { AudienceSegment, Offer } from '@/types/project-config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Etapa = 1 | 2 | 3;

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
  const { activeProject } = useProject();
  const { toast } = useToast();

  // Etapa 1: Segmentação e Oferta
  const [audienceSegmentId, setAudienceSegmentId] = useState<string>('');
  const [offerId, setOfferId] = useState<string>('');

  // Etapa 2: Preferências
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [estilos, setEstilos] = useState<string[]>([]);
  const [tamanho, setTamanho] = useState<string>('');
  const [preferencias, setPreferencias] = useState<string[]>([]);

  // Etapa 3: Detalhes
  const [prompt, setPrompt] = useState('');

  // Controle de UI
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSessions, setGeneratedSessions] = useState<Session[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Carregar dados do projeto
  const audienceSegments = activeProject?.audience_segments || [];
  const offers = activeProject?.offers || [];


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
      // Buscar dados do público e oferta selecionados
      const selectedAudience = audienceSegmentId 
        ? audienceSegments.find(s => s.id === audienceSegmentId)
        : null;
      
      const selectedOffer = offerId
        ? offers.find(o => o.id === offerId)
        : null;

      const { data, error } = await supabase.functions.invoke('generate-copy', {
        body: {
          copyType: copyType || 'outro',
          objetivos,
          estilos,
          tamanhos: tamanho ? [tamanho] : [],
          preferencias,
          prompt,
          audienceSegment: selectedAudience,
          offer: selectedOffer,
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
    setAudienceSegmentId('');
    setOfferId('');
    setObjetivos([]);
    setEstilos([]);
    setTamanho('');
    setPreferencias([]);
    setPrompt('');
    setEtapa(1);
    setGeneratedSessions([]);
  };

  // Etapa 1: Segmentação e Oferta
  if (etapa === 1) {
    return (
      <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
        <div className="space-y-6">
          {/* Segmentação do Público */}
          <div className="space-y-3">
            <Label className="font-semibold text-sm">Segmentação do Público (Opcional)</Label>
            <Select value={audienceSegmentId} onValueChange={setAudienceSegmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um público-alvo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {audienceSegments.map((segment: AudienceSegment) => (
                  <SelectItem key={segment.id} value={segment.id}>
                    {segment.avatar} - {segment.segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Oferta */}
          <div className="space-y-3">
            <Label className="font-semibold text-sm">Oferta (Opcional)</Label>
            <Select value={offerId} onValueChange={setOfferId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma oferta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhuma</SelectItem>
                {offers.map((offer: Offer) => (
                  <SelectItem key={offer.id} value={offer.id}>
                    {offer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setEtapa(2)} className="w-full">
            Próxima Etapa
          </Button>
        </div>
      </ScrollArea>
    );
  }

  // Etapa 2: Preferências
  if (etapa === 2) {
    return (
      <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
        <div className="space-y-6">
          {/* Objetivo da Copy */}
          <div className="space-y-3">
            <Label className="font-semibold text-sm">Objetivo da Copy</Label>
            <ToggleGroup 
              type="multiple" 
              value={objetivos} 
              onValueChange={setObjetivos}
              className="grid grid-cols-2 gap-2"
            >
              {OBJETIVOS.map((item) => (
                <ToggleGroupItem 
                  key={item.value} 
                  value={item.value}
                  variant="outline"
                  className="text-sm h-9"
                >
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Estilo da Escrita */}
          <div className="space-y-3">
            <Label className="font-semibold text-sm">Estilo da Escrita</Label>
            <ToggleGroup 
              type="multiple" 
              value={estilos} 
              onValueChange={setEstilos}
              className="grid grid-cols-2 gap-2"
            >
              {ESTILOS.map((item) => (
                <ToggleGroupItem 
                  key={item.value} 
                  value={item.value}
                  variant="outline"
                  className="text-sm h-9"
                >
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Tamanho da Copy */}
          <div className="space-y-3">
            <Label className="font-semibold text-sm">Tamanho da Copy</Label>
            <ToggleGroup 
              type="single" 
              value={tamanho} 
              onValueChange={setTamanho}
              className="grid grid-cols-3 gap-2"
            >
              {TAMANHOS.map((item) => (
                <ToggleGroupItem 
                  key={item.value} 
                  value={item.value}
                  variant="outline"
                  className="text-sm h-9"
                >
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Outras Preferências */}
          <div className="space-y-3">
            <Label className="font-semibold text-sm">Outras Preferências</Label>
            <ToggleGroup 
              type="multiple" 
              value={preferencias} 
              onValueChange={setPreferencias}
              className="grid grid-cols-2 gap-2"
            >
              {PREFERENCIAS.map((item) => (
                <ToggleGroupItem 
                  key={item.value} 
                  value={item.value}
                  variant="outline"
                  className="text-sm h-9"
                >
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEtapa(1)} className="flex-1">
              ← Voltar
            </Button>
            <Button onClick={() => setEtapa(3)} className="flex-1">
              Próxima Etapa
            </Button>
          </div>
        </div>
      </ScrollArea>
    );
  }

  // Etapa 3: Detalhes

  return (
    <>
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setEtapa(2)} className="w-full justify-start">
          ← Voltar
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
