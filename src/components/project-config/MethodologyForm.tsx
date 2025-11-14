import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VoiceInput } from './VoiceInput';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, CheckCircle, Circle } from 'phosphor-react';
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
  const { activeProject, refreshProjects } = useProject();
  const [formData, setFormData] = useState<Partial<Methodology>>({
    name: '',
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
  const [methodologyCreated, setMethodologyCreated] = useState(false);

  const MIN_CHARS = 50;

  // Load draft from localStorage or edit existing
  useEffect(() => {
    if (editingMethodology) {
      setFormData(editingMethodology);
      setIdentification(editingMethodology.name);
      setMethodologyCreated(true);
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

  // Auto-save to database
  const autoSaveToDatabase = useCallback(async () => {
    if (!activeProject || !methodologyCreated || !editingMethodology) return;

    setAutoSaving(true);
    onAutoSavingChange?.(true);

    try {
      const updatedMethodology: Methodology = {
        ...editingMethodology,
        ...formData,
        name: identification || editingMethodology.name
      } as Methodology;

      const updatedMethodologies = allMethodologies.map(m => 
        m.id === editingMethodology.id ? updatedMethodology : m
      );

      await supabase
        .from('projects')
        .update({ methodology: updatedMethodologies as any })
        .eq('id', activeProject.id);

      await refreshProjects();
      onUpdate?.(updatedMethodologies);
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setAutoSaving(false);
      onAutoSavingChange?.(false);
    }
  }, [activeProject, methodologyCreated, editingMethodology, formData, identification, allMethodologies, refreshProjects, onUpdate, onAutoSavingChange]);

  // Trigger auto-save periodically when editing
  useEffect(() => {
    if (editingMethodology && methodologyCreated) {
      const timer = setTimeout(() => {
        autoSaveToDatabase();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [formData, identification, editingMethodology, methodologyCreated, autoSaveToDatabase]);

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

      await supabase
        .from('projects')
        .update({ methodology: updatedMethodologies as any })
        .eq('id', activeProject.id);

      await refreshProjects();
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

  const handleFinish = async () => {
    if (!activeProject || !methodologyCreated) return;

    try {
      await refreshProjects();
      localStorage.removeItem('methodology-draft');
      toast.success('Metodologia salva com sucesso!');
      onCancel();
    } catch (error) {
      console.error('Error finishing:', error);
      toast.error('Erro ao finalizar');
    }
  };

  const isFieldValid = (value: string) => {
    return value.length >= MIN_CHARS;
  };

  const allFieldsValid = 
    isFieldValid(formData.tese_central || '') &&
    isFieldValid(formData.mecanismo_primario || '') &&
    isFieldValid(formData.por_que_funciona || '') &&
    isFieldValid(formData.erro_invisivel || '') &&
    isFieldValid(formData.diferenciacao || '') &&
    isFieldValid(formData.principios_fundamentos || '') &&
    isFieldValid(formData.etapas_metodo || '') &&
    isFieldValid(formData.transformacao_real || '') &&
    isFieldValid(formData.prova_funcionamento || '');

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

  if (!methodologyCreated) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Nova Metodologia</h2>
          <p className="text-sm text-muted-foreground">
            Digite o nome da sua metodologia para começar
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="identification">Nome da Metodologia</Label>
            <Input
              id="identification"
              value={identification}
              onChange={(e) => setIdentification(e.target.value)}
              placeholder="Ex: Método de Emagrecimento Intuitivo"
              className="mt-2"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreateMethodology} disabled={!identification.trim()}>
              Criar Metodologia
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{identification || 'Editar Metodologia'}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {autoSaving ? 'Salvando automaticamente...' : 'As alterações são salvas automaticamente'}
            </p>
          </div>
          {allFieldsValid && (
            <Button onClick={handleFinish}>
              Concluir
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Tese Central */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Tese Central</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm">
                  <p className="whitespace-pre-wrap text-sm">{tooltips.central_thesis}</p>
                </TooltipContent>
              </Tooltip>
              {isFieldValid(formData.tese_central || '') ? (
                <CheckCircle size={16} className="text-green-500" weight="fill" />
              ) : (
                <Circle size={16} className="text-muted-foreground" />
              )}
            </div>
            <VoiceInput
              value={formData.tese_central || ''}
              onChange={(value) => handleInputChange('tese_central', value)}
              placeholder="Digite ou grave a tese central..."
              minHeight="100px"
            />
            <p className="text-xs text-muted-foreground">
              {formData.tese_central?.length || 0} / {MIN_CHARS} caracteres mínimos
            </p>
          </div>

          {/* Mecanismo Primário */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Mecanismo Primário</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm">
                  <p className="whitespace-pre-wrap text-sm">{tooltips.primary_mechanism}</p>
                </TooltipContent>
              </Tooltip>
              {isFieldValid(formData.primary_mechanism || '') ? (
                <CheckCircle size={16} className="text-green-500" weight="fill" />
              ) : (
                <Circle size={16} className="text-muted-foreground" />
              )}
            </div>
            <VoiceInput
              value={formData.primary_mechanism || ''}
              onChange={(value) => handleInputChange('primary_mechanism', value)}
              placeholder="Digite ou grave o mecanismo primário..."
              minHeight="100px"
            />
            <p className="text-xs text-muted-foreground">
              {formData.primary_mechanism?.length || 0} / {MIN_CHARS} caracteres mínimos
            </p>
          </div>

          {/* Por que Funciona */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Por que Funciona</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm">
                  <p className="whitespace-pre-wrap text-sm">{tooltips.how_it_works}</p>
                </TooltipContent>
              </Tooltip>
              {isFieldValid(formData.how_it_works || '') ? (
                <CheckCircle size={16} className="text-green-500" weight="fill" />
              ) : (
                <Circle size={16} className="text-muted-foreground" />
              )}
            </div>
            <VoiceInput
              value={formData.how_it_works || ''}
              onChange={(value) => handleInputChange('how_it_works', value)}
              placeholder="Digite ou grave por que funciona..."
              minHeight="100px"
            />
            <p className="text-xs text-muted-foreground">
              {formData.how_it_works?.length || 0} / {MIN_CHARS} caracteres mínimos
            </p>
          </div>

          {/* Erro Invisível */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Erro Invisível</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm">
                  <p className="whitespace-pre-wrap text-sm">{tooltips.invisible_error}</p>
                </TooltipContent>
              </Tooltip>
              {isFieldValid(formData.invisible_error || '') ? (
                <CheckCircle size={16} className="text-green-500" weight="fill" />
              ) : (
                <Circle size={16} className="text-muted-foreground" />
              )}
            </div>
            <VoiceInput
              value={formData.invisible_error || ''}
              onChange={(value) => handleInputChange('invisible_error', value)}
              placeholder="Digite ou grave o erro invisível..."
              minHeight="100px"
            />
            <p className="text-xs text-muted-foreground">
              {formData.invisible_error?.length || 0} / {MIN_CHARS} caracteres mínimos
            </p>
          </div>

          {/* Diferenciação */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Diferenciação</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm">
                  <p className="whitespace-pre-wrap text-sm">{tooltips.differentiation}</p>
                </TooltipContent>
              </Tooltip>
              {isFieldValid(formData.differentiation || '') ? (
                <CheckCircle size={16} className="text-green-500" weight="fill" />
              ) : (
                <Circle size={16} className="text-muted-foreground" />
              )}
            </div>
            <VoiceInput
              value={formData.differentiation || ''}
              onChange={(value) => handleInputChange('differentiation', value)}
              placeholder="Digite ou grave a diferenciação..."
              minHeight="100px"
            />
            <p className="text-xs text-muted-foreground">
              {formData.differentiation?.length || 0} / {MIN_CHARS} caracteres mínimos
            </p>
          </div>

          {/* Princípios/Fundamentos */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Princípios/Fundamentos</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm">
                  <p className="whitespace-pre-wrap text-sm">{tooltips.principles}</p>
                </TooltipContent>
              </Tooltip>
              {isFieldValid(formData.principles || '') ? (
                <CheckCircle size={16} className="text-green-500" weight="fill" />
              ) : (
                <Circle size={16} className="text-muted-foreground" />
              )}
            </div>
            <VoiceInput
              value={formData.principles || ''}
              onChange={(value) => handleInputChange('principles', value)}
              placeholder="Digite ou grave os princípios..."
              minHeight="100px"
            />
            <p className="text-xs text-muted-foreground">
              {formData.principles?.length || 0} / {MIN_CHARS} caracteres mínimos
            </p>
          </div>

          {/* Etapas do Método */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Etapas do Método</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm">
                  <p className="whitespace-pre-wrap text-sm">{tooltips.stages}</p>
                </TooltipContent>
              </Tooltip>
              {isFieldValid(formData.stages || '') ? (
                <CheckCircle size={16} className="text-green-500" weight="fill" />
              ) : (
                <Circle size={16} className="text-muted-foreground" />
              )}
            </div>
            <VoiceInput
              value={formData.stages || ''}
              onChange={(value) => handleInputChange('stages', value)}
              placeholder="Digite ou grave as etapas..."
              minHeight="100px"
            />
            <p className="text-xs text-muted-foreground">
              {formData.stages?.length || 0} / {MIN_CHARS} caracteres mínimos
            </p>
          </div>

          {/* Transformação Real */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Transformação Real</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm">
                  <p className="whitespace-pre-wrap text-sm">{tooltips.transformation}</p>
                </TooltipContent>
              </Tooltip>
              {isFieldValid(formData.transformation || '') ? (
                <CheckCircle size={16} className="text-green-500" weight="fill" />
              ) : (
                <Circle size={16} className="text-muted-foreground" />
              )}
            </div>
            <VoiceInput
              value={formData.transformation || ''}
              onChange={(value) => handleInputChange('transformation', value)}
              placeholder="Digite ou grave a transformação..."
              minHeight="100px"
            />
            <p className="text-xs text-muted-foreground">
              {formData.transformation?.length || 0} / {MIN_CHARS} caracteres mínimos
            </p>
          </div>

          {/* Prova de Funcionamento */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Prova de Funcionamento</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground">
                    <Info size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm">
                  <p className="whitespace-pre-wrap text-sm">{tooltips.proof}</p>
                </TooltipContent>
              </Tooltip>
              {isFieldValid(formData.proof || '') ? (
                <CheckCircle size={16} className="text-green-500" weight="fill" />
              ) : (
                <Circle size={16} className="text-muted-foreground" />
              )}
            </div>
            <VoiceInput
              value={formData.proof || ''}
              onChange={(value) => handleInputChange('proof', value)}
              placeholder="Digite ou grave as provas..."
              minHeight="100px"
            />
            <p className="text-xs text-muted-foreground">
              {formData.proof?.length || 0} / {MIN_CHARS} caracteres mínimos
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          {allFieldsValid ? (
            <Button onClick={handleFinish}>
              Concluir
            </Button>
          ) : (
            <Button disabled>
              Preencha todos os campos (mínimo {MIN_CHARS} caracteres cada)
            </Button>
          )}
          <Button variant="outline" onClick={onCancel}>
            Voltar
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};
