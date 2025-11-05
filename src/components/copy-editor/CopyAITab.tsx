import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wand2, History, Loader2, Copy as CopyIcon, Eye } from 'lucide-react';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { useProject } from '@/hooks/useProject';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Session, Block } from '@/types/copy-editor';
import { AIGeneratedPreviewModal } from './AIGeneratedPreviewModal';
import { SelectContentModal } from './SelectContentModal';
import { OptimizeComparisonModal } from './OptimizeComparisonModal';
import { AudienceSegment, Offer } from '@/types/project-config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const { copyId, copyType, sessions: copySessions, importSessions, updateSession } = useCopyEditor();
  const { activeProject } = useProject();
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();

  // Controle de abas
  const [activeTab, setActiveTab] = useState('criar');

  // Estado para criação
  const [audienceSegmentId, setAudienceSegmentId] = useState<string>('');
  const [offerId, setOfferId] = useState<string>('');
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [estilos, setEstilos] = useState<string[]>([]);
  const [tamanho, setTamanho] = useState<string>('');
  const [preferencias, setPreferencias] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSessions, setGeneratedSessions] = useState<Session[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Estado para otimização
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{ sessions: Session[], blocks: Block[] } | null>(null);
  const [optimizeAction, setOptimizeAction] = useState<'otimizar' | 'variacao' | null>(null);
  const [optimizeInstructions, setOptimizeInstructions] = useState('');
  const [optimizedSessions, setOptimizedSessions] = useState<Session[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Histórico
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [selectedPromptItem, setSelectedPromptItem] = useState<any>(null);

  const audienceSegments = activeProject?.audience_segments || [];
  const offers = activeProject?.offers || [];

  useEffect(() => {
    if (activeTab === 'historico' && copyId) {
      loadHistory();
    }
  }, [activeTab, copyId]);

  const loadHistory = async () => {
    if (!copyId) return;
    
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('ai_generation_history')
        .select('*')
        .eq('copy_id', copyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast({
        title: 'Erro ao carregar histórico',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const resetForm = () => {
    setEtapa(1);
    setAudienceSegmentId('');
    setOfferId('');
    setObjetivos([]);
    setEstilos([]);
    setTamanho('');
    setPreferencias([]);
    setPrompt('');
  };

  const resetOptimizeForm = () => {
    setSelectedContent(null);
    setOptimizeAction(null);
    setOptimizeInstructions('');
    setOptimizedSessions([]);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt obrigatório',
        description: 'Por favor, descreva o que você precisa para sua copy.',
        variant: 'destructive',
      });
      return;
    }

    if (!copyId || !activeWorkspace || !user) {
      toast({
        title: 'Erro',
        description: 'Informações do workspace não encontradas',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      let projectIdentity = null;
      let audienceSegment = null;
      let offer = null;

      if (activeProject) {
        projectIdentity = {
          brand_name: activeProject.brand_name,
          sector: activeProject.sector,
          central_purpose: activeProject.central_purpose,
          voice_tones: activeProject.voice_tones,
          brand_personality: activeProject.brand_personality,
        };

        if (audienceSegmentId) {
          audienceSegment = audienceSegments.find(s => s.id === audienceSegmentId);
        }

        if (offerId) {
          offer = offers.find(o => o.id === offerId);
        }
      }

      const { data, error } = await supabase.functions.invoke('generate-copy', {
        body: {
          copyType: copyType || 'outro',
          prompt,
          objectives: objetivos,
          styles: estilos,
          size: tamanho,
          preferences: preferencias,
          projectIdentity,
          audienceSegment,
          offer,
          copyId,
          workspaceId: activeWorkspace.id,
        }
      });

      if (error) {
        if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
          toast({
            title: 'Limite de requisições atingido',
            description: 'Tente novamente em alguns instantes.',
            variant: 'destructive',
          });
        } else if (error.message?.includes('insufficient_credits') || error.message?.includes('402')) {
          toast({
            title: 'Créditos insuficientes',
            description: 'Adicione mais créditos para continuar.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      setGeneratedSessions(data.sessions);
      setShowPreviewModal(true);
      toast({
        title: 'Copy gerada com sucesso!',
        description: 'Visualize e importe o conteúdo gerado.',
      });

    } catch (error: any) {
      console.error('Error generating copy:', error);
      toast({
        title: 'Erro ao gerar copy',
        description: error.message,
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
    setShowPreviewModal(false);
    resetForm();
    toast({
      title: 'Copy importada com sucesso!',
    });
  };

  const handleHistoryItemClick = (item: any) => {
    setGeneratedSessions(item.sessions);
    setShowPreviewModal(true);
  };

  const handleContentSelect = (sessions: Session[], blocks: Block[]) => {
    setSelectedContent({ sessions, blocks });
    setOptimizeAction(null);
    setOptimizeInstructions('');
  };

  const handleActionSelect = (action: 'otimizar' | 'variacao') => {
    setOptimizeAction(action);
  };

  const handleOptimizeGenerate = async () => {
    if (!selectedContent || !optimizeAction || !optimizeInstructions.trim()) {
      toast({
        title: 'Instruções obrigatórias',
        description: 'Preencha as instruções antes de gerar',
        variant: 'destructive',
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const { data: copyData } = await supabase
        .from('copies')
        .select('workspace_id, project_id')
        .eq('id', copyId)
        .single();

      if (!copyData) throw new Error('Copy não encontrada');

      let projectIdentity = null;
      let audienceSegment = null;
      let offer = null;

      if (copyData.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('*')
          .eq('id', copyData.project_id)
          .single();

        if (projectData) {
          projectIdentity = {
            brand_name: projectData.brand_name,
            sector: projectData.sector,
            central_purpose: projectData.central_purpose,
            voice_tones: projectData.voice_tones,
            brand_personality: projectData.brand_personality
          };

          if (audienceSegmentId && Array.isArray(projectData.audience_segments)) {
            audienceSegment = (projectData.audience_segments as any[]).find((s: any) => s.id === audienceSegmentId);
          }

          if (offerId && Array.isArray(projectData.offers)) {
            offer = (projectData.offers as any[]).find((o: any) => o.id === offerId);
          }
        }
      }

      const { data, error } = await supabase.functions.invoke('optimize-copy', {
        body: {
          action: optimizeAction,
          originalContent: selectedContent.sessions,
          instructions: optimizeInstructions,
          projectIdentity,
          audienceSegment,
          offer,
          copyId,
          workspaceId: copyData.workspace_id
        }
      });

      if (error) {
        if (error.message?.includes('rate_limit') || error.message?.includes('429')) {
          toast({
            title: 'Limite de requisições atingido',
            description: 'Tente novamente em alguns instantes.',
            variant: 'destructive',
          });
        } else if (error.message?.includes('insufficient_credits') || error.message?.includes('402')) {
          toast({
            title: 'Créditos insuficientes',
            description: 'Adicione mais créditos para continuar.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      setOptimizedSessions(data.sessions);
      setShowComparisonModal(true);
      toast({
        title: 'Conteúdo gerado com sucesso!',
      });

    } catch (error: any) {
      console.error('Error optimizing:', error);
      toast({
        title: 'Erro ao gerar conteúdo',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleReplace = () => {
    if (!selectedContent || !optimizedSessions) return;

    selectedContent.sessions.forEach((originalSession, idx) => {
      if (optimizedSessions[idx]) {
        updateSession(originalSession.id, {
          title: optimizedSessions[idx].title,
          blocks: optimizedSessions[idx].blocks
        });
      }
    });

    setShowComparisonModal(false);
    resetOptimizeForm();
    toast({
      title: 'Conteúdo substituído com sucesso!',
    });
  };

  const handleAdd = () => {
    if (!optimizedSessions) return;

    importSessions(optimizedSessions);
    setShowComparisonModal(false);
    resetOptimizeForm();
    toast({
      title: 'Novo conteúdo adicionado com sucesso!',
    });
  };

  const handleRegenerate = async (regenerateInstructions: string) => {
    if (!selectedContent || !optimizeAction) return;

    setIsOptimizing(true);
    try {
      const { data: copyData } = await supabase
        .from('copies')
        .select('workspace_id, project_id')
        .eq('id', copyId)
        .single();

      if (!copyData) throw new Error('Copy não encontrada');

      let projectIdentity = null;
      let audienceSegment = null;
      let offer = null;

      if (copyData.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('*')
          .eq('id', copyData.project_id)
          .single();

        if (projectData) {
          projectIdentity = {
            brand_name: projectData.brand_name,
            sector: projectData.sector,
            central_purpose: projectData.central_purpose,
            voice_tones: projectData.voice_tones,
            brand_personality: projectData.brand_personality
          };

          if (audienceSegmentId && Array.isArray(projectData.audience_segments)) {
            audienceSegment = (projectData.audience_segments as any[]).find((s: any) => s.id === audienceSegmentId);
          }

          if (offerId && Array.isArray(projectData.offers)) {
            offer = (projectData.offers as any[]).find((o: any) => o.id === offerId);
          }
        }
      }

      const { data, error } = await supabase.functions.invoke('optimize-copy', {
        body: {
          action: optimizeAction,
          originalContent: selectedContent.sessions,
          instructions: optimizeInstructions,
          regenerateInstructions,
          projectIdentity,
          audienceSegment,
          offer,
          copyId,
          workspaceId: copyData.workspace_id
        }
      });

      if (error) throw error;

      setOptimizedSessions(data.sessions);
      toast({
        title: 'Conteúdo regenerado com sucesso!',
      });

    } catch (error: any) {
      console.error('Error regenerating:', error);
      toast({
        title: 'Erro ao regenerar conteúdo',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const renderCriarTab = () => {
    // Etapa 1
    if (etapa === 1) {
      return (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-6 p-4">
            <div className="space-y-2">
              <Label className="font-semibold">Público-Alvo</Label>
              <Select value={audienceSegmentId} onValueChange={setAudienceSegmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o público-alvo" />
                </SelectTrigger>
                <SelectContent>
                  {audienceSegments.map((segment: AudienceSegment) => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Oferta</Label>
              <Select value={offerId} onValueChange={setOfferId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a oferta" />
                </SelectTrigger>
                <SelectContent>
                  {offers.map((offer: Offer) => (
                    <SelectItem key={offer.id} value={offer.id}>
                      {offer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setEtapa(2)} className="w-full">
              Próximo
            </Button>
          </div>
        </ScrollArea>
      );
    }

    // Etapa 2
    if (etapa === 2) {
      return (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-6 p-4">
            <Button variant="ghost" onClick={() => setEtapa(1)} className="w-full justify-start">
              ← Voltar
            </Button>

            <div className="space-y-2">
              <Label className="font-semibold">Objetivos</Label>
              <ToggleGroup type="multiple" value={objetivos} onValueChange={setObjetivos} className="flex flex-wrap gap-2 justify-start">
                {OBJETIVOS.map((obj) => (
                  <ToggleGroupItem key={obj.value} value={obj.value} className="flex-shrink-0">
                    {obj.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Estilos</Label>
              <ToggleGroup type="multiple" value={estilos} onValueChange={setEstilos} className="flex flex-wrap gap-2 justify-start">
                {ESTILOS.map((estilo) => (
                  <ToggleGroupItem key={estilo.value} value={estilo.value} className="flex-shrink-0">
                    {estilo.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Tamanho</Label>
              <ToggleGroup type="single" value={tamanho} onValueChange={setTamanho} className="flex flex-wrap gap-2 justify-start">
                {TAMANHOS.map((tam) => (
                  <ToggleGroupItem key={tam.value} value={tam.value} className="flex-shrink-0">
                    {tam.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Preferências</Label>
              <ToggleGroup type="multiple" value={preferencias} onValueChange={setPreferencias} className="flex flex-wrap gap-2 justify-start">
                {PREFERENCIAS.map((pref) => (
                  <ToggleGroupItem key={pref.value} value={pref.value} className="flex-shrink-0">
                    {pref.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <Button onClick={() => setEtapa(3)} className="w-full">
              Próximo
            </Button>
          </div>
        </ScrollArea>
      );
    }

    // Etapa 3
    return (
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-4 p-4">
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
      </ScrollArea>
    );
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="criar" className="gap-2">
            <Sparkles className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="otimizar" className="gap-2">
            <Wand2 className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <History className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="criar" className="flex-1 mt-0">
          {renderCriarTab()}
        </TabsContent>

        <TabsContent value="otimizar" className="flex-1 mt-0">
          {!selectedContent ? (
            <div className="flex items-center justify-center h-full">
              <Button 
                size="lg"
                onClick={() => {
                  if (copySessions.length === 0) {
                    toast({
                      title: 'Nenhum conteúdo disponível',
                      description: 'Adicione conteúdo à copy antes de otimizar',
                      variant: 'destructive',
                    });
                    return;
                  }
                  setShowSelectModal(true);
                }}
              >
                <Wand2 className="h-5 w-5 mr-2" />
                Selecionar Conteúdo
              </Button>
            </div>
          ) : !optimizeAction ? (
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Conteúdo Selecionado</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowSelectModal(true)}>
                    Alterar Seleção
                  </Button>
                </div>

                <div className="grid gap-3 mb-6">
                  {selectedContent.sessions.map(session => (
                    <Card key={session.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{session.title}</span>
                          <Badge variant="secondary">{session.blocks.length} blocos</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Escolha uma ação:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card 
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleActionSelect('otimizar')}
                    >
                      <CardContent className="p-6 text-center space-y-3">
                        <Wand2 className="h-8 w-8 mx-auto text-primary" />
                        <div>
                          <h4 className="font-semibold mb-1">Otimizar</h4>
                          <p className="text-sm text-muted-foreground">
                            Melhore o conteúdo mantendo a estrutura
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card 
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleActionSelect('variacao')}
                    >
                      <CardContent className="p-6 text-center space-y-3">
                        <CopyIcon className="h-8 w-8 mx-auto text-primary" />
                        <div>
                          <h4 className="font-semibold mb-1">Criar Variação</h4>
                          <p className="text-sm text-muted-foreground">
                            Crie uma versão alternativa completa
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {optimizeAction === 'otimizar' ? (
                      <>
                        <Wand2 className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Otimizar Conteúdo</h3>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Criar Variação</h3>
                      </>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setOptimizeAction(null)}>
                    Voltar
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label className="font-medium">
                    Instruções para o Agente
                  </Label>
                  <Textarea
                    value={optimizeInstructions}
                    onChange={(e) => setOptimizeInstructions(e.target.value)}
                    placeholder={
                      optimizeAction === 'otimizar'
                        ? "Ex: Torne mais persuasivo, adicione senso de urgência, melhore a clareza..."
                        : "Ex: Crie uma versão mais formal, adapte para LinkedIn, use abordagem emocional..."
                    }
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <Button 
                  onClick={handleOptimizeGenerate} 
                  disabled={isOptimizing || !optimizeInstructions.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isOptimizing ? (
                    <>
                      <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Gerar
                    </>
                  )}
                </Button>
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="historico" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p>Nenhuma geração anterior</p>
              </div>
            ) : (
              <div className="grid gap-3 p-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group w-full text-left p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all hover:shadow-md hover:border-primary/30"
                  >
                    <div className="space-y-3">
                      {/* Header com tipo e data */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {item.generation_type === 'optimize' ? (
                            <>
                              <Wand2 className="h-4 w-4 text-primary" />
                              <Badge variant="secondary" className="text-xs">Otimização</Badge>
                            </>
                          ) : item.generation_type === 'variation' ? (
                            <>
                              <CopyIcon className="h-4 w-4 text-primary" />
                              <Badge variant="secondary" className="text-xs">Variação</Badge>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 text-primary" />
                              <Badge variant="secondary" className="text-xs">Criação</Badge>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPromptItem(item);
                              setShowPromptDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(item.created_at), { 
                              addSuffix: true,
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Prompt - clicável para visualizar */}
                      <button
                        onClick={() => handleHistoryItemClick(item)}
                        className="w-full text-left"
                      >
                        <p className="text-sm font-medium line-clamp-2 leading-relaxed group-hover:text-primary transition-colors">
                          {item.prompt}
                        </p>
                      </button>

                      {/* Footer com informações adicionais */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="px-2 py-1 bg-muted rounded">
                            {item.sessions?.length || 0} sessão(ões)
                          </span>
                          {item.copy_type && (
                            <span className="px-2 py-1 bg-muted rounded capitalize">
                              {item.copy_type.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHistoryItemClick(item)}
                          className="text-xs"
                        >
                          Visualizar Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Dialog para visualizar prompt completo */}
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Detalhes do Prompt</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {selectedPromptItem && (
              <div className="space-y-4">
                {/* Tipo e Data */}
                <div className="flex items-center gap-3 pb-3 border-b">
                  {selectedPromptItem.generation_type === 'optimize' ? (
                    <>
                      <Wand2 className="h-5 w-5 text-primary" />
                      <Badge variant="secondary">Otimização</Badge>
                    </>
                  ) : selectedPromptItem.generation_type === 'variation' ? (
                    <>
                      <CopyIcon className="h-5 w-5 text-primary" />
                      <Badge variant="secondary">Variação</Badge>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 text-primary" />
                      <Badge variant="secondary">Criação</Badge>
                    </>
                  )}
                  <span className="text-sm text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(selectedPromptItem.created_at), { 
                      addSuffix: true,
                      locale: ptBR 
                    })}
                  </span>
                </div>

                {/* Prompt */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Prompt Completo:</Label>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedPromptItem.prompt}
                    </p>
                  </div>
                </div>

                {/* Parâmetros */}
                {selectedPromptItem.parameters && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Parâmetros:</Label>
                    <div className="space-y-2">
                      {selectedPromptItem.parameters.objectives && selectedPromptItem.parameters.objectives.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Objetivos:</span>
                          {selectedPromptItem.parameters.objectives.map((obj: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">{obj}</Badge>
                          ))}
                        </div>
                      )}
                      {selectedPromptItem.parameters.styles && selectedPromptItem.parameters.styles.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Estilos:</span>
                          {selectedPromptItem.parameters.styles.map((style: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">{style}</Badge>
                          ))}
                        </div>
                      )}
                      {selectedPromptItem.parameters.size && (
                        <div className="flex gap-2">
                          <span className="text-xs text-muted-foreground">Tamanho:</span>
                          <Badge variant="outline" className="text-xs">{selectedPromptItem.parameters.size}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Informações adicionais */}
                <div className="flex items-center gap-3 pt-3 border-t">
                  <span className="text-xs px-2 py-1 bg-muted rounded">
                    {selectedPromptItem.sessions?.length || 0} sessão(ões) geradas
                  </span>
                  {selectedPromptItem.copy_type && (
                    <span className="text-xs px-2 py-1 bg-muted rounded capitalize">
                      {selectedPromptItem.copy_type.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AIGeneratedPreviewModal
        open={showPreviewModal}
        onOpenChange={handleModalClose}
        generatedSessions={generatedSessions}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />

      <SelectContentModal
        open={showSelectModal}
        onOpenChange={setShowSelectModal}
        sessions={copySessions}
        onConfirm={handleContentSelect}
      />

      <OptimizeComparisonModal
        open={showComparisonModal}
        onOpenChange={setShowComparisonModal}
        originalContent={selectedContent?.sessions || []}
        generatedContent={optimizedSessions}
        onReplace={handleReplace}
        onAdd={handleAdd}
        onRegenerate={handleRegenerate}
        isRegenerating={isOptimizing}
      />
    </>
  );
};
