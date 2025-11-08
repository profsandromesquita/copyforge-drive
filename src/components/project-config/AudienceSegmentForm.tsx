import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

interface AudienceSegmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: AudienceSegment | null;
  allSegments: AudienceSegment[];
  onSave: (segments: AudienceSegment[]) => void;
}

export const AudienceSegmentForm = ({ open, onOpenChange, segment, allSegments, onSave }: AudienceSegmentFormProps) => {
  const { activeProject, refreshProjects } = useProject();
  const [formData, setFormData] = useState<Partial<AudienceSegment>>({
    name: '', avatar: '', segment: '', current_situation: '', desired_result: '',
    awareness_level: 'unaware', objections: [], voice_tones: []
  });
  const [newObjection, setNewObjection] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (segment) {
      setFormData(segment);
    } else {
      setFormData({ name: '', avatar: '', segment: '', current_situation: '', desired_result: '', awareness_level: 'unaware', objections: [], voice_tones: [] });
    }
  }, [segment, open]);

  const toggleVoiceTone = (tone: string) => {
    setFormData(prev => ({
      ...prev,
      voice_tones: prev.voice_tones?.includes(tone)
        ? prev.voice_tones.filter(t => t !== tone)
        : [...(prev.voice_tones || []), tone]
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.avatar || !formData.segment || !formData.current_situation || !formData.desired_result) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const newSegment: AudienceSegment = { ...formData, id: segment?.id || `segment-${Date.now()}` } as AudienceSegment;
      const updatedSegments = segment ? allSegments.map(s => s.id === segment.id ? newSegment : s) : [...allSegments, newSegment];

      if (activeProject) {
        const { error } = await supabase.from('projects').update({ audience_segments: updatedSegments as any }).eq('id', activeProject.id);
        if (error) throw error;
        await refreshProjects();
        onSave(updatedSegments);
        toast.success('Segmento salvo!');
        onOpenChange(false);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{segment ? 'Editar' : 'Adicionar'} Segmento de Público</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div><Label>Nome do Público *</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Mulheres de 40-55 anos" className="placeholder:text-xs" /></div>
          <div><Label>Avatar/Persona *</Label><Input value={formData.avatar} onChange={e => setFormData({...formData, avatar: e.target.value})} placeholder="Ex: Maria, 45 anos, empresária, casada, 1 filho" className="placeholder:text-xs" /></div>
          <div><Label>Segmento/Nicho *</Label><Input value={formData.segment} onChange={e => setFormData({...formData, segment: e.target.value})} placeholder="Ex: Mulheres na menopausa com dificuldade para emagrecer" className="placeholder:text-xs" /></div>
          
          <div><Label>Situação atual *</Label>
            <div className="relative">
              <Textarea value={formData.current_situation} onChange={e => setFormData({...formData, current_situation: e.target.value})} placeholder="Ex: Está 15kg acima do peso, já tentou 5 dietas diferentes mas sempre volta a engordar" rows={2} className="pr-12 placeholder:text-xs" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, current_situation: formData.current_situation ? `${formData.current_situation} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>Resultado desejado *</Label>
            <div className="relative">
              <Textarea value={formData.desired_result} onChange={e => setFormData({...formData, desired_result: e.target.value})} placeholder="Ex: Perder 15kg de forma definitiva, ter mais energia e disposição" rows={2} className="pr-12 placeholder:text-xs" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, desired_result: formData.desired_result ? `${formData.desired_result} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>Nível de consciência</Label><Select value={formData.awareness_level} onValueChange={v => setFormData({...formData, awareness_level: v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AWARENESS_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Objeções</Label><div className="flex gap-2"><Input value={newObjection} onChange={e => setNewObjection(e.target.value)} placeholder="Ex: Não tenho força de vontade" className="placeholder:text-xs" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newObjection.trim()) { setFormData({...formData, objections: [...(formData.objections || []), newObjection.trim()]}); setNewObjection(''); } } }} /><Button type="button" size="icon" onClick={() => { if (newObjection.trim()) { setFormData({...formData, objections: [...(formData.objections || []), newObjection.trim()]}); setNewObjection(''); } }}><Plus size={20} /></Button></div>{formData.objections && formData.objections.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{formData.objections.map((obj, i) => <Badge key={i} variant="secondary">{obj}<button type="button" onClick={() => setFormData({...formData, objections: formData.objections?.filter((_, idx) => idx !== i)})} className="ml-2"><X size={14} /></button></Badge>)}</div>}</div>
          
          <div>
            <Label className="text-sm font-medium">Tom de voz da comunicação</Label>
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
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
