import { useState, useEffect, useCallback } from 'react';
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
import { CheckCircle, Circle } from 'phosphor-react';

interface OfferFormProps {
  offer: Offer | null;
  allOffers: Offer[];
  onSave: (offers: Offer[]) => void;
  onUpdate?: (offers: Offer[]) => void;
  onCancel: () => void;
  onAutoSavingChange?: (isSaving: boolean) => void;
}

export const OfferForm = ({ offer, allOffers, onSave, onUpdate, onCancel, onAutoSavingChange }: OfferFormProps) => {
  const { activeProject, refreshProjects } = useProject();
  const [formData, setFormData] = useState<Partial<Offer>>({
    name: '',
    type: 'other',
    short_description: '',
    main_benefit: '',
    unique_mechanism: '',
    differentials: ['', '', ''],
    proof: '',
    guarantee: ''
  });
  const [identification, setIdentification] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [offerCreated, setOfferCreated] = useState(false);
  const [originalId, setOriginalId] = useState<string | null>(null);

  // Load draft from localStorage or edit existing
  useEffect(() => {
    if (offer) {
      setFormData(offer);
      setIdentification(offer.name);
      setOfferCreated(true);
      setOriginalId(offer.id);
    } else {
      const draft = localStorage.getItem('offer-draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setFormData(parsed);
        } catch (e) {
          console.error('Error loading draft:', e);
        }
      }
    }
  }, [offer]);

  // Save draft to localStorage
  useEffect(() => {
    if (!offer && Object.values(formData).some(v => v !== '' && v !== 'other' && (!Array.isArray(v) || v.some(item => item !== '')))) {
      localStorage.setItem('offer-draft', JSON.stringify(formData));
    }
  }, [formData, offer]);

  // Auto-save to database - Silencioso, sem refresh da página
  const autoSaveToDatabase = useCallback(async () => {
    if (!activeProject || !offerCreated || !offer) return;

    setAutoSaving(true);
    onAutoSavingChange?.(true);

    try {
      const updatedOffer: Offer = {
        ...offer,
        ...formData,
        name: identification || offer.name
      } as Offer;

      const updatedOffers = allOffers.map(o => o.id === offer.id ? updatedOffer : o);

      await supabase
        .from('projects')
        .update({ offers: updatedOffers as any })
        .eq('id', activeProject.id);

      // Não chamar refreshProjects() aqui para evitar perda de foco
      // Apenas atualizar o estado local
      onUpdate?.(updatedOffers);
    } catch (error) {
      console.error('Auto-save error:', error);
      toast.error('Erro ao salvar automaticamente');
    } finally {
      setAutoSaving(false);
      onAutoSavingChange?.(false);
    }
  }, [activeProject, offerCreated, offer, formData, identification, allOffers, onUpdate, onAutoSavingChange]);

  // Trigger auto-save com debounce de 3 segundos
  useEffect(() => {
    if (offer && offerCreated) {
      const timer = setTimeout(() => {
        autoSaveToDatabase();
      }, 3000); // Aumentado para 3 segundos para melhor UX

      return () => clearTimeout(timer);
    }
  }, [formData, identification, offer, offerCreated, autoSaveToDatabase]);

  const handleCreateOffer = async () => {
    if (!identification.trim()) {
      toast.error('Digite o nome da oferta primeiro');
      return;
    }

    if (!activeProject) {
      toast.error('Projeto não encontrado');
      return;
    }

    try {
      const newOffer: Offer = {
        id: `offer-${Date.now()}`,
        name: identification,
        type: 'other',
        short_description: '',
        main_benefit: '',
        unique_mechanism: '',
        differentials: ['', '', ''],
        proof: '',
        guarantee: '',
        cta: ''
      };

      const updatedOffers = [...allOffers, newOffer];

      await supabase
        .from('projects')
        .update({ offers: updatedOffers as any })
        .eq('id', activeProject.id);

      await refreshProjects();
      setOfferCreated(true);
      setOriginalId(newOffer.id);
      localStorage.removeItem('offer-draft');
      
      // Salvar no localStorage que esta oferta está sendo editada
      localStorage.setItem(`offer-editing-${activeProject.id}`, newOffer.id);
      
      toast.success('Oferta criada! Agora preencha os campos abaixo.');
    } catch (error) {
      console.error('Error creating offer:', error);
      toast.error('Erro ao criar oferta');
    }
  };

  const handleUpdateIdentification = async () => {
    if (!identification.trim() || !offer || !activeProject) return;

    try {
      const updatedOffer = { ...offer, name: identification };
      const updatedOffers = allOffers.map(o => o.id === offer.id ? updatedOffer : o);

      await supabase
        .from('projects')
        .update({ offers: updatedOffers as any })
        .eq('id', activeProject.id);

      await refreshProjects();
      onSave(updatedOffers);
      toast.success('Nome atualizado!');
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Erro ao atualizar nome');
    }
  };

  const isAllFieldsFilled = () => {
    return (
      formData.short_description && formData.short_description.length >= 50 &&
      formData.main_benefit && formData.main_benefit.length >= 30
    );
  };

  const handleComplete = async () => {
    if (!isAllFieldsFilled()) {
      toast.error('Preencha todos os campos obrigatórios com o mínimo de caracteres');
      return;
    }

    if (activeProject) {
      localStorage.removeItem(`offer-editing-${activeProject.id}`);
    }
    onCancel();
    toast.success('Oferta concluída com sucesso!');
  };

  const handleClose = async () => {
    if (offerCreated && offer) {
      await autoSaveToDatabase();
    }
    if (activeProject) {
      localStorage.removeItem(`offer-editing-${activeProject.id}`);
    }
    onCancel();
  };

  const getCharCount = (field: keyof Offer) => {
    const value = formData[field];
    return typeof value === 'string' ? value.length : 0;
  };

  const fieldMinimums = [
    { field: 'short_description', min: 50 },
    { field: 'main_benefit', min: 30 }
  ];

  return (
    <div className="space-y-6">
      {/* Identificação */}
      <div className="bg-card border border-border rounded-lg p-6">
        <Label className="text-base font-semibold">Nome da Oferta *</Label>
        <p className="text-sm text-muted-foreground mt-1 mb-3">
          Escolha um nome que identifique claramente esta oferta
        </p>
        <div className="flex gap-2">
          <Input
            value={identification}
            onChange={(e) => setIdentification(e.target.value)}
            placeholder="Ex: Desafio 21 Dias Emagrecimento Definitivo"
            disabled={offerCreated}
            className="placeholder:text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !offerCreated && identification.trim()) {
                handleCreateOffer();
              }
            }}
          />
          {!offerCreated ? (
            <Button onClick={handleCreateOffer} disabled={!identification.trim()}>
              Criar Oferta
            </Button>
          ) : (
            identification !== originalId && (
              <Button onClick={handleUpdateIdentification} variant="outline">
                Atualizar
              </Button>
            )
          )}
        </div>
      </div>

      {/* Form fields - only show after offer is created */}
      {offerCreated && (
        <div className="space-y-6">
          {/* Tipo */}
          <div className="bg-card border border-border rounded-lg p-6">
            <Label className="text-base font-semibold">Tipo de Oferta *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(v) => setFormData({...formData, type: v as any})}
            >
              <SelectTrigger className="mt-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OFFER_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição Curta */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Descrição Curta *</Label>
              <span className={`text-xs ${getCharCount('short_description') >= 50 ? 'text-primary' : 'text-muted-foreground'}`}>
                {getCharCount('short_description')}/50 caracteres
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Faça uma descrição breve e impactante da sua oferta
            </p>
            <div className="relative">
              <Textarea
                value={formData.short_description}
                onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                placeholder="Ex: Programa de 21 dias com receitas balanceadas e exercícios em casa"
                rows={3}
                className="pr-12 placeholder:text-xs"
              />
              <VoiceInput onTranscript={(text) => setFormData({...formData, short_description: formData.short_description ? `${formData.short_description} ${text}` : text})} />
            </div>
          </div>

          {/* Benefício Principal */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Benefício Principal *</Label>
              <span className={`text-xs ${getCharCount('main_benefit') >= 30 ? 'text-primary' : 'text-muted-foreground'}`}>
                {getCharCount('main_benefit')}/30 caracteres
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Qual é o principal resultado que o cliente vai alcançar?
            </p>
            <div className="relative">
              <Textarea
                value={formData.main_benefit}
                onChange={(e) => setFormData({...formData, main_benefit: e.target.value})}
                placeholder="Ex: Perca até 5kg em 21 dias sem passar fome"
                rows={2}
                className="pr-12 placeholder:text-xs"
              />
              <VoiceInput onTranscript={(text) => setFormData({...formData, main_benefit: formData.main_benefit ? `${formData.main_benefit} ${text}` : text})} />
            </div>
          </div>

          {/* Mecanismo Único */}
          <div className="bg-card border border-border rounded-lg p-6">
            <Label className="text-base font-semibold">Mecanismo Único</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Qual o caminho estruturado/método que levará o cliente de onde está para onde ele quer chegar?
            </p>
            <div className="relative">
              <Textarea
                value={formData.unique_mechanism}
                onChange={(e) => setFormData({...formData, unique_mechanism: e.target.value})}
                placeholder="Ex: Método Reset Metabólico que acelera a queima de gordura"
                rows={2}
                className="pr-12 placeholder:text-xs"
              />
              <VoiceInput onTranscript={(text) => setFormData({...formData, unique_mechanism: formData.unique_mechanism ? `${formData.unique_mechanism} ${text}` : text})} />
            </div>
          </div>

          {/* Diferenciais */}
          <div className="bg-card border border-border rounded-lg p-6">
            <Label className="text-base font-semibold">Diferenciais (3)</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Liste os principais diferenciais da sua oferta
            </p>
            {[0, 1, 2].map(i => (
              <Input
                key={i}
                className="mt-2 placeholder:text-xs"
                placeholder={i === 0 ? "Ex: Sem cortar carboidratos" : i === 1 ? "Ex: Grupo VIP de apoio" : "Ex: Receitas fáceis e rápidas"}
                value={formData.differentials?.[i] || ''}
                onChange={e => {
                  const diffs = [...(formData.differentials || ['', '', ''])];
                  diffs[i] = e.target.value;
                  setFormData({...formData, differentials: diffs});
                }}
              />
            ))}
          </div>

          {/* Prova/Autoridade */}
          <div className="bg-card border border-border rounded-lg p-6">
            <Label className="text-base font-semibold">Prova/Autoridade</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Demonstre credibilidade (números, depoimentos, certificações)
            </p>
            <div className="relative">
              <Textarea
                value={formData.proof}
                onChange={(e) => setFormData({...formData, proof: e.target.value})}
                placeholder="Ex: Mais de 2.000 alunas emagreceram com o método"
                rows={2}
                className="pr-12 placeholder:text-xs"
              />
              <VoiceInput onTranscript={(text) => setFormData({...formData, proof: formData.proof ? `${formData.proof} ${text}` : text})} />
            </div>
          </div>

          {/* Garantia */}
          <div className="bg-card border border-border rounded-lg p-6">
            <Label className="text-base font-semibold">Garantia (opcional)</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              Qual garantia você oferece para reduzir o risco percebido?
            </p>
            <div className="relative">
              <Textarea
                value={formData.guarantee}
                onChange={(e) => setFormData({...formData, guarantee: e.target.value})}
                placeholder="Ex: Se não perder peso em 21 dias, devolvemos seu dinheiro"
                rows={2}
                className="pr-12 placeholder:text-xs"
              />
              <VoiceInput onTranscript={(text) => setFormData({...formData, guarantee: formData.guarantee ? `${formData.guarantee} ${text}` : text})} />
            </div>
          </div>

          {/* Status Summary */}
          <div className="bg-muted/50 border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-3">Status dos Campos</h3>
            <div className="space-y-2">
              {fieldMinimums.map(({ field, min }) => {
                const current = getCharCount(field as keyof Offer);
                const isComplete = current >= min;
                return (
                  <div key={field} className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle size={16} className="text-primary" weight="fill" />
                    ) : (
                      <Circle size={16} className="text-muted-foreground" />
                    )}
                    <span className={`text-sm ${isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {field === 'short_description' ? 'Descrição Curta' :
                       'Benefício Principal'}: {current}/{min}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Salvar e Fechar
            </Button>
            <Button 
              onClick={handleComplete} 
              disabled={!isAllFieldsFilled()}
              className="flex-1"
            >
              Concluir Oferta
            </Button>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};