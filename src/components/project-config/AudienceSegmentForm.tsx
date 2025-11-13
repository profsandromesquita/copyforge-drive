import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { VoiceInput } from './VoiceInput';
import { AudienceSegment } from '@/types/project-config';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';

interface AudienceSegmentFormProps {
  segment: AudienceSegment | null;
  allSegments: AudienceSegment[];
  onSave: (segments: AudienceSegment[]) => void;
  onCancel: () => void;
  onAutoSavingChange?: (isSaving: boolean) => void;
}

export const AudienceSegmentForm = ({ 
  segment, 
  allSegments, 
  onSave, 
  onCancel, 
  onAutoSavingChange 
}: AudienceSegmentFormProps) => {
  const { activeProject, refreshProjects } = useProject();
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

  const STORAGE_KEY = `audience-segment-draft-${activeProject?.id}`;
  const MIN_CHARS = 50;

  useEffect(() => {
    if (!segment) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Erro ao carregar rascunho:', e);
        }
      }
    }
  }, [STORAGE_KEY, segment]);

  useEffect(() => {
    if (!segment && Object.values(formData).some(v => v)) {
      const timer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, segment, STORAGE_KEY]);

  const autoSaveToDatabase = useCallback(async () => {
    if (!identification || !activeProject || !segmentCreated) return;

    setAutoSaving(true);
    onAutoSavingChange?.(true);
    try {
      const segmentId = identification;
      const newSegment: AudienceSegment = { ...formData, id: segmentId } as AudienceSegment;

      // Verificar se o segmento já existe no array usando o identification como ID
      const existingSegmentIndex = allSegments.findIndex(s => s.id === segmentId);
      
      let updatedSegments: AudienceSegment[];
      if (existingSegmentIndex >= 0) {
        // Atualizar segmento existente
        updatedSegments = allSegments.map(s => 
          s.id === segmentId ? newSegment : s
        );
      } else {
        // Isso não deveria acontecer porque handleCreateSegment já adiciona
        // mas mantemos como fallback
        updatedSegments = [...allSegments, newSegment];
      }

      await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject.id);

      await refreshProjects();
    } catch (error) {
      console.error('Erro no auto-save:', error);
    } finally {
      setAutoSaving(false);
      onAutoSavingChange?.(false);
    }
  }, [identification, formData, activeProject, allSegments, refreshProjects, onAutoSavingChange, segmentCreated]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (identification && segmentCreated) {
        autoSaveToDatabase();
      }
    }, 2000);
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
        localStorage.removeItem(STORAGE_KEY);
      }
      
      toast.success('Segmento concluído!');
      
      // Fechar o formulário e atualizar a lista
      onSave(updatedSegments);
    } catch (error) {
      console.error('Erro ao concluir segmento:', error);
      toast.error('Erro ao concluir segmento');
    }
  };

  const handleClose = () => {
    // Salvar antes de fechar se houver dados
    if (identification && segmentCreated && Object.values(formData).some(v => v)) {
      autoSaveToDatabase();
    }
    
    if (!segment) {
      localStorage.removeItem(STORAGE_KEY);
    }
    
    // Aguardar um pouco para garantir que o save foi concluído
    setTimeout(() => {
      onCancel();
    }, 500);
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
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-6 shadow-sm">
        <div className="space-y-2 pb-4 border-b border-border">
          <Label htmlFor="identification" className="text-sm font-medium flex items-center gap-1">
            Identificação do Público <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="identification"
              value={identification}
              onChange={(e) => setIdentification(e.target.value)}
              placeholder="Ex: Profissionais TI | Mães Empreendedoras | Gestores"
              className="text-base font-medium placeholder:text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (!segmentCreated) {
                    handleCreateSegment();
                  } else if (identification !== originalId) {
                    handleUpdateIdentification();
                  }
                }
              }}
            />
            {!segmentCreated ? (
              <Button 
                onClick={handleCreateSegment}
                disabled={!identification}
                className="shrink-0"
              >
                Criar Segmento
              </Button>
            ) : identification !== originalId && (
              <Button 
                onClick={handleUpdateIdentification}
                disabled={!identification}
                className="shrink-0"
              >
                Atualizar
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {segmentCreated 
              ? '✓ Segmento criado! Os campos abaixo salvam automaticamente.'
              : 'Digite um nome e clique em "Criar Segmento" para começar'
            }
          </p>
        </div>

        {segmentCreated && (
          <>
            {questions.map((question) => {
              const charCount = getCharCount(question.id);
              const isValid = charCount >= MIN_CHARS;
              return (
                <div key={question.id} className="space-y-2">
                  <Label htmlFor={question.id} className="text-sm font-medium">
                    {question.label}
                  </Label>
                  <div className="relative">
                    <Textarea
                      id={question.id}
                      value={formData[question.id as keyof typeof formData] as string || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [question.id]: e.target.value }))}
                      placeholder={question.placeholder}
                      className="min-h-[100px] resize-none pr-12"
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
                  <span className={`text-xs ${isValid ? 'text-primary' : 'text-muted-foreground'}`}>
                    {charCount}/{MIN_CHARS} caracteres mínimos
                  </span>
                </div>
              );
            })}

            {!formData.is_completed && (
              <div className="pt-4 border-t border-border">
                <Button 
                  onClick={handleComplete}
                  disabled={!isAllFieldsFilled()}
                  className="w-full"
                  size="lg"
                >
                  Concluir Preenchimento
                </Button>
                {!isAllFieldsFilled() && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Preencha todos os campos com no mínimo {MIN_CHARS} caracteres para concluir
                  </p>
                )}
              </div>
            )}

            {formData.is_completed && (
              <div className="pt-4 border-t border-border bg-primary/5 rounded-lg p-4">
                <p className="text-sm text-center font-medium text-primary">
                  ✓ Preenchimento concluído! Agora você pode gerar a análise avançada IA.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-border">
        <Button variant="outline" onClick={handleClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
};
