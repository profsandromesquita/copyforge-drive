import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { VoiceInput } from './VoiceInput';
import { AudienceSegment } from '@/types/project-config';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/hooks/useProject';
import { useWorkspace } from '@/hooks/useWorkspace';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
  const { activeWorkspace } = useWorkspace();
  const [formData, setFormData] = useState<Partial<AudienceSegment>>({
    id: '',
    who_is: '',
    biggest_desire: '',
    biggest_pain: '',
    failed_attempts: '',
    beliefs: '',
    behavior: '',
    journey: '',
    ...segment
  });
  const [identification, setIdentification] = useState(segment?.id || '');
  const [autoSaving, setAutoSaving] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);

  const STORAGE_KEY = `audience-segment-draft-${activeProject?.id}`;

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
    if (!formData.who_is || !activeProject) return;

    setAutoSaving(true);
    onAutoSavingChange?.(true);
    try {
      const segmentId = segment?.id || `segment-${Date.now()}`;
      const newSegment: AudienceSegment = { ...formData, id: segmentId } as AudienceSegment;

      const updatedSegments = segment
        ? allSegments.map(s => s.id === segment.id ? newSegment : s)
        : [...allSegments, newSegment];

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
  }, [formData, activeProject, segment, allSegments, refreshProjects, onAutoSavingChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.who_is) {
        autoSaveToDatabase();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [formData, autoSaveToDatabase]);

  const handleFinish = async () => {
    if (!isFormValid) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!activeProject || !activeWorkspace) {
      toast.error('Projeto ou workspace não encontrado');
      return;
    }

    setIsGeneratingAnalysis(true);
    try {
      const segmentId = identification || segment?.id || `segment-${Date.now()}`;
      const newSegment: AudienceSegment = { ...formData, id: segmentId } as AudienceSegment;

      // Gerar análise avançada via IA
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-audience', {
        body: { 
          segment: newSegment,
          workspace_id: activeWorkspace.id 
        }
      });

      if (analysisError) throw analysisError;

      // Adicionar análise ao segmento
      newSegment.advanced_analysis = analysisData.analysis;
      newSegment.analysis_generated_at = new Date().toISOString();

      const updatedSegments = segment
        ? allSegments.map(s => s.id === segment.id ? newSegment : s)
        : [...allSegments, newSegment];

      await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject.id);

      await refreshProjects();
      localStorage.removeItem(STORAGE_KEY);
      
      onSave(updatedSegments);
      toast.success('Segmento criado e análise gerada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao finalizar segmento:', error);
      if (error.message?.includes('insufficient_credits')) {
        toast.error('Créditos insuficientes para gerar análise');
      } else {
        toast.error('Erro ao gerar análise avançada');
      }
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  const handleCancel = () => {
    if (!segment) {
      localStorage.removeItem(STORAGE_KEY);
    }
    onCancel();
  };

  const isFormValid = !!(
    identification &&
    formData.who_is &&
    formData.biggest_desire &&
    formData.biggest_pain &&
    formData.failed_attempts &&
    formData.beliefs &&
    formData.behavior &&
    formData.journey
  );

  const questions = [
    {
      id: 'who_is',
      label: '1. Quem é essa pessoa?',
      placeholder: 'Ex: Maria, 45 anos, empresária no digital, mãe de 2 filhos, mora em SP'
    },
    {
      id: 'biggest_desire',
      label: '2. O que essa pessoa mais quer?',
      placeholder: 'Ex: Ter mais tempo livre sem perder a renda, viajar com a família 3x por ano'
    },
    {
      id: 'biggest_pain',
      label: '3. O que mais dói pra ela hoje?',
      placeholder: 'Ex: Trabalha 12h por dia, não vê os filhos crescerem, está exausta e sem energia'
    },
    {
      id: 'failed_attempts',
      label: '4. O que ela já tentou e não deu certo?',
      placeholder: 'Ex: Contratar assistente virtual, fazer cursos de gestão de tempo, tentar delegar mas nada funcionou'
    },
    {
      id: 'beliefs',
      label: '5. O que ela acredita (ou repete)?',
      placeholder: 'Ex: "Só eu sei fazer direito", "Se eu parar, tudo desmorona", "Não posso confiar em ninguém"'
    },
    {
      id: 'behavior',
      label: '6. Como ela fala / se comporta?',
      placeholder: 'Ex: Fala rápido, sempre apressada, usa muito "eu preciso", está sempre no celular'
    },
    {
      id: 'journey',
      label: '7. Onde ela está e onde quer chegar?',
      placeholder: 'Ex: Está presa na operação → Quer ser estrategista e ter um negócio que funciona sem ela'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-6 shadow-sm">
        <div className="space-y-2 pb-4 border-b border-border">
          <Label htmlFor="identification" className="text-sm font-medium flex items-center gap-1">
            Identificação do Público <span className="text-destructive">*</span>
          </Label>
          <Input
            id="identification"
            value={identification}
            onChange={(e) => setIdentification(e.target.value)}
            placeholder="Ex: Mulheres 40-55 anos com dificuldade para emagrecer"
            className="text-base font-medium"
          />
          <p className="text-xs text-muted-foreground">
            Nome para identificar este segmento de público
          </p>
        </div>

        {questions.map((question) => (
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
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleCancel} disabled={isGeneratingAnalysis}>
          Cancelar
        </Button>
        <Button 
          onClick={handleFinish} 
          disabled={!isFormValid || isGeneratingAnalysis}
          className="min-w-[200px]"
        >
          {isGeneratingAnalysis ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando Análise IA...
            </>
          ) : (
            'Concluir Segmento'
          )}
        </Button>
      </div>
    </div>
  );
};
