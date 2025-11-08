import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VoiceInput } from './VoiceInput';
import { Offer, OFFER_TYPES } from '@/types/project-config';
import { useProject } from '@/hooks/useProject';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OfferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer | null;
  allOffers: Offer[];
  onSave: (offers: Offer[]) => void;
}

export const OfferForm = ({ open, onOpenChange, offer, allOffers, onSave }: OfferFormProps) => {
  const { activeProject, refreshProjects } = useProject();
  const [formData, setFormData] = useState<Partial<Offer>>({ name: '', type: 'product', short_description: '', main_benefit: '', unique_mechanism: '', differentials: ['', '', ''], proof: '', guarantee: '', cta: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (offer) {
      setFormData(offer);
    } else {
      setFormData({ name: '', type: 'product', short_description: '', main_benefit: '', unique_mechanism: '', differentials: ['', '', ''], proof: '', guarantee: '', cta: '' });
    }
  }, [offer, open]);

  const handleSave = async () => {
    if (!formData.name || !formData.short_description || !formData.main_benefit || !formData.unique_mechanism || !formData.cta) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const newOffer: Offer = { ...formData, id: offer?.id || `offer-${Date.now()}` } as Offer;
      const updatedOffers = offer ? allOffers.map(o => o.id === offer.id ? newOffer : o) : [...allOffers, newOffer];

      if (activeProject) {
        const { error } = await supabase.from('projects').update({ offers: updatedOffers as any }).eq('id', activeProject.id);
        if (error) throw error;
        await refreshProjects();
        onSave(updatedOffers);
        toast.success('Oferta salva!');
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
        <DialogHeader><DialogTitle>{offer ? 'Editar' : 'Adicionar'} Oferta</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div><Label>Nome da oferta *</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Programa FitLife 90 Dias - Transformação Completa" /></div>
          <div><Label>Tipo *</Label><Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{OFFER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
          
          <div><Label>Descrição curta *</Label>
            <div className="relative">
              <Textarea value={formData.short_description} onChange={e => setFormData({...formData, short_description: e.target.value})} placeholder="Ex: Programa de treinamento funcional personalizado de 90 dias com acompanhamento nutricional, treinos flexíveis de 30 minutos e grupo de apoio exclusivo para mulheres executivas." rows={2} className="pr-12" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, short_description: formData.short_description ? `${formData.short_description} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>Benefício principal *</Label>
            <div className="relative">
              <Textarea value={formData.main_benefit} onChange={e => setFormData({...formData, main_benefit: e.target.value})} placeholder="Ex: Recupere sua energia e autoconfiança em apenas 90 dias, eliminando dores nas costas e perdendo até 8kg, mesmo com uma rotina agitada - tudo isso treinando apenas 30 minutos, 3x por semana." rows={2} className="pr-12" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, main_benefit: formData.main_benefit ? `${formData.main_benefit} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>Mecanismo único *</Label>
            <div className="relative">
              <Textarea value={formData.unique_mechanism} onChange={e => setFormData({...formData, unique_mechanism: e.target.value})} placeholder="Ex: Método FitLife Progressive: combina treinos funcionais curtos e intensos com ajustes nutricionais graduais e sessões de mindfulness, adaptado especificamente para quem passa horas sentada no escritório." rows={2} className="pr-12" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, unique_mechanism: formData.unique_mechanism ? `${formData.unique_mechanism} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>Diferenciais (3)</Label>{[0, 1, 2].map(i => <Input key={i} className="mt-2" placeholder={i === 0 ? "Ex: Treinos de 30 min que cabem na sua agenda" : i === 1 ? "Ex: Acompanhamento nutricional sem dietas radicais" : "Ex: Grupo exclusivo de mulheres executivas"} value={formData.differentials?.[i] || ''} onChange={e => { const diffs = [...(formData.differentials || ['', '', ''])]; diffs[i] = e.target.value; setFormData({...formData, differentials: diffs}); }} />)}</div>
          
          <div><Label>Prova/Autoridade</Label>
            <div className="relative">
              <Textarea value={formData.proof} onChange={e => setFormData({...formData, proof: e.target.value})} placeholder="Ex: Mais de 300 mulheres executivas já transformaram suas vidas com o Programa FitLife. Taxa de 94% de conclusão dos 90 dias. Profissionais certificados CREF com 15+ anos de experiência." rows={2} className="pr-12" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, proof: formData.proof ? `${formData.proof} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>Garantia (opcional)</Label>
            <div className="relative">
              <Textarea value={formData.guarantee} onChange={e => setFormData({...formData, guarantee: e.target.value})} placeholder="Ex: Garantia de 30 dias. Se nos primeiros 30 dias você não sentir melhora nas dores nas costas e mais disposição, devolvemos 100% do investimento." rows={2} className="pr-12" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, guarantee: formData.guarantee ? `${formData.guarantee} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>CTA *</Label><Input value={formData.cta} onChange={e => setFormData({...formData, cta: e.target.value})} placeholder="Ex: Comece sua transformação hoje - Agende sua avaliação gratuita" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
