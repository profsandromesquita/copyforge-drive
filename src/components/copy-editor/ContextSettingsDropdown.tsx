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
import type { AudienceSegmentJson, OfferJson, MethodologyJson, CopyUpdate } from '@/types/database';

interface ContextSettingsDropdownProps {
  onContextChange?: (context: {
    audienceSegmentId: string;
    offerId: string;
    methodologyId: string;
  }) => void;
  initialContext?: {
    audienceSegmentId: string;
    offerId: string;
    methodologyId: string;
  };
}

export const ContextSettingsDropdown = ({ onContextChange, initialContext }: ContextSettingsDropdownProps) => {
  const { activeProject } = useProject();
  const { copyId, loadCopy } = useCopyEditor();
  const { toast } = useToast();
  const [audienceSegmentId, setAudienceSegmentId] = useState<string>(initialContext?.audienceSegmentId || '');
  const [offerId, setOfferId] = useState<string>(initialContext?.offerId || '');
  const [methodologyId, setMethodologyId] = useState<string>(initialContext?.methodologyId || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const audienceSegments = (activeProject?.audience_segments || []) as AudienceSegmentJson[];
  const offers = (activeProject?.offers || []) as OfferJson[];
  
  // Metodologia pode ser array ou objeto singular, normalizar para array
  const methodologies: MethodologyJson[] = activeProject?.methodology 
    ? (Array.isArray(activeProject.methodology) 
        ? activeProject.methodology 
        : [activeProject.methodology]) as MethodologyJson[]
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

  // Função para validar UUID
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Salvar contexto quando mudar
  const handleContextChange = async (field: 'audience' | 'offer' | 'methodology', value: string) => {
    if (!copyId) {
      console.error('❌ copyId está undefined! Não é possível salvar.');
      return;
    }
    
    console.log('💾 Iniciando save:', { field, value, copyId });
    
    setIsSaving(true);
    try {
      const updateData: Partial<CopyUpdate> = {};
      let newAudienceId = audienceSegmentId;
      let newOfferId = offerId;
      let newMethodologyId = methodologyId;
      
      if (field === 'audience') {
        newAudienceId = value;
        setAudienceSegmentId(value);
        updateData.selected_audience_id = value || null;
      } else if (field === 'offer') {
        newOfferId = value;
        setOfferId(value);
        updateData.selected_offer_id = value || null;
      } else if (field === 'methodology') {
        newMethodologyId = value;
        setMethodologyId(value);
        updateData.selected_methodology_id = value || null;
        console.log('📋 Update data:', updateData);
      }
      
      if (Object.keys(updateData).length > 0) {
        console.log('🔄 Executando UPDATE no Supabase...');
        const { data, error } = await supabase
          .from('copies')
          .update(updateData)
          .eq('id', copyId)
          .select();
        
        if (error) {
          console.error('❌ Erro Supabase:', error);
          throw error;
        }
        
        console.log('✅ Dados salvos:', data);
      }
      
      // Notificar mudança com valores atualizados
      if (onContextChange) {
        onContextChange({ 
          audienceSegmentId: newAudienceId, 
          offerId: newOfferId, 
          methodologyId: newMethodologyId 
        });
      }
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
            <h4 className="font-semibold text-base text-primary">Contexto de Criação</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Selecione o contexto que será usado para gerar suas copies
            </p>
          </div>

          <div className="space-y-4">
            {/* Público-alvo */}
            <div className="space-y-2">
              <Label htmlFor="audience" className="text-sm font-medium">Público-alvo</Label>
              <Select 
                value={audienceSegmentId || '_none'} 
                onValueChange={(value) => handleContextChange('audience', value === '_none' ? '' : value)}
                disabled={isSaving}
              >
                <SelectTrigger id="audience" className="h-10 text-sm">
                  <SelectValue placeholder="Nenhum selecionado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none" className="text-sm text-muted-foreground">
                    Nenhum selecionado
                  </SelectItem>
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
                value={offerId || '_none'} 
                onValueChange={(value) => handleContextChange('offer', value === '_none' ? '' : value)}
                disabled={isSaving}
              >
                <SelectTrigger id="offer" className="h-10 text-sm">
                  <SelectValue placeholder="Nenhuma selecionada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none" className="text-sm text-muted-foreground">
                    Nenhuma selecionada
                  </SelectItem>
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
                value={methodologyId || '_none'} 
                onValueChange={(value) => handleContextChange('methodology', value === '_none' ? '' : value)}
                disabled={isSaving}
              >
                <SelectTrigger id="methodology" className="h-10 text-sm">
                  <SelectValue placeholder="Nenhuma selecionada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none" className="text-sm text-muted-foreground">
                    Nenhuma selecionada
                  </SelectItem>
                  {methodologies.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      Nenhuma metodologia configurada
                    </div>
                  ) : (
                    methodologies.map((methodology) => (
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
