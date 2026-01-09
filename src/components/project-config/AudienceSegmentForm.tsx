import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceInput } from './VoiceInput';
import { AdvancedAnalysisTab } from './AdvancedAnalysisTab';
import { AudienceSegment } from '@/types/project-config';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';

interface AudienceSegmentFormProps {
  segment: AudienceSegment | null;
  allSegments: AudienceSegment[];
  onSave: (segments: AudienceSegment[]) => void;
  onUpdate?: (segments: AudienceSegment[]) => void;
  onCancel: () => void;
  onAutoSavingChange?: (isSaving: boolean) => void;
  onSegmentCreated?: (segment: AudienceSegment) => void;
}

export const AudienceSegmentForm = ({ 
  segment, 
  allSegments, 
  onSave,
  onUpdate, 
  onCancel, 
  onAutoSavingChange,
  onSegmentCreated
}: AudienceSegmentFormProps) => {
  const { activeProject, refreshProjects, setActiveProject } = useProject();
  const [formData, setFormData] = useState<Partial<AudienceSegment>>({
    id: '',
    who_is: '',
    biggest_desire: '',
    biggest_pain: '',
    failed_attempts: '',
    beliefs: '',
    behavior: '',
    journey: '',
    is_completed: false,
    ...segment
  });
  const [identification, setIdentification] = useState(segment?.id || '');
  const [autoSaving, setAutoSaving] = useState(false);
  const [segmentCreated, setSegmentCreated] = useState(!!segment);
  const [originalId, setOriginalId] = useState(segment?.id || '');
  const [localSegment, setLocalSegment] = useState<AudienceSegment | null>(null);

const MIN_CHARS = 50;

  const mountedRef = useRef(true);
  const lastSyncedAnalysisRef = useRef<string | null>(null);
  const [activeInnerTab, setActiveInnerTab] = useState('basic');
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Load draft from localStorage or edit existing
  useEffect(() => {
    if (segment) {
      setFormData(segment);
      setIdentification(segment.id);
      setSegmentCreated(true);
      setOriginalId(segment.id);

      // Merge per-segment draft if exists (survives tab switches)
      try {
        const perSegmentDraft = localStorage.getItem(`audience-segment-draft-${segment.id}`);
        if (perSegmentDraft) {
          const parsed = JSON.parse(perSegmentDraft);
          if (parsed?.formData) setFormData({ ...segment, ...parsed.formData });
          if (parsed?.identification) setIdentification(parsed.identification);
        }
      } catch (e) {
        console.error('Error loading per-segment draft:', e);
      }
    } else {
      const draft = localStorage.getItem('audience-segment-draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setFormData(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Erro ao carregar rascunho:', e);
        }
      }
    }
  }, [segment]);

  // Sincronizar formData quando allSegments mudar (ex: após regenerar análise avançada)
  // Bug fix: Usar ref para evitar loop e sobrescrita de texto colado
  useEffect(() => {
    if (segment && allSegments.length > 0) {
      const updatedSegment = allSegments.find(s => s.id === segment.id);
      if (updatedSegment) {
        const newAnalysisStr = JSON.stringify(updatedSegment.advanced_analysis);
        
        // Só atualiza se a análise avançada realmente mudou E não foi sincronizada antes
        if (newAnalysisStr !== lastSyncedAnalysisRef.current) {
          lastSyncedAnalysisRef.current = newAnalysisStr;
          
          // Atualiza APENAS advanced_analysis, preservando outros campos
          setFormData(prev => ({
            ...prev,
            advanced_analysis: updatedSegment.advanced_analysis,
            analysis_generated_at: updatedSegment.analysis_generated_at
          }));
        }
      }
    }
  }, [allSegments, segment?.id]);

  // Save draft to localStorage
  useEffect(() => {
    if (!segment && Object.values(formData).some(v => v)) {
      const timer = setTimeout(() => {
        localStorage.setItem('audience-segment-draft', JSON.stringify(formData));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, segment]);

  // Salvar draft por segmento imediatamente quando campos mudam (Fase 4)
  useEffect(() => {
    if (segment && segmentCreated && Object.values(formData).some(v => v)) {
      localStorage.setItem(`audience-segment-draft-${segment.id}`, JSON.stringify({
        formData,
        identification
      }));
    }
  }, [formData, identification, segment, segmentCreated]);

  // Auto-save to database - Silencioso, sem refresh da página
  const autoSaveToDatabase = useCallback(async () => {
    if (!identification || !activeProject || !segmentCreated || !segment) return;

    if (mountedRef.current) {
      setAutoSaving(true);
      onAutoSavingChange?.(true);
    }

    try {
      const updatedSegment: AudienceSegment = {
        ...segment,
        ...formData,
        id: identification || segment.id
      } as AudienceSegment;

      const updatedSegments = allSegments.map(s => 
        s.id === segment.id ? updatedSegment : s
      );

      await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject.id);

      // Atualizar o estado local sem perder foco
      onUpdate?.(updatedSegments);

      // Atualizar o contexto do projeto para manter sincronização entre abas
      if (activeProject) {
        setActiveProject({ ...activeProject, audience_segments: updatedSegments });
      }

      // Save per-segment draft
      if (segment) {
        localStorage.setItem(`audience-segment-draft-${segment.id}`, JSON.stringify({
          formData,
          identification
        }));
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      toast.error('Erro ao salvar automaticamente');
    } finally {
      if (mountedRef.current) {
        setAutoSaving(false);
        onAutoSavingChange?.(false);
      }
    }
  }, [identification, formData, activeProject, segment, allSegments, onUpdate, onAutoSavingChange, segmentCreated, setActiveProject]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (identification && segmentCreated) {
        autoSaveToDatabase();
      }
    }, 3000); // Debounce de 3 segundos para melhor UX
    return () => clearTimeout(timer);
  }, [identification, formData, autoSaveToDatabase, segmentCreated]);

  const handleCreateSegment = async () => {
    if (!identification) {
      toast.error('Digite uma identificação para o público');
      return;
    }

    if (!activeProject) {
      toast.error('Projeto não encontrado');
      return;
    }

    // Verificar se já existe um segmento com este ID
    const segmentExists = allSegments.some(s => s.id === identification);
    if (segmentExists) {
      toast.error('Já existe um segmento com esta identificação');
      return;
    }

    try {
      const segmentId = identification;
      const newSegment: AudienceSegment = { 
        id: segmentId,
        who_is: '',
        biggest_desire: '',
        biggest_pain: '',
        failed_attempts: '',
        beliefs: '',
        behavior: '',
        journey: '',
        is_completed: false,
      };

      const updatedSegments = [...allSegments, newSegment];

      await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject.id);

      await refreshProjects();
      setSegmentCreated(true);
      setOriginalId(identification);
      
      // Atualizar estado local para transição imediata ao formulário de edição
      setLocalSegment(newSegment);
      setFormData(newSegment);
      onSegmentCreated?.(newSegment);
      
      toast.success('Segmento criado! Agora preencha os campos abaixo.');
    } catch (error) {
      console.error('Erro ao criar segmento:', error);
      toast.error('Erro ao criar segmento');
    }
  };

  const handleUpdateIdentification = async () => {
    if (!identification) {
      toast.error('Digite uma identificação para o público');
      return;
    }

    if (!activeProject) {
      toast.error('Projeto não encontrado');
      return;
    }

    // Verificar se já existe outro segmento com este ID
    const segmentExists = allSegments.some(s => s.id === identification && s.id !== originalId);
    if (segmentExists) {
      toast.error('Já existe um segmento com esta identificação');
      return;
    }

    try {
      // Remover segmento antigo e adicionar com novo ID
      const updatedSegments = allSegments.map(s => 
        s.id === originalId 
          ? { ...s, ...formData, id: identification }
          : s
      );

      await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject.id);

      await refreshProjects();
      setOriginalId(identification);
      setFormData(prev => ({ ...prev, id: identification }));
      toast.success('Identificação atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar identificação:', error);
      toast.error('Erro ao atualizar identificação');
    }
  };

  const isAllFieldsFilled = () => {
    return (
      (formData.who_is?.length || 0) >= MIN_CHARS &&
      (formData.biggest_desire?.length || 0) >= MIN_CHARS &&
      (formData.biggest_pain?.length || 0) >= MIN_CHARS &&
      (formData.failed_attempts?.length || 0) >= MIN_CHARS &&
      (formData.beliefs?.length || 0) >= MIN_CHARS &&
      (formData.behavior?.length || 0) >= MIN_CHARS &&
      (formData.journey?.length || 0) >= MIN_CHARS
    );
  };

  const handleComplete = async () => {
    if (!identification || !activeProject) return;

    try {
      const updatedFormData = { ...formData, is_completed: true };
      const segmentId = identification;
      const newSegment: AudienceSegment = { ...updatedFormData, id: segmentId } as AudienceSegment;

      const updatedSegments = allSegments.map(s => 
        s.id === segmentId ? newSegment : s
      );

      await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject.id);

      await refreshProjects();
      
      // Limpar rascunho do localStorage
      if (!segment) {
        localStorage.removeItem('audience-segment-draft');
      }
      
      toast.success('Informações básicas salvas! Agora gere a análise avançada.');
      
      // Mudar para aba de análise avançada ao invés de fechar
      setActiveInnerTab('advanced');
    } catch (error) {
      console.error('Erro ao concluir segmento:', error);
      toast.error('Erro ao concluir segmento');
    }
  };

  const handleClose = async () => {
    // Salvar antes de fechar se houver dados
    if (identification && segmentCreated && Object.values(formData).some(v => v)) {
      await autoSaveToDatabase();
      await refreshProjects();
    }
    
    if (!segment) {
      localStorage.removeItem('audience-segment-draft');
    }
    
    onCancel();
  };

  const getCharCount = (fieldId: string) => {
    const value = formData[fieldId as keyof typeof formData] as string || '';
    return value.length;
  };

  const questions = [
    {
      id: 'who_is',
      label: '1. Quem é essa pessoa?',
      placeholder: 'Ex: Carla, 32 anos, CLT em empresa de TI, casada, sem filhos, mora em apartamento alugado na zona sul de SP. Ganha R$ 4.500/mês mas sente que não sobra nada no fim do mês. Sonha em ter sua própria casa e viajar mais.'
    },
    {
      id: 'biggest_desire',
      label: '2. O que essa pessoa mais deseja alcançar?',
      placeholder: 'Ex: Ter uma renda extra de R$ 2.000 a R$ 3.000 por mês trabalhando de casa, nas horas vagas, para finalmente conseguir juntar dinheiro para a entrada do apartamento próprio e realizar pequenas viagens sem pesar no orçamento.'
    },
    {
      id: 'biggest_pain',
      label: 'Qual é o principal problema que essa pessoa tem?',
      placeholder: 'Ex: Vê o dinheiro do salário sumir entre contas, aluguel e pequenos gastos. Sente frustração por trabalhar tanto e não conseguir realizar sonhos básicos. Tem medo de depender só do emprego CLT e não ter segurança financeira. Vê amigas progredindo enquanto ela está estagnada.'
    },
    {
      id: 'failed_attempts',
      label: '4. O que ela já tentou e não deu certo?',
      placeholder: 'Ex: Tentou revender produtos por catálogo mas não conseguiu vender. Fez curso de manicure mas não teve coragem de atender clientes. Começou a vender doces mas desistiu pela correria. Investiu em marketing digital mas abandonou porque era muito técnico e confuso.'
    },
    {
      id: 'beliefs',
      label: '5. O que ela acredita (ou repete)?',
      placeholder: 'Ex: "Preciso de algo que realmente funcione", "Não tenho tempo para aprender coisas complicadas", "Já tentei de tudo e nada dá certo", "Quem ganha dinheiro extra ou tem sorte ou já tinha dinheiro para investir", "Meu salário nunca vai ser suficiente"'
    },
    {
      id: 'behavior',
      label: '6. Como ela fala / se comporta?',
      placeholder: 'Ex: Está sempre pesquisando "como ganhar dinheiro extra" no Google. Entra em grupos do Facebook sobre renda extra. Salva vários posts no Instagram sobre oportunidades mas nunca toma ação. Fala muito "eu queria fazer isso, mas..." e encontra desculpas. Reclama da situação financeira mas tem medo de arriscar.'
    },
    {
      id: 'journey',
      label: '7. Onde ela está e onde quer chegar?',
      placeholder: 'Ex: HOJE: Presa no ciclo de salário que mal cobre as contas, sem conseguir poupar, frustrada vendo oportunidades passarem. → QUER CHEGAR: Tendo uma renda extra consistente que permita juntar R$ 30 mil em 12 meses para a entrada do apartamento, com método simples que encaixe na rotina e sem precisar aparecer ou vender para conhecidos.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-8">
      {/* Identificação */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Identificação do Público *</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha um nome que identifique claramente este público-alvo
          </p>
        </div>
        <div className="flex gap-3">
          <Input
            value={identification}
            onChange={(e) => setIdentification(e.target.value)}
            placeholder="Ex: Profissionais TI | Mães Empreendedoras | Gestores"
            className="placeholder:text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && identification.trim()) {
                if (!segmentCreated) {
                  handleCreateSegment();
                } else if (identification !== originalId) {
                  handleUpdateIdentification();
                }
              }
            }}
          />
          {!segmentCreated ? (
            <Button onClick={handleCreateSegment} disabled={!identification.trim()} size="lg">
              Criar Público
            </Button>
          ) : (
            identification !== originalId && (
              <Button onClick={handleUpdateIdentification} variant="outline" size="lg">
                Atualizar Nome
              </Button>
            )
          )}
        </div>
      </div>

      {/* Form fields - only show after segment is created */}
      {segmentCreated && (
        <Tabs value={activeInnerTab} onValueChange={setActiveInnerTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="advanced">Informações Avançadas</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-8">
            {/* Card único com todos os campos */}
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-6">
              {questions.map((question, index) => {
                const charCount = getCharCount(question.id);
                const isValid = charCount >= MIN_CHARS;
                return (
                  <div key={question.id}>
                    {index > 0 && <div className="border-t border-border mb-6" />}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">{question.label}</Label>
                        <span className={`text-xs font-medium ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                          {charCount}/{MIN_CHARS}
                        </span>
                      </div>
                      <div className="relative">
                        <Textarea
                          id={question.id}
                          value={formData[question.id as keyof typeof formData] as string || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [question.id]: e.target.value }))}
                          placeholder={question.placeholder}
                          rows={4}
                          className="pr-12 resize-none"
                        />
                        <VoiceInput
                          onTranscript={(text) => setFormData(prev => ({
                            ...prev,
                            [question.id]: prev[question.id as keyof typeof prev] 
                              ? `${prev[question.id as keyof typeof prev]} ${text}` 
                              : text
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleClose} 
                className="flex-1 h-11"
                size="lg"
              >
                Salvar e Fechar
              </Button>
              <Button 
                onClick={handleComplete} 
                disabled={!isAllFieldsFilled()}
                className="flex-1 h-11"
                size="lg"
              >
                Avançar para Análise
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedAnalysisTab
              segment={segment || localSegment as AudienceSegment}
              allSegments={allSegments}
              onUpdate={(updatedSegments) => {
                onUpdate?.(updatedSegments);
                if (activeProject) {
                  setActiveProject({ ...activeProject, audience_segments: updatedSegments });
                }
              }}
              onClose={() => {
                onSave(allSegments);
              }}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
