import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'phosphor-react';
import { VoiceInput } from './VoiceInput';
import { AudienceSegment, AWARENESS_LEVELS } from '@/types/project-config';
import { useProject } from '@/hooks/useProject';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    awareness_level: 'unaware', objections: [], communication_tone: ''
  });
  const [newObjection, setNewObjection] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (segment) {
      setFormData(segment);
    } else {
      setFormData({ name: '', avatar: '', segment: '', current_situation: '', desired_result: '', awareness_level: 'unaware', objections: [], communication_tone: '' });
    }
  }, [segment, open]);

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
          <div><Label>Nome do Público *</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Mulheres executivas entre 35-45 anos" /></div>
          <div><Label>Avatar/Persona *</Label><Input value={formData.avatar} onChange={e => setFormData({...formData, avatar: e.target.value})} placeholder="Ex: Carla, 38 anos, gerente de vendas, casada, 2 filhos, renda de R$ 12.000/mês" /></div>
          <div><Label>Segmento/Nicho *</Label><Input value={formData.segment} onChange={e => setFormData({...formData, segment: e.target.value})} placeholder="Ex: Profissionais corporativas que buscam equilibrar carreira e saúde" /></div>
          
          <div><Label>Situação atual *</Label>
            <div className="relative">
              <Textarea value={formData.current_situation} onChange={e => setFormData({...formData, current_situation: e.target.value})} placeholder="Ex: Passa 10+ horas por dia sentada no escritório, sofre com dores nas costas, ganhou 8kg no último ano, se sente sem energia e frustrada por não conseguir tempo para se exercitar. Já tentou academias tradicionais mas desistiu pela falta de tempo e rotina engessada." rows={3} className="pr-12" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, current_situation: formData.current_situation ? `${formData.current_situation} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>Resultado desejado *</Label>
            <div className="relative">
              <Textarea value={formData.desired_result} onChange={e => setFormData({...formData, desired_result: e.target.value})} placeholder="Ex: Eliminar as dores nas costas, perder 8kg de forma saudável, recuperar a energia e disposição, ter uma rotina de exercícios que se encaixe na sua agenda apertada, sentir-se bem consigo mesma e ter mais confiança." rows={3} className="pr-12" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, desired_result: formData.desired_result ? `${formData.desired_result} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>Nível de consciência</Label><Select value={formData.awareness_level} onValueChange={v => setFormData({...formData, awareness_level: v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AWARENESS_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Objeções</Label><div className="flex gap-2"><Input value={newObjection} onChange={e => setNewObjection(e.target.value)} placeholder="Ex: Não tenho tempo, é muito caro, tenho medo de me machucar..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newObjection.trim()) { setFormData({...formData, objections: [...(formData.objections || []), newObjection.trim()]}); setNewObjection(''); } } }} /><Button type="button" size="icon" onClick={() => { if (newObjection.trim()) { setFormData({...formData, objections: [...(formData.objections || []), newObjection.trim()]}); setNewObjection(''); } }}><Plus size={20} /></Button></div>{formData.objections && formData.objections.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{formData.objections.map((obj, i) => <Badge key={i} variant="secondary">{obj}<button type="button" onClick={() => setFormData({...formData, objections: formData.objections?.filter((_, idx) => idx !== i)})} className="ml-2"><X size={14} /></button></Badge>)}</div>}</div>
          
          <div><Label>Tom de comunicação</Label>
            <div className="relative">
              <Textarea value={formData.communication_tone} onChange={e => setFormData({...formData, communication_tone: e.target.value})} placeholder="Ex: Empoderador e acolhedor, com linguagem profissional mas não técnica demais. Foca em resultados práticos e bem-estar. Evita termos de academia tradicional." rows={2} className="pr-12" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, communication_tone: formData.communication_tone ? `${formData.communication_tone} ${text}` : text})} />
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
