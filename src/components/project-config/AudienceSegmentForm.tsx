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
    ...segment
  });
  const [identification, setIdentification] = useState(segment?.id || '');
  const [autoSaving, setAutoSaving] = useState(false);
  const [segmentCreated, setSegmentCreated] = useState(!!segment);

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
    if (!identification || !activeProject || !segmentCreated) return;

    setAutoSaving(true);
    onAutoSavingChange?.(true);
    try {
      const segmentId = identification || segment?.id || `segment-${Date.now()}`;
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
  }, [identification, formData, activeProject, segment, allSegments, refreshProjects, onAutoSavingChange, segmentCreated]);

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

    try {
      const segmentId = identification;
      const newSegment: AudienceSegment = { 
        ...formData, 
        id: segmentId 
      } as AudienceSegment;

      const updatedSegments = [...allSegments, newSegment];

      await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject.id);

      await refreshProjects();
      setSegmentCreated(true);
      toast.success('Segmento criado! Agora preencha os campos abaixo.');
    } catch (error) {
      console.error('Erro ao criar segmento:', error);
      toast.error('Erro ao criar segmento');
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
          <div className="flex gap-2">
            <Input
              id="identification"
              value={identification}
              onChange={(e) => setIdentification(e.target.value)}
              placeholder="Ex: Mulheres 40-55 anos com dificuldade para emagrecer"
              className="text-base font-medium placeholder:text-sm"
              disabled={segmentCreated}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !segmentCreated) {
                  handleCreateSegment();
                }
              }}
            />
            {!segmentCreated && (
              <Button 
                onClick={handleCreateSegment}
                disabled={!identification}
                className="shrink-0"
              >
                Criar Segmento
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
