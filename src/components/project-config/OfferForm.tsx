import { useState, useEffect, useCallback, useRef } from 'react';
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
  const { activeProject, refreshProjects, setActiveProject } = useProject();
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

  const mountedRef = useRef(true);
  
  // Refs para valores usados no cleanup (evita loop infinito)
  const offerRef = useRef(offer);
  const offerCreatedRef = useRef(offerCreated);
  const formDataRef = useRef(formData);
  const identificationRef = useRef(identification);
  const autoSaveRef = useRef<() => Promise<void>>();

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Load draft from localStorage or edit existing
  useEffect(() => {
    if (offer) {
      setFormData(offer);
      setIdentification(offer.name);
      setOfferCreated(true);
      setOriginalId(offer.id);

      // Merge per-offer draft if exists (survives tab switches)
      try {
        const perOfferDraft = localStorage.getItem(`offer-draft-${offer.id}`);
        if (perOfferDraft) {
          const parsed = JSON.parse(perOfferDraft);
          if (parsed?.formData) setFormData({ ...offer, ...parsed.formData });
          if (parsed?.identification) setIdentification(parsed.identification);
        }
      } catch (e) {
        console.error('Error loading per-offer draft:', e);
      }
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

    if (mountedRef.current) {
      setAutoSaving(true);
      onAutoSavingChange?.(true);
    }

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

      // Atualizar o estado local sem perder foco
      onUpdate?.(updatedOffers);

      // Atualizar o contexto do projeto para manter sincronização entre abas
      if (activeProject) {
        setActiveProject({ ...activeProject, offers: updatedOffers });
      }

      // Limpa draft específico após salvar com sucesso
      try { localStorage.removeItem(`offer-draft-${offer.id}`); } catch {}
    } catch (error) {
      console.error('Auto-save error:', error);
      toast.error('Erro ao salvar automaticamente');
    } finally {
      if (mountedRef.current) {
        setAutoSaving(false);
        onAutoSavingChange?.(false);
      }
    }
  }, [activeProject, offerCreated, offer, formData, identification, allOffers, onUpdate, onAutoSavingChange]);

  // Handler para salvar ao tirar o foco do campo
  const handleBlur = useCallback(() => {
    if (offer && offerCreated) {
      autoSaveToDatabase();
    }
  }, [offer, offerCreated, autoSaveToDatabase]);

  // Manter refs atualizados
  useEffect(() => { offerRef.current = offer; }, [offer]);
  useEffect(() => { offerCreatedRef.current = offerCreated; }, [offerCreated]);
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { identificationRef.current = identification; }, [identification]);
  useEffect(() => { autoSaveRef.current = autoSaveToDatabase; }, [autoSaveToDatabase]);

  // Flush auto-save on unmount ONLY (array vazio = executa apenas no unmount real)
  useEffect(() => {
    return () => {
      const currentOffer = offerRef.current;
      if (currentOffer && offerCreatedRef.current) {
        try {
          localStorage.setItem(
            `offer-draft-${currentOffer.id}`,
            JSON.stringify({ formData: formDataRef.current, identification: identificationRef.current })
          );
        } catch {}
        // Fire-and-forget save via ref (não causa re-render)
        autoSaveRef.current?.();
      }
    };
  }, []); // 🟢 Array vazio garante execução apenas no unmount real

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
      
      // Atualizar o contexto do projeto imediatamente
      setActiveProject({ ...activeProject, offers: updatedOffers });
      
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
      
      // Atualizar o contexto do projeto imediatamente
      setActiveProject({ ...activeProject, offers: updatedOffers });
      
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
    <div className="max-w-3xl mx-auto space-y-8 pb-8">
      {/* Identificação */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">Nome da Oferta *</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha um nome que identifique claramente esta oferta
          </p>
        </div>
        <div className="flex gap-3">
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
            <Button onClick={handleCreateOffer} disabled={!identification.trim()} size="lg">
              Criar Oferta
            </Button>
          ) : (
            identification !== originalId && (
              <Button onClick={handleUpdateIdentification} variant="outline" size="lg">
                Atualizar
              </Button>
            )
          )}
        </div>
      </div>

      {/* Form fields - only show after offer is created */}
      {offerCreated && (
        <div className="space-y-8">
          {/* Card único com todos os campos */}
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-6">
            {/* Tipo */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Tipo de Oferta *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => {
                  setFormData({...formData, type: v as any});
                  handleBlur();
                }}
              >
                <SelectTrigger>
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

            <div className="border-t border-border" />

            {/* Descrição Curta */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Descrição Curta *</Label>
                <span className={`text-xs font-medium ${getCharCount('short_description') >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                  {getCharCount('short_description')}/50
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Faça uma descrição breve e impactante da sua oferta
              </p>
              <div className="relative">
                <Textarea
                  value={formData.short_description}
                  onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                  onBlur={handleBlur}
                  placeholder="Ex: Programa de 21 dias com receitas balanceadas e exercícios em casa"
                  rows={3}
                  className="pr-12 resize-none"
                />
                <VoiceInput onTranscript={(text) => setFormData({...formData, short_description: formData.short_description ? `${formData.short_description} ${text}` : text})} />
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Benefício Principal */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Benefício Principal *</Label>
                <span className={`text-xs font-medium ${getCharCount('main_benefit') >= 30 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                  {getCharCount('main_benefit')}/30
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Qual é o principal resultado que o cliente vai alcançar?
              </p>
              <div className="relative">
                <Textarea
                  value={formData.main_benefit}
                  onChange={(e) => setFormData({...formData, main_benefit: e.target.value})}
                  onBlur={handleBlur}
                  placeholder="Ex: Perca até 5kg em 21 dias sem passar fome"
                  rows={2}
                  className="pr-12 resize-none"
                />
                <VoiceInput onTranscript={(text) => setFormData({...formData, main_benefit: formData.main_benefit ? `${formData.main_benefit} ${text}` : text})} />
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Mecanismo Único */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Mecanismo Único</Label>
              <p className="text-sm text-muted-foreground">
                Qual o caminho estruturado/método que levará o cliente de onde está para onde ele quer chegar?
              </p>
              <div className="relative">
                <Textarea
                  value={formData.unique_mechanism}
                  onChange={(e) => setFormData({...formData, unique_mechanism: e.target.value})}
                  onBlur={handleBlur}
                  placeholder="Ex: Método Reset Metabólico que acelera a queima de gordura"
                  rows={2}
                  className="pr-12 resize-none"
                />
                <VoiceInput onTranscript={(text) => setFormData({...formData, unique_mechanism: formData.unique_mechanism ? `${formData.unique_mechanism} ${text}` : text})} />
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Diferenciais */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Diferenciais</Label>
              <p className="text-sm text-muted-foreground">
                Liste os principais diferenciais da sua oferta
              </p>
              <div className="space-y-2">
                {[0, 1, 2].map(i => (
                  <Input
                    key={i}
                    placeholder={i === 0 ? "Ex: Sem cortar carboidratos" : i === 1 ? "Ex: Grupo VIP de apoio" : "Ex: Receitas fáceis e rápidas"}
                    value={formData.differentials?.[i] || ''}
                    onChange={e => {
                      const diffs = [...(formData.differentials || ['', '', ''])];
                      diffs[i] = e.target.value;
                      setFormData({...formData, differentials: diffs});
                    }}
                    onBlur={handleBlur}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Prova/Autoridade */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Prova/Autoridade</Label>
              <p className="text-sm text-muted-foreground">
                Demonstre credibilidade (números, depoimentos, certificações)
              </p>
              <div className="relative">
                <Textarea
                  value={formData.proof}
                  onChange={(e) => setFormData({...formData, proof: e.target.value})}
                  onBlur={handleBlur}
                  placeholder="Ex: Mais de 2.000 alunas emagreceram com o método"
                  rows={2}
                  className="pr-12 resize-none"
                />
                <VoiceInput onTranscript={(text) => setFormData({...formData, proof: formData.proof ? `${formData.proof} ${text}` : text})} />
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Garantia */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Garantia</Label>
              <p className="text-sm text-muted-foreground">
                Qual garantia você oferece para reduzir o risco percebido?
              </p>
              <div className="relative">
                <Textarea
                  value={formData.guarantee}
                  onChange={(e) => setFormData({...formData, guarantee: e.target.value})}
                  onBlur={handleBlur}
                  placeholder="Ex: Se não perder peso em 21 dias, devolvemos seu dinheiro"
                  rows={2}
                  className="pr-12 resize-none"
                />
                <VoiceInput onTranscript={(text) => setFormData({...formData, guarantee: formData.guarantee ? `${formData.guarantee} ${text}` : text})} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1 h-11"
              size="lg"
            >
              Salvar e Fechar
            </Button>
            <Button 
              onClick={handleComplete} 
              disabled={!isAllFieldsFilled()}
              className="flex-1 h-11"
              size="lg"
            >
              Concluir Oferta
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};