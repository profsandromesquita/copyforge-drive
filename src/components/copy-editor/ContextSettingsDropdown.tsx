import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AudienceSegment, Offer } from '@/types/project-config';

interface ContextSettingsDropdownProps {
  onContextChange?: (context: {
    audienceSegmentId: string;
    offerId: string;
    methodologyId: string;
  }) => void;
}

export const ContextSettingsDropdown = ({ onContextChange }: ContextSettingsDropdownProps) => {
  const { activeProject } = useProject();
  const { copyId, loadCopy } = useCopyEditor();
  const { toast } = useToast();
  const [audienceSegmentId, setAudienceSegmentId] = useState<string>('');
  const [offerId, setOfferId] = useState<string>('');
  const [methodologyId, setMethodologyId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const audienceSegments = (activeProject?.audience_segments as AudienceSegment[]) || [];
  const offers = (activeProject?.offers as Offer[]) || [];
  
  // Metodologia pode ser array ou objeto singular, normalizar para array
  const methodologies = activeProject?.methodology 
    ? (Array.isArray(activeProject.methodology) 
        ? activeProject.methodology 
        : [activeProject.methodology])
    : [];

  // Debug: verificar IDs dos segments
  useEffect(() => {
    if (audienceSegments.length > 0) {
      console.log('📊 Audience Segments:', audienceSegments.map(s => ({ id: s.id, who_is: s.who_is })));
    }
    if (offers.length > 0) {
      console.log('🎯 Offers:', offers.map(o => ({ id: o.id, name: o.name })));
    }
  }, [audienceSegments, offers]);


  // Carregar contexto atual da copy
  useEffect(() => {
    const loadCurrentContext = async () => {
      if (!copyId) return;
      
      const { data: copy } = await supabase
        .from('copies')
        .select('selected_audience_id, selected_offer_id')
        .eq('id', copyId)
        .single();
      
      if (copy) {
        setAudienceSegmentId(copy.selected_audience_id || '');
        setOfferId(copy.selected_offer_id || '');
      }
    };
    
    loadCurrentContext();
  }, [copyId]);

  // Função para validar UUID
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Salvar contexto quando mudar
  const handleContextChange = async (field: 'audience' | 'offer' | 'methodology', value: string) => {
    if (!copyId) return;
    
    setIsSaving(true);
    try {
      const updateData: any = {};
      let newAudienceId = audienceSegmentId;
      let newOfferId = offerId;
      let newMethodologyId = methodologyId;
      
      if (field === 'audience') {
        // Agora aceitamos qualquer identificador de público vindo do projeto
        newAudienceId = value;
        setAudienceSegmentId(value);
        updateData.selected_audience_id = value || null;
      } else if (field === 'offer') {
        // Agora aceitamos qualquer identificador de oferta vindo do projeto
        newOfferId = value;
        setOfferId(value);
        updateData.selected_offer_id = value || null;
      } else if (field === 'methodology') {
        newMethodologyId = value;
        setMethodologyId(value);
        // Metodologia não é salva na copy ainda, mas pode ser no futuro
      }
      
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('copies')
          .update(updateData)
          .eq('id', copyId);
        
        if (error) {
          console.error('Erro ao atualizar copy:', error);
          throw error;
        }
      }
      
      // Notificar mudança com valores atualizados
      if (onContextChange) {
        onContextChange({ 
          audienceSegmentId: newAudienceId, 
          offerId: newOfferId, 
          methodologyId: newMethodologyId 
        });
      }
      
      toast({
        title: 'Contexto atualizado',
        description: 'Suas próximas gerações usarão este contexto.',
      });
    } catch (error) {
      console.error('Erro ao salvar contexto:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <Settings size={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h4 className="font-semibold text-sm">Contexto de Criação</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Selecione o contexto que será usado para gerar suas copies
            </p>
          </div>

          <div className="space-y-4">
            {/* Público-alvo */}
            <div className="space-y-2">
              <Label htmlFor="audience" className="text-sm font-medium">Público-alvo</Label>
              <Select 
                value={audienceSegmentId || undefined} 
                onValueChange={(value) => handleContextChange('audience', value)}
                disabled={isSaving}
              >
                <SelectTrigger id="audience" className="h-10 text-sm">
                  <SelectValue placeholder="Nenhum selecionado" />
                </SelectTrigger>
                <SelectContent>
                  {audienceSegments.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      Nenhum público configurado
                    </div>
                  ) : (
                    audienceSegments.map((segment) => (
                      <SelectItem key={segment.id} value={segment.id} className="text-sm">
                        {segment.who_is ? `${segment.who_is.substring(0, 50)}...` : segment.id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Oferta */}
            <div className="space-y-2">
              <Label htmlFor="offer" className="text-sm font-medium">Oferta</Label>
              <Select 
                value={offerId || undefined} 
                onValueChange={(value) => handleContextChange('offer', value)}
                disabled={isSaving}
              >
                <SelectTrigger id="offer" className="h-10 text-sm">
                  <SelectValue placeholder="Nenhuma selecionada" />
                </SelectTrigger>
                <SelectContent>
                  {offers.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      Nenhuma oferta configurada
                    </div>
                  ) : (
                    offers.map((offer) => (
                      <SelectItem key={offer.id} value={offer.id} className="text-sm">
                        {offer.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Metodologia */}
            <div className="space-y-2">
              <Label htmlFor="methodology" className="text-sm font-medium">Metodologia</Label>
              <Select 
                value={methodologyId || undefined} 
                onValueChange={(value) => handleContextChange('methodology', value)}
                disabled={isSaving}
              >
                <SelectTrigger id="methodology" className="h-10 text-sm">
                  <SelectValue placeholder="Nenhuma selecionada" />
                </SelectTrigger>
                <SelectContent>
                  {methodologies.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      Nenhuma metodologia configurada
                    </div>
                  ) : (
                    methodologies.map((methodology: any) => (
                      <SelectItem key={methodology.id} value={methodology.id} className="text-sm">
                        {methodology.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
