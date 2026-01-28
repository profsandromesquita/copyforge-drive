import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AudienceSegment } from '@/types/project-config';
import { Pencil, Save, X, RotateCw, Loader2 } from 'lucide-react';
import { AdvancedAnalysisView } from './AdvancedAnalysisView';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/hooks/useProject';
import { useWorkspace } from '@/hooks/useWorkspace';
import { toast } from 'sonner';

interface AdvancedAnalysisTabProps {
  segment: AudienceSegment;
  allSegments: AudienceSegment[];
  onUpdate: (segments: AudienceSegment[]) => void;
  onClose?: () => void;
}

export function AdvancedAnalysisTab({
  segment,
  allSegments,
  onUpdate,
  onClose,
}: AdvancedAnalysisTabProps) {
  const { activeProject, refreshProjects } = useProject();
  const { activeWorkspace } = useWorkspace();
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState<any>(segment.advanced_analysis || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Estado local que pode ser atualizado após regeneração
  const [localSegment, setLocalSegment] = useState<AudienceSegment>(segment);
  
  // Sincronizar quando prop segment mudar externamente
  useEffect(() => {
    setLocalSegment(segment);
    setEditedAnalysis(segment.advanced_analysis || null);
  }, [segment.id, segment.advanced_analysis]);

  const handleEdit = () => {
    setEditedAnalysis(localSegment.advanced_analysis || null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!activeProject) return;

    setIsSaving(true);
    try {
      const updatedSegment: AudienceSegment = {
        ...localSegment,
        advanced_analysis: editedAnalysis
      };
      
      const updatedSegments = allSegments.map(s =>
        s.id === segment.id ? updatedSegment : s
      );

      const { error: updateError } = await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject.id);

      if (updateError) throw updateError;

      // Atualizar estado local imediatamente para refletir na UI
      setLocalSegment(updatedSegment);
      // Atualizar estado do pai
      onUpdate(updatedSegments);
      setIsEditing(false);
      // Depois recarregar do banco para sincronizar
      await refreshProjects();
      toast.success('Análise atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar análise:', error);
      toast.error('Erro ao salvar análise');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedAnalysis(localSegment.advanced_analysis || null);
    setIsEditing(false);
  };

  const handleGenerate = async () => {
    if (!activeWorkspace || !activeProject) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-audience', {
        body: { 
          segment: localSegment,
          workspace_id: activeWorkspace.id,
          project_context: {
            brand_name: activeProject.brand_name,
            sector: activeProject.sector,
            central_purpose: activeProject.central_purpose,
            methodology: activeProject.methodology,
            offers: activeProject.offers
          }
        }
      });

      if (error) {
        if (error.message?.includes('insufficient_credits') || error.context?.error === 'insufficient_credits') {
          toast.error('Créditos insuficientes para gerar análise. Adicione créditos em Configurações > Workspace > Créditos.');
          throw error;
        }
        if (error.message?.includes('rate_limit') || error.context?.error === 'rate_limit') {
          toast.error('Limite de requisições excedido. Tente novamente em alguns instantes.');
          throw error;
        }
        throw error;
      }

      const updatedSegment: AudienceSegment = {
        ...localSegment,
        advanced_analysis: data.analysis,
        analysis_generated_at: new Date().toISOString()
      };

      const updatedSegments = allSegments.map(s =>
        s.id === segment.id ? updatedSegment : s
      );

      const { error: updateError } = await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject.id);

      if (updateError) throw updateError;

      // Atualizar estado local imediatamente para refletir na UI
      setLocalSegment(updatedSegment);
      // Também atualizar editedAnalysis para manter sincronizado
      setEditedAnalysis(data.analysis);
      // Atualizar estado do pai
      onUpdate(updatedSegments);
      // Depois recarregar do banco para sincronizar
      await refreshProjects();
      toast.success('Análise gerada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar análise:', error);
      if (!error.message?.includes('insufficient_credits') && !error.message?.includes('rate_limit')) {
        toast.error('Erro ao gerar análise. Tente novamente.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!activeWorkspace || !activeProject) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-audience', {
        body: { 
          segment: localSegment,
          workspace_id: activeWorkspace.id,
          project_context: {
            brand_name: activeProject.brand_name,
            sector: activeProject.sector,
            central_purpose: activeProject.central_purpose,
            methodology: activeProject.methodology,
            offers: activeProject.offers
          }
        }
      });

      if (error) {
        if (error.message?.includes('insufficient_credits') || error.context?.error === 'insufficient_credits') {
          toast.error('Créditos insuficientes para regenerar análise. Adicione créditos em Configurações > Workspace > Créditos.');
          throw error;
        }
        if (error.message?.includes('rate_limit') || error.context?.error === 'rate_limit') {
          toast.error('Limite de requisições excedido. Tente novamente em alguns instantes.');
          throw error;
        }
        throw error;
      }

      const updatedSegment: AudienceSegment = {
        ...localSegment,
        advanced_analysis: data.analysis,
        analysis_generated_at: new Date().toISOString()
      };

      const updatedSegments = allSegments.map(s =>
        s.id === segment.id ? updatedSegment : s
      );

      const { error: updateError } = await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject.id);

      if (updateError) throw updateError;

      // Atualizar estado local imediatamente para refletir na UI
      setLocalSegment(updatedSegment);
      // Também atualizar editedAnalysis para manter sincronizado
      setEditedAnalysis(data.analysis);
      // Atualizar estado do pai
      onUpdate(updatedSegments);
      // Depois recarregar do banco para sincronizar
      await refreshProjects();
      toast.success('Análise regenerada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao regenerar análise:', error);
      if (!error.message?.includes('insufficient_credits') && !error.message?.includes('rate_limit')) {
        toast.error('Erro ao regenerar análise. Tente novamente.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditedAnalysis((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Se não tem análise gerada ainda, mostrar botão para gerar
  if (!localSegment.advanced_analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-muted-foreground text-center">
          Gere uma análise avançada com IA para este segmento de público
        </p>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando Análise...
            </>
          ) : (
            'Gerar Análise Avançada'
          )}
        </Button>
      </div>
    );
  }

  // Se já tem análise, mostrar a visualização
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
        <div className="flex-1">
        {localSegment.analysis_generated_at && (
            <p className="text-xs text-muted-foreground">
              Gerada em: {new Date(localSegment.analysis_generated_at).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        
        <div className="flex gap-2 shrink-0">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="gap-2"
              >
                <Pencil size={16} />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="gap-2"
              >
                <RotateCw size={16} className={isGenerating ? 'animate-spin' : ''} />
                {isGenerating ? 'Regenerando...' : 'Regenerar'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="gap-2"
              >
                <X size={16} />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                <Save size={16} />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          )}
        </div>
      </div>

      <AdvancedAnalysisView
        segment={localSegment}
        isEditing={isEditing}
        editedAnalysis={editedAnalysis}
        onFieldChange={handleFieldChange}
      />
      
      {/* Botão de conclusão final */}
      {onClose && !isEditing && (
        <div className="flex justify-end pt-6 border-t border-border mt-6">
          <Button onClick={onClose} size="lg">
            Concluir e Fechar
          </Button>
        </div>
      )}
    </div>
  );
}
