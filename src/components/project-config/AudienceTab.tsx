import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, X } from 'phosphor-react';
import { AudienceSegment } from '@/types/project-config';
import { AudienceSegmentForm } from './AudienceSegmentForm';
import { AudienceSegmentCard } from './AudienceSegmentCard';
import { AdvancedAnalysisModal } from './AdvancedAnalysisModal';
import { useProject } from '@/hooks/useProject';
import { useWorkspace } from '@/hooks/useWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AudienceTabProps {
  onSaveSuccess?: () => void;
}

export const AudienceTab = ({ onSaveSuccess }: AudienceTabProps) => {
  const { activeProject, refreshProjects } = useProject();
  const { activeWorkspace } = useWorkspace();
  const [segments, setSegments] = useState<AudienceSegment[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<AudienceSegment | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [analysisModalSegment, setAnalysisModalSegment] = useState<AudienceSegment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<string | null>(null);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [generatingSegmentId, setGeneratingSegmentId] = useState<string | null>(null);

  useEffect(() => {
    if (activeProject?.audience_segments) {
      setSegments(activeProject.audience_segments);
    }
  }, [activeProject]);

  const handleAddSegment = () => {
    setEditingSegment(null);
    setIsFormOpen(true);
  };

  const handleEditSegment = (segment: AudienceSegment) => {
    setEditingSegment(segment);
    setIsFormOpen(true);
  };

  const handleDeleteSegment = (segmentId: string) => {
    setSegmentToDelete(segmentId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSegment = async () => {
    if (!segmentToDelete || !activeProject) return;

    try {
      const updatedSegments = segments.filter(s => s.id !== segmentToDelete);
      
      await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject.id);

      await refreshProjects();
      setSegments(updatedSegments);
      toast.success('Segmento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir segmento:', error);
      toast.error('Erro ao excluir segmento');
    } finally {
      setDeleteDialogOpen(false);
      setSegmentToDelete(null);
    }
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingSegment(null);
  };

  const handleSaveAnalysis = async (segmentId: string, updatedAnalysis: any) => {
    if (!activeProject) return;

    try {
      const updatedSegments = segments.map(s =>
        s.id === segmentId ? { ...s, advanced_analysis: updatedAnalysis } : s
      );

      await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject.id);

      await refreshProjects();
      setSegments(updatedSegments);
      toast.success('Análise atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar análise:', error);
      toast.error('Erro ao salvar análise');
    }
  };

  const handleViewOrGenerateAnalysis = async (segment: AudienceSegment) => {
    // Se já tem análise, apenas visualiza
    if (segment.advanced_analysis) {
      setAnalysisModalSegment(segment);
      return;
    }

    // Se não tem análise, gera antes de abrir o modal
    if (!activeWorkspace) return;

    setIsGeneratingAnalysis(true);
    setGeneratingSegmentId(segment.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-audience', {
        body: { 
          segment,
          workspace_id: activeWorkspace.id 
        }
      });

      if (error) {
        // Tratar erros específicos da API
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
        ...segment,
        advanced_analysis: data.analysis,
        analysis_generated_at: new Date().toISOString()
      };

      const updatedSegments = segments.map(s =>
        s.id === segment.id ? updatedSegment : s
      );

      await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject?.id);

      await refreshProjects();
      setSegments(updatedSegments);
      setAnalysisModalSegment(updatedSegment);
      toast.success('Análise gerada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar análise:', error);
      // Mensagem genérica apenas se não foi tratada acima
      if (!error.message?.includes('insufficient_credits') && !error.message?.includes('rate_limit')) {
        toast.error('Erro ao gerar análise. Tente novamente.');
      }
    } finally {
      setIsGeneratingAnalysis(false);
      setGeneratingSegmentId(null);
    }
  };

  const handleRegenerateAnalysis = async (segment: AudienceSegment) => {
    if (!activeWorkspace) return;

    try {
      const { data, error } = await supabase.functions.invoke('analyze-audience', {
        body: { 
          segment,
          workspace_id: activeWorkspace.id 
        }
      });

      if (error) {
        // Tratar erros específicos da API
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
        ...segment,
        advanced_analysis: data.analysis,
        analysis_generated_at: new Date().toISOString()
      };

      const updatedSegments = segments.map(s =>
        s.id === segment.id ? updatedSegment : s
      );

      await supabase
        .from('projects')
        .update({ audience_segments: updatedSegments as any })
        .eq('id', activeProject?.id);

      await refreshProjects();
      setSegments(updatedSegments);
      setAnalysisModalSegment(updatedSegment);
      toast.success('Análise regenerada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao regenerar análise:', error);
      // Mensagem genérica apenas se não foi tratada acima
      if (!error.message?.includes('insufficient_credits') && !error.message?.includes('rate_limit')) {
        toast.error('Erro ao regenerar análise. Tente novamente.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {!isFormOpen && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Segmentos de Público</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Defina os diferentes segmentos de público que você deseja atingir
              </p>
            </div>
            {segments.length > 0 && (
              <Button onClick={handleAddSegment}>
                <Plus size={20} className="mr-2" />
                Adicionar Segmento
              </Button>
            )}
          </div>

          {segments.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground mb-4">
                Nenhum segmento de público criado ainda
              </p>
              <Button onClick={handleAddSegment}>
                <Plus size={20} className="mr-2" />
                Criar Primeiro Segmento
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {segments.map((s) => (
                <AudienceSegmentCard
                  key={s.id}
                  segment={s}
                  onEdit={handleEditSegment}
                  onDelete={handleDeleteSegment}
                  onViewAnalysis={handleViewOrGenerateAnalysis}
                  isGenerating={isGeneratingAnalysis && generatingSegmentId === s.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {isFormOpen && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {editingSegment ? 'Editar' : 'Novo'} Segmento de Público
            </h2>
            <Button variant="ghost" size="icon" onClick={handleCancelForm}>
              <X size={20} />
            </Button>
          </div>
          
          <AudienceSegmentForm
            segment={editingSegment}
            allSegments={segments}
            onSave={(newSegments) => {
              setSegments(newSegments);
              setIsFormOpen(false);
              setEditingSegment(null);
              if (!editingSegment) {
                onSaveSuccess?.();
              }
            }}
            onCancel={handleCancelForm}
            onAutoSavingChange={setIsAutoSaving}
          />
        </div>
      )}

      {analysisModalSegment && (
        <AdvancedAnalysisModal
          segment={analysisModalSegment}
          open={!!analysisModalSegment}
          onClose={() => setAnalysisModalSegment(null)}
          onSave={(analysis) => handleSaveAnalysis(analysisModalSegment.id, analysis)}
          onRegenerate={() => handleRegenerateAnalysis(analysisModalSegment)}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Segmento de Público</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este segmento de público? 
              Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSegment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
