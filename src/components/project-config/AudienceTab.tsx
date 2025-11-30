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
import { useProject } from '@/hooks/useProject';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AudienceTabProps {
  onSaveSuccess?: () => void;
}

export const AudienceTab = ({ onSaveSuccess }: AudienceTabProps) => {
  const { activeProject, refreshProjects } = useProject();
  const [segments, setSegments] = useState<AudienceSegment[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<AudienceSegment | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (activeProject?.audience_segments) {
      setSegments(activeProject.audience_segments);
    }
  }, [activeProject]);

  // Atualizar editingSegment quando segments mudar (autosave)
  useEffect(() => {
    if (editingSegment && segments.length > 0) {
      const updatedSegment = segments.find(s => s.id === editingSegment.id);
      if (updatedSegment && JSON.stringify(updatedSegment) !== JSON.stringify(editingSegment)) {
        setEditingSegment(updatedSegment);
      }
    }
  }, [segments, editingSegment]);

  // Persistir estado do formulário em sessionStorage
  useEffect(() => {
    const savedState = sessionStorage.getItem('audienceFormState');
    if (savedState && !isFormOpen) {
      try {
        const { isFormOpen: savedOpen, editingSegmentId } = JSON.parse(savedState);
        if (savedOpen && activeProject?.audience_segments) {
          const segment = activeProject.audience_segments.find(s => s.id === editingSegmentId);
          if (segment) {
            setEditingSegment(segment);
            setIsFormOpen(true);
          }
        }
      } catch (e) {
        console.error('Error loading form state:', e);
      }
    }
  }, [activeProject]);

  // Salvar estado quando mudar
  useEffect(() => {
    sessionStorage.setItem('audienceFormState', JSON.stringify({
      isFormOpen,
      editingSegmentId: editingSegment?.id || null
    }));
  }, [isFormOpen, editingSegment]);

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
    // Limpar estado persistido
    sessionStorage.removeItem('audienceFormState');
  };

  return (
    <div className="space-y-6">
      {!isFormOpen && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Público-alvo</h2>
            {segments.length > 0 && (
              <Button onClick={handleAddSegment}>
                <Plus size={20} className="mr-2" />
                Adicionar Público-alvo
              </Button>
            )}
          </div>

          {segments.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground mb-4">
                Nenhum público-alvo criado ainda
              </p>
              <Button onClick={handleAddSegment}>
                <Plus size={20} className="mr-2" />
                Criar Primeiro Público-alvo
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
              {editingSegment ? 'Editar' : 'Novo'} Público-alvo
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Público-alvo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este público-alvo? 
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
