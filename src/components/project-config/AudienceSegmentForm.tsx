import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X } from 'phosphor-react';
import { VoiceInput } from './VoiceInput';
import { AudienceSegment, AWARENESS_LEVELS, VOICE_TONES } from '@/types/project-config';
import { useProject } from '@/hooks/useProject';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface AudienceSegmentFormProps {
  segment: AudienceSegment | null;
  allSegments: AudienceSegment[];
  onSave: (segments: AudienceSegment[]) => void;
  onCancel: () => void;
}

export const AudienceSegmentForm = ({ segment, allSegments, onSave, onCancel }: AudienceSegmentFormProps) => {
  const { activeProject, refreshProjects } = useProject();
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState<Partial<AudienceSegment>>({
    name: '', avatar: '', segment: '', current_situation: '', desired_result: '',
    awareness_level: 'unaware', objections: [], voice_tones: []
  });
  const [newObjection, setNewObjection] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  // Carregar dados do localStorage ao montar
  useEffect(() => {
    const storageKey = segment ? `audience-segment-edit-${segment.id}` : 'audience-segment-new';
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      } catch (e) {
        console.error('Erro ao carregar dados salvos:', e);
      }
    } else if (segment) {
      setFormData(segment);
    }
  }, [segment]);

  // Auto-save no localStorage com debounce
  useEffect(() => {
    const storageKey = segment ? `audience-segment-edit-${segment.id}` : 'audience-segment-new';
    const timeoutId = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData, segment]);

  // Auto-save no banco após 3 segundos de inatividade
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      autoSaveToDatabase();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [formData]);

  const autoSaveToDatabase = useCallback(async () => {
    // Só faz auto-save se tiver pelo menos o nome preenchido
    if (!formData.name || !activeProject) return;

    setAutoSaving(true);
    try {
      const segmentId = segment?.id || `segment-${Date.now()}`;
      const newSegment: AudienceSegment = { ...formData, id: segmentId } as AudienceSegment;
      const updatedSegments = segment 
        ? allSegments.map(s => s.id === segment.id ? newSegment : s) 
        : [...allSegments, newSegment];

      const { error } = await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject.id);

      if (error) throw error;
      
      await refreshProjects();
      // Não chama onSave aqui para não fechar o formulário
    } catch (error) {
      console.error('Erro no auto-save:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [formData, activeProject, segment, allSegments, refreshProjects]);

  const toggleVoiceTone = (tone: string) => {
    setFormData(prev => ({
      ...prev,
      voice_tones: prev.voice_tones?.includes(tone)
        ? prev.voice_tones.filter(t => t !== tone)
        : [...(prev.voice_tones || []), tone]
    }));
  };

  const handleFinish = async () => {
    if (!formData.name || !formData.avatar || !formData.segment || !formData.current_situation || !formData.desired_result) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const segmentId = segment?.id || `segment-${Date.now()}`;
      const newSegment: AudienceSegment = { ...formData, id: segmentId } as AudienceSegment;
      const updatedSegments = segment 
        ? allSegments.map(s => s.id === segment.id ? newSegment : s) 
        : [...allSegments, newSegment];

      if (activeProject) {
        const { error } = await supabase
          .from('projects')
          .update({ audience_segments: updatedSegments as any })
          .eq('id', activeProject.id);

        if (error) throw error;
        
        await refreshProjects();
        onSave(updatedSegments);
        
        // Limpar localStorage
        const storageKey = segment ? `audience-segment-edit-${segment.id}` : 'audience-segment-new';
        localStorage.removeItem(storageKey);
        
        toast.success('Segmento salvo com sucesso!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const storageKey = segment ? `audience-segment-edit-${segment.id}` : 'audience-segment-new';
    localStorage.removeItem(storageKey);
    onCancel();
  };

  const isFormValid = formData.name && formData.avatar && formData.segment && 
                      formData.current_situation && formData.desired_result;

  return (
    <div className="space-y-6 animate-fade-in">
      {autoSaving && (
        <div className="bg-muted/50 border border-border rounded-lg p-2 text-center">
          <p className="text-xs text-muted-foreground">
            Salvando automaticamente...
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
              Identificação do público <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="name"
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="Ex: Mulheres 40-55 anos com dificuldade para emagrecer" 
              className="placeholder:text-xs" 
            />
          </div>

          <div>
            <Label htmlFor="avatar" className="text-sm font-medium flex items-center gap-1">
              Avatar/Persona <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="avatar"
              value={formData.avatar} 
              onChange={e => setFormData({...formData, avatar: e.target.value})} 
              placeholder="Ex: Maria, 45 anos, empresária, casada, 1 filho" 
              className="placeholder:text-xs" 
            />
          </div>

          <div>
            <Label htmlFor="segment" className="text-sm font-medium flex items-center gap-1">
              Segmento/Nicho <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="segment"
              value={formData.segment} 
              onChange={e => setFormData({...formData, segment: e.target.value})} 
              placeholder="Ex: Mulheres na menopausa com dificuldade para emagrecer" 
              className="placeholder:text-xs" 
            />
          </div>
          
          <div>
            <Label htmlFor="current_situation" className="text-sm font-medium flex items-center gap-1">
              Situação atual <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Textarea 
                id="current_situation"
                value={formData.current_situation} 
                onChange={e => setFormData({...formData, current_situation: e.target.value})} 
                placeholder="Ex: Está 15kg acima do peso, já tentou 5 dietas diferentes mas sempre volta a engordar" 
                rows={2} 
                className="pr-12 resize-none placeholder:text-xs" 
              />
              <VoiceInput 
                onTranscript={(text) => setFormData({
                  ...formData, 
                  current_situation: formData.current_situation ? `${formData.current_situation} ${text}` : text
                })} 
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="desired_result" className="text-sm font-medium flex items-center gap-1">
              Resultado desejado <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Textarea 
                id="desired_result"
                value={formData.desired_result} 
                onChange={e => setFormData({...formData, desired_result: e.target.value})} 
                placeholder="Ex: Perder 15kg de forma definitiva, ter mais energia e disposição" 
                rows={2} 
                className="pr-12 resize-none placeholder:text-xs" 
              />
              <VoiceInput 
                onTranscript={(text) => setFormData({
                  ...formData, 
                  desired_result: formData.desired_result ? `${formData.desired_result} ${text}` : text
                })} 
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="awareness_level" className="text-sm font-medium">
              Nível de consciência
              <span className="text-muted-foreground ml-1 text-xs">(opcional)</span>
            </Label>
            <Select 
              value={formData.awareness_level} 
              onValueChange={v => setFormData({...formData, awareness_level: v as any})}
            >
              <SelectTrigger id="awareness_level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AWARENESS_LEVELS.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">
              Objeções
              <span className="text-muted-foreground ml-1 text-xs">(opcional)</span>
            </Label>
            <div className="flex gap-2">
              <Input 
                value={newObjection} 
                onChange={e => setNewObjection(e.target.value)} 
                placeholder="Ex: Não tenho força de vontade" 
                className="placeholder:text-xs" 
                onKeyDown={e => { 
                  if (e.key === 'Enter') { 
                    e.preventDefault(); 
                    if (newObjection.trim()) { 
                      setFormData({...formData, objections: [...(formData.objections || []), newObjection.trim()]}); 
                      setNewObjection(''); 
                    } 
                  } 
                }} 
              />
              <Button 
                type="button" 
                size="icon" 
                onClick={() => { 
                  if (newObjection.trim()) { 
                    setFormData({...formData, objections: [...(formData.objections || []), newObjection.trim()]}); 
                    setNewObjection(''); 
                  } 
                }}
              >
                <Plus size={20} />
              </Button>
            </div>
            {formData.objections && formData.objections.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.objections.map((obj, i) => (
                  <Badge key={i} variant="secondary">
                    {obj}
                    <button 
                      type="button" 
                      onClick={() => setFormData({
                        ...formData, 
                        objections: formData.objections?.filter((_, idx) => idx !== i)
                      })} 
                      className="ml-2"
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <Label className="text-sm font-medium">
              Tom de voz da comunicação
              <span className="text-muted-foreground ml-1 text-xs">(opcional)</span>
            </Label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {VOICE_TONES.map((tone) => (
                <label
                  key={tone}
                  htmlFor={`segment-tone-${tone}`}
                  className={cn(
                    "flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50",
                    formData.voice_tones?.includes(tone)
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-background"
                  )}
                >
                  <Checkbox
                    id={`segment-tone-${tone}`}
                    checked={formData.voice_tones?.includes(tone)}
                    onCheckedChange={() => toggleVoiceTone(tone)}
                    className="pointer-events-none flex-shrink-0"
                  />
                  <span className="text-xs md:text-sm font-medium leading-tight">{tone}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={cn(
          "flex gap-2 pt-4",
          isMobile && "hidden"
        )}>
          <Button 
            type="button"
            onClick={handleFinish} 
            disabled={saving || !isFormValid}
            className="min-w-[140px] shadow-sm"
          >
            {saving ? 'Salvando...' : 'Concluir Segmento'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
          >
            Cancelar
          </Button>
        </div>
      </div>

      {/* Botão fixo no rodapé mobile */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg animate-slide-in-bottom z-50">
          <div className="flex gap-2">
            <Button 
              type="button"
              onClick={handleFinish} 
              disabled={saving || !isFormValid}
              className="flex-1 h-12 text-base font-medium shadow-md"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Salvando...
                </span>
              ) : (
                'Concluir Segmento'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              className="h-12"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
