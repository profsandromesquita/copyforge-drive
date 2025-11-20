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
  const methodology = activeProject?.methodology as any;


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

  // Salvar contexto quando mudar
  const handleContextChange = async (field: 'audience' | 'offer' | 'methodology', value: string) => {
    if (!copyId) return;
    
    setIsSaving(true);
    try {
      const updateData: any = {};
      
      if (field === 'audience') {
        setAudienceSegmentId(value);
        updateData.selected_audience_id = value || null;
      } else if (field === 'offer') {
        setOfferId(value);
        updateData.selected_offer_id = value || null;
      } else if (field === 'methodology') {
        setMethodologyId(value);
        // Metodologia não é salva na copy ainda, mas pode ser no futuro
      }
      
      const { error } = await supabase
        .from('copies')
        .update(updateData)
        .eq('id', copyId);
      
      if (error) throw error;
      
      // Notificar mudança
      if (onContextChange) {
        onContextChange({ audienceSegmentId, offerId, methodologyId });
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
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Contexto de Criação</h4>
            <p className="text-xs text-muted-foreground">
              Selecione o contexto que será usado para gerar suas copies
            </p>
          </div>

          <div className="space-y-3">
            {/* Público-alvo */}
            <div className="space-y-1.5">
              <Label htmlFor="audience" className="text-xs">Público-alvo</Label>
              <Select 
                value={audienceSegmentId || undefined} 
                onValueChange={(value) => handleContextChange('audience', value)}
                disabled={isSaving}
              >
                <SelectTrigger id="audience" className="h-9">
                  <SelectValue placeholder="Nenhum selecionado" />
                </SelectTrigger>
                <SelectContent>
                  {audienceSegments.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.who_is ? `${segment.who_is.substring(0, 50)}...` : segment.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Oferta */}
            <div className="space-y-1.5">
              <Label htmlFor="offer" className="text-xs">Oferta</Label>
              <Select 
                value={offerId || undefined} 
                onValueChange={(value) => handleContextChange('offer', value)}
                disabled={isSaving}
              >
                <SelectTrigger id="offer" className="h-9">
                  <SelectValue placeholder="Nenhuma selecionada" />
                </SelectTrigger>
                <SelectContent>
                  {offers.map((offer) => (
                    <SelectItem key={offer.id} value={offer.id}>
                      {offer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Metodologia */}
            <div className="space-y-1.5">
              <Label htmlFor="methodology" className="text-xs">Metodologia</Label>
              <Select 
                value={methodologyId || undefined} 
                onValueChange={(value) => handleContextChange('methodology', value)}
                disabled={isSaving}
              >
                <SelectTrigger id="methodology" className="h-9">
                  <SelectValue placeholder="Nenhuma selecionada" />
                </SelectTrigger>
                <SelectContent>
                  {methodology && (
                    <SelectItem value={methodology.id || 'methodology'}>
                      {methodology.name}
                    </SelectItem>
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
