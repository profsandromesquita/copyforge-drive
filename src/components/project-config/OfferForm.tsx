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
  const [formData, setFormData] = useState<Partial<Offer>>({ name: '', type: 'other', short_description: '', main_benefit: '', unique_mechanism: '', differentials: ['', '', ''], proof: '', guarantee: '', cta: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (offer) {
      setFormData(offer);
    } else {
      setFormData({ name: '', type: 'other', short_description: '', main_benefit: '', unique_mechanism: '', differentials: ['', '', ''], proof: '', guarantee: '', cta: '' });
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
          <div><Label>Nome da oferta *</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Desafio 21 Dias Emagrecimento Definitivo" className="placeholder:text-xs" /></div>
          <div><Label>Tipo *</Label><Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{OFFER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
          
          <div><Label>Descrição curta *</Label>
            <div className="relative">
              <Textarea value={formData.short_description} onChange={e => setFormData({...formData, short_description: e.target.value})} placeholder="Ex: Programa de 21 dias com receitas balanceadas e exercícios em casa" rows={2} className="pr-12 placeholder:text-xs" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, short_description: formData.short_description ? `${formData.short_description} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>Benefício principal *</Label>
            <div className="relative">
              <Textarea value={formData.main_benefit} onChange={e => setFormData({...formData, main_benefit: e.target.value})} placeholder="Ex: Perca até 5kg em 21 dias sem passar fome" rows={2} className="pr-12 placeholder:text-xs" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, main_benefit: formData.main_benefit ? `${formData.main_benefit} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>Mecanismo único *</Label>
            <div className="relative">
              <Textarea value={formData.unique_mechanism} onChange={e => setFormData({...formData, unique_mechanism: e.target.value})} placeholder="Ex: Método Reset Metabólico que acelera a queima de gordura" rows={2} className="pr-12 placeholder:text-xs" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, unique_mechanism: formData.unique_mechanism ? `${formData.unique_mechanism} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>Diferenciais (3)</Label>{[0, 1, 2].map(i => <Input key={i} className="mt-2 placeholder:text-xs" placeholder={i === 0 ? "Ex: Sem cortar carboidratos" : i === 1 ? "Ex: Grupo VIP de apoio" : "Ex: Receitas fáceis e rápidas"} value={formData.differentials?.[i] || ''} onChange={e => { const diffs = [...(formData.differentials || ['', '', ''])]; diffs[i] = e.target.value; setFormData({...formData, differentials: diffs}); }} />)}</div>
          
          <div><Label>Prova/Autoridade</Label>
            <div className="relative">
              <Textarea value={formData.proof} onChange={e => setFormData({...formData, proof: e.target.value})} placeholder="Ex: Mais de 2.000 alunas emagreceram com o método" rows={2} className="pr-12 placeholder:text-xs" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, proof: formData.proof ? `${formData.proof} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>Garantia (opcional)</Label>
            <div className="relative">
              <Textarea value={formData.guarantee} onChange={e => setFormData({...formData, guarantee: e.target.value})} placeholder="Ex: Se não perder peso em 21 dias, devolvemos seu dinheiro" rows={2} className="pr-12 placeholder:text-xs" />
              <VoiceInput onTranscript={(text) => setFormData({...formData, guarantee: formData.guarantee ? `${formData.guarantee} ${text}` : text})} />
            </div>
          </div>
          
          <div><Label>CTA *</Label><Input value={formData.cta} onChange={e => setFormData({...formData, cta: e.target.value})} placeholder="Ex: Comece agora seu desafio de 21 dias" className="placeholder:text-xs" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
