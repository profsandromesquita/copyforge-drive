import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VoiceInput } from './VoiceInput';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, CircleNotch } from 'phosphor-react';
import { Methodology } from '@/types/project-config';
import { useProject } from '@/hooks/useProject';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MethodologyFormProps {
  editingMethodology: Methodology | null;
  allMethodologies: Methodology[];
  onSave: (methodologies: Methodology[]) => void;
  onUpdate?: (methodologies: Methodology[]) => void;
  onCancel: () => void;
  onAutoSavingChange?: (isSaving: boolean) => void;
}

export const MethodologyForm = ({
  editingMethodology,
  allMethodologies,
  onSave,
  onUpdate,
  onCancel,
  onAutoSavingChange
}: MethodologyFormProps) => {
  const { activeProject, refreshProjects, setActiveProject } = useProject();
  const [formData, setFormData] = useState<Partial<Methodology>>({
    tese_central: '',
    mecanismo_primario: '',
    por_que_funciona: '',
    erro_invisivel: '',
    diferenciacao: '',
    principios_fundamentos: '',
    etapas_metodo: '',
    transformacao_real: '',
    prova_funcionamento: ''
  });
  const [identification, setIdentification] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Estado para indicar salvamento em progresso
  const [methodologyCreated, setMethodologyCreated] = useState(false);
  
  // Estado local para metodologia recém-criada (resolve bug de auto-save não funcionar)
  const [localMethodology, setLocalMethodology] = useState<Methodology | null>(null);

  const MIN_CHARS = 50;

  // Refs para valores usados no cleanup (evita problemas de closure)
  const mountedRef = useRef(true);
  const methodologyRef = useRef(editingMethodology);
  const localMethodologyRef = useRef(localMethodology);
  const methodologyCreatedRef = useRef(methodologyCreated);
  const formDataRef = useRef(formData);
  const identificationRef = useRef(identification);
  const autoSaveRef = useRef<() => Promise<void>>();
  const allMethodologiesRef = useRef(allMethodologies);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Load draft from localStorage or edit existing
  useEffect(() => {
    if (editingMethodology) {
      setFormData(editingMethodology);
      setIdentification(editingMethodology.name);
      setMethodologyCreated(true);
      setLocalMethodology(editingMethodology); // Sincronizar com localMethodology

      // Merge per-methodology draft if exists (survives tab switches)
      try {
        const perMethodologyDraft = localStorage.getItem(`methodology-draft-${editingMethodology.id}`);
        if (perMethodologyDraft) {
          const parsed = JSON.parse(perMethodologyDraft);
          if (parsed?.formData) setFormData({ ...editingMethodology, ...parsed.formData });
          if (parsed?.identification) setIdentification(parsed.identification);
        }
      } catch (e) {
        console.error('Error loading per-methodology draft:', e);
      }
    } else {
      const draft = localStorage.getItem('methodology-draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setFormData(parsed);
        } catch (e) {
          console.error('Error loading draft:', e);
        }
      }
    }
  }, [editingMethodology]);

  // Save draft to localStorage
  useEffect(() => {
    if (!editingMethodology && Object.values(formData).some(v => v !== '')) {
      localStorage.setItem('methodology-draft', JSON.stringify(formData));
    }
  }, [formData, editingMethodology]);

  // Manter refs atualizados para uso no cleanup
  useEffect(() => { methodologyRef.current = editingMethodology; }, [editingMethodology]);
  useEffect(() => { localMethodologyRef.current = localMethodology; }, [localMethodology]);
  useEffect(() => { methodologyCreatedRef.current = methodologyCreated; }, [methodologyCreated]);
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { identificationRef.current = identification; }, [identification]);
  useEffect(() => { allMethodologiesRef.current = allMethodologies; }, [allMethodologies]);

  // Flush auto-save on unmount - APENAS no unmount real
  useEffect(() => {
    return () => {
      const currentMethodology = methodologyRef.current || localMethodologyRef.current;
      if (currentMethodology && methodologyCreatedRef.current) {
        // Salvar draft no localStorage como backup
        try {
          localStorage.setItem(
            `methodology-draft-${currentMethodology.id}`,
            JSON.stringify({
              formData: formDataRef.current,
              identification: identificationRef.current,
              timestamp: Date.now()
            })
          );
          console.log('🔒 Backup salvo no localStorage');
        } catch (e) {
          console.error('Erro ao salvar draft no unmount:', e);
        }
        // Fire-and-forget save via ref
        autoSaveRef.current?.();
      }
    };
  }, []); // Array vazio = executa apenas no unmount real

  // Auto-save to database - Silencioso, sem refresh da página
  const autoSaveToDatabase = useCallback(async () => {
    const currentMethodology = editingMethodology || localMethodology;
    if (!activeProject || !methodologyCreated || !currentMethodology) return;

    if (mountedRef.current) {
      setAutoSaving(true);
      onAutoSavingChange?.(true);
    }

    try {
      const updatedMethodology: Methodology = {
        ...currentMethodology,
        ...formData,
        name: identification || currentMethodology.name
      } as Methodology;

      const updatedMethodologies = allMethodologies.map(m => 
        m.id === currentMethodology.id ? updatedMethodology : m
      );

      const { error } = await supabase
        .from('projects')
        .update({ methodology: updatedMethodologies as any })
        .eq('id', activeProject.id);

      if (error) throw error;

      // Atualizar o estado local sem perder foco
      onUpdate?.(updatedMethodologies);

      // Atualizar o contexto do projeto para manter sincronização entre abas
      if (activeProject) {
        setActiveProject({ ...activeProject, methodology: updatedMethodologies as any });
      }

      // Save per-methodology draft
      if (currentMethodology) {
        localStorage.setItem(`methodology-draft-${currentMethodology.id}`, JSON.stringify({
          formData,
          identification,
          timestamp: Date.now()
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
  }, [activeProject, methodologyCreated, editingMethodology, localMethodology, formData, identification, allMethodologies, onUpdate, onAutoSavingChange, setActiveProject]);

  // Manter autoSaveRef atualizado
  useEffect(() => { autoSaveRef.current = autoSaveToDatabase; }, [autoSaveToDatabase]);

  // Trigger auto-save com debounce de 3 segundos
  useEffect(() => {
    const currentMethodology = editingMethodology || localMethodology;
    if (currentMethodology && methodologyCreated) {
      const timer = setTimeout(() => {
        autoSaveToDatabase();
      }, 3000); // Aumentado para 3 segundos para melhor UX

      return () => clearTimeout(timer);
    }
  }, [formData, identification, editingMethodology, localMethodology, methodologyCreated, autoSaveToDatabase]);

  const handleCreateMethodology = async () => {
    if (!identification.trim()) {
      toast.error('Digite o nome da metodologia primeiro');
      return;
    }

    if (!activeProject) {
      toast.error('Projeto não encontrado');
      return;
    }

    try {
      const newMethodology: Methodology = {
        id: `method_${Date.now()}`,
        name: identification,
        tese_central: '',
        mecanismo_primario: '',
        por_que_funciona: '',
        erro_invisivel: '',
        diferenciacao: '',
        principios_fundamentos: '',
        etapas_metodo: '',
        transformacao_real: '',
        prova_funcionamento: ''
      };

      const updatedMethodologies = [...allMethodologies, newMethodology];

      const { error } = await supabase
        .from('projects')
        .update({ methodology: updatedMethodologies as any })
        .eq('id', activeProject.id);

      if (error) throw error;

      // CRÍTICO: Atualizar contexto local IMEDIATAMENTE após sucesso
      setActiveProject({ ...activeProject, methodology: updatedMethodologies as any });
      
      // Salvar referência local para nova metodologia (resolve bug de auto-save)
      setLocalMethodology(newMethodology);
      setMethodologyCreated(true);
      localStorage.removeItem('methodology-draft');
      toast.success('Metodologia criada! Preencha os campos abaixo.');
    } catch (error) {
      console.error('Error creating methodology:', error);
      toast.error('Erro ao criar metodologia');
    }
  };

  const handleInputChange = (field: keyof Methodology, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // CORREÇÃO: Função "Salvar e Fechar" que realmente salva antes de fechar
  const handleSaveAndClose = async () => {
    if (!activeProject) {
      onCancel();
      return;
    }

    const currentMethodology = editingMethodology || localMethodology;
    if (!currentMethodology || !methodologyCreated) {
      onCancel();
      return;
    }

    setIsSaving(true);

    try {
      // CRÍTICO: Salvar dados ANTES de fechar
      const updatedMethodology: Methodology = {
        ...currentMethodology,
        ...formData,
        name: identification || currentMethodology.name
      } as Methodology;

      const updatedMethodologies = allMethodologies.map(m => 
        m.id === currentMethodology.id ? updatedMethodology : m
      );

      const { error } = await supabase
        .from('projects')
        .update({ methodology: updatedMethodologies as any })
        .eq('id', activeProject.id);

      if (error) throw error;

      // Atualizar contexto
      setActiveProject({ ...activeProject, methodology: updatedMethodologies as any });
      onUpdate?.(updatedMethodologies);

      // Limpar drafts
      localStorage.removeItem('methodology-draft');
      localStorage.removeItem(`methodology-draft-${currentMethodology.id}`);

      toast.success('Metodologia salva com sucesso!');
      onCancel();
    } catch (error) {
      console.error('Erro ao salvar metodologia:', error);
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // CORREÇÃO: Função "Concluir Metodologia" que salva antes de finalizar
  const handleFinish = async () => {
    if (!activeProject || !methodologyCreated) return;

    const currentMethodology = editingMethodology || localMethodology;
    if (!currentMethodology) return;

    setIsSaving(true);

    try {
      // CRÍTICO: Salvar dados ANTES de qualquer outra operação
      const updatedMethodology: Methodology = {
        ...currentMethodology,
        ...formData,
        name: identification || currentMethodology.name
      } as Methodology;

      const updatedMethodologies = allMethodologies.map(m => 
        m.id === currentMethodology.id ? updatedMethodology : m
      );

      const { error } = await supabase
        .from('projects')
        .update({ methodology: updatedMethodologies as any })
        .eq('id', activeProject.id);

      if (error) throw error;

      // Atualizar contexto local
      setActiveProject({ ...activeProject, methodology: updatedMethodologies as any });
      onUpdate?.(updatedMethodologies);

      // Limpar todos os drafts
      localStorage.removeItem('methodology-draft');
      localStorage.removeItem(`methodology-draft-${currentMethodology.id}`);

      toast.success('Metodologia concluída com sucesso!');
      onCancel();
    } catch (error) {
      console.error('Error finishing methodology:', error);
      toast.error('Erro ao salvar metodologia. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const allFieldsValid = 
    (formData.tese_central?.length || 0) >= MIN_CHARS &&
    (formData.mecanismo_primario?.length || 0) >= MIN_CHARS &&
    (formData.por_que_funciona?.length || 0) >= MIN_CHARS &&
    (formData.erro_invisivel?.length || 0) >= MIN_CHARS &&
    (formData.diferenciacao?.length || 0) >= MIN_CHARS &&
    (formData.principios_fundamentos?.length || 0) >= MIN_CHARS &&
    (formData.etapas_metodo?.length || 0) >= MIN_CHARS &&
    (formData.transformacao_real?.length || 0) >= MIN_CHARS &&
    (formData.prova_funcionamento?.length || 0) >= MIN_CHARS;

  const tooltips = {
    central_thesis: "A ideia-mãe do seu método. A frase que explica 'o porquê' da transformação acontecer. Ex: 'Você não engorda porque come muito, mas porque seu corpo perdeu sensibilidade à saciedade.'",
    primary_mechanism: "O motor interno da sua solução. Como a mudança realmente acontece. Ex: Reprogramação de padrões, Ajuste hormonal, Treinamento neurocomportamental.",
    how_it_works: "A explicação técnica de forma simples. O que acontece no corpo, mente, comportamento, negócio ou processo para gerar a transformação.",
    invisible_error: "O erro que mantém a pessoa presa no problema e que ela não percebe. Ex: 'Você não vende pouco por falta de estratégia, mas por excesso de ruído mental.'",
    differentiation: "Por que seu método funciona quando outros falham? Qual variável você enxerga que os outros ignoram? Qual é sua alavanca única?",
    principles: "Base científica ou teórica do método: neurociência, psicologia, biologia, frameworks próprios, experiência clínica, análise de dados, etc.",
    stages: "Processo claro com etapas, sequência e por que a ordem importa. O que acontece em cada fase da transformação.",
    transformation: "O antes e depois verdadeiro: mental, emocional, técnico, financeiro, comportamental, relacional, físico ou operacional.",
    proof: "Evidências: princípios científicos, experiência prévia, validação psicológica, lógica operacional, estudos, testes iniciais, exemplos práticos."
  };

  const fields = [
    {
      id: 'tese_central',
      label: '1. Tese Central',
      tooltip: tooltips.central_thesis,
      placeholder: 'Digite ou grave a tese central...'
    },
    {
      id: 'mecanismo_primario',
      label: '2. Mecanismo Primário',
      tooltip: tooltips.primary_mechanism,
      placeholder: 'Digite ou grave o mecanismo primário...'
    },
    {
      id: 'por_que_funciona',
      label: '3. Por que Funciona',
      tooltip: tooltips.how_it_works,
      placeholder: 'Digite ou grave por que funciona...'
    },
    {
      id: 'erro_invisivel',
      label: '4. Erro Invisível',
      tooltip: tooltips.invisible_error,
      placeholder: 'Digite ou grave o erro invisível...'
    },
    {
      id: 'diferenciacao',
      label: '5. Diferenciação',
      tooltip: tooltips.differentiation,
      placeholder: 'Digite ou grave a diferenciação...'
    },
    {
      id: 'principios_fundamentos',
      label: '6. Princípios/Fundamentos',
      tooltip: tooltips.principles,
      placeholder: 'Digite ou grave os princípios...'
    },
    {
      id: 'etapas_metodo',
      label: '7. Etapas do Método',
      tooltip: tooltips.stages,
      placeholder: 'Digite ou grave as etapas...'
    },
    {
      id: 'transformacao_real',
      label: '8. Transformação Real',
      tooltip: tooltips.transformation,
      placeholder: 'Digite ou grave a transformação...'
    },
    {
      id: 'prova_funcionamento',
      label: '9. Prova de Funcionamento',
      tooltip: tooltips.proof,
      placeholder: 'Digite ou grave as provas...'
    }
  ];

  const getCharCount = (fieldId: string) => {
    return (formData[fieldId as keyof typeof formData] as string || '').length;
  };

  if (!methodologyCreated) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-8">
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold">Nome da Metodologia *</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha um nome que identifique claramente esta metodologia
            </p>
          </div>
          <div className="flex gap-3">
            <Input
              value={identification}
              onChange={(e) => setIdentification(e.target.value)}
              placeholder="Ex: Método de Emagrecimento Intuitivo"
              className="placeholder:text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && identification.trim()) {
                  handleCreateMethodology();
                }
              }}
            />
            <Button onClick={handleCreateMethodology} disabled={!identification.trim()} size="lg">
              Criar Metodologia
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-3xl mx-auto space-y-8 pb-8">
        {/* Identificação */}
        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold">Nome da Metodologia *</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {autoSaving ? 'Salvando automaticamente...' : 'As alterações são salvas automaticamente'}
            </p>
          </div>
          <Input
            value={identification}
            disabled
            className="bg-muted"
          />
        </div>

        {/* Form fields */}
        <div className="space-y-8">
          {/* Card único com todos os campos */}
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-6">
            {fields.map((field, index) => {
              const charCount = getCharCount(field.id);
              const isValid = charCount >= MIN_CHARS;
              return (
                <div key={field.id}>
                  {index > 0 && <div className="border-t border-border mb-6" />}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-medium">{field.label}</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-muted-foreground hover:text-foreground">
                              <Info size={16} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-sm">
                            <p className="whitespace-pre-wrap text-sm">{field.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className={`text-xs font-medium ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                        {charCount}/{MIN_CHARS}
                      </span>
                    </div>
                    <div className="relative">
                      <Textarea
                        value={formData[field.id as keyof typeof formData] as string || ''}
                        onChange={(e) => handleInputChange(field.id as keyof Methodology, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        className="pr-12 resize-none"
                      />
                      <VoiceInput
                        onTranscript={(text) => setFormData(prev => ({
                          ...prev,
                          [field.id]: prev[field.id as keyof typeof prev] 
                            ? `${prev[field.id as keyof typeof prev]} ${text}` 
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
              onClick={handleSaveAndClose}
              disabled={isSaving}
              className="flex-1 h-11"
              size="lg"
            >
              {isSaving ? (
                <>
                  <CircleNotch size={18} className="animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar e Fechar'
              )}
            </Button>
            <Button 
              onClick={handleFinish} 
              disabled={!allFieldsValid || isSaving}
              className="flex-1 h-11"
              size="lg"
            >
              {isSaving ? (
                <>
                  <CircleNotch size={18} className="animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Concluir Metodologia'
              )}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};