import { useState, useEffect } from 'react';
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
import { Plus, X } from 'lucide-react';
import { Methodology } from '@/types/project-config';
import { MethodologyCard } from './MethodologyCard';
import { MethodologyForm } from './MethodologyForm';
import { useProject } from '@/hooks/useProject';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const MethodologyTab = () => {
  const { activeProject, refreshProjects } = useProject();
  const [methodologies, setMethodologies] = useState<Methodology[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMethodology, setEditingMethodology] = useState<Methodology | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [methodologyToDelete, setMethodologyToDelete] = useState<string | null>(null);

  const EDITING_STORAGE_KEY = `methodology-editing-${activeProject?.id}`;

  useEffect(() => {
    if (activeProject?.methodology) {
      const methodologiesArray = Array.isArray(activeProject.methodology)
        ? activeProject.methodology
        : [];
      setMethodologies(methodologiesArray);
      
      // Restore editing state after reload
      const editingMethodologyId = localStorage.getItem(EDITING_STORAGE_KEY);
      if (editingMethodologyId) {
        const methodologyToEdit = methodologiesArray.find(m => m.id === editingMethodologyId);
        if (methodologyToEdit) {
          setEditingMethodology(methodologyToEdit);
          setIsFormOpen(true);
        }
      }
    }
  }, [activeProject, EDITING_STORAGE_KEY]);

  const handleAddMethodology = () => {
    localStorage.removeItem(EDITING_STORAGE_KEY);
    setEditingMethodology(null);
    setIsFormOpen(true);
  };

  const handleEditMethodology = (methodology: Methodology) => {
    localStorage.setItem(EDITING_STORAGE_KEY, methodology.id);
    setEditingMethodology(methodology);
    setIsFormOpen(true);
  };

  const handleDeleteMethodology = (methodologyId: string) => {
    setMethodologyToDelete(methodologyId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMethodology = async () => {
    if (!methodologyToDelete || !activeProject) return;

    try {
      const updatedMethodologies = methodologies.filter(m => m.id !== methodologyToDelete);
      
      await supabase
        .from('projects')
        .update({ methodology: updatedMethodologies as any })
        .eq('id', activeProject.id);

      await refreshProjects();
      setMethodologies(updatedMethodologies);
      toast.success('Metodologia excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir metodologia:', error);
      toast.error('Erro ao excluir metodologia');
    } finally {
      setDeleteDialogOpen(false);
      setMethodologyToDelete(null);
    }
  };

  const handleCancelForm = () => {
    localStorage.removeItem(EDITING_STORAGE_KEY);
    setIsFormOpen(false);
    setEditingMethodology(null);
  };

  const handleSaveMethodologies = (updatedMethodologies: Methodology[]) => {
    setMethodologies(updatedMethodologies);
    setIsFormOpen(false);
    setEditingMethodology(null);
  };

  return (
    <div className="space-y-6">
      {!isFormOpen && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Metodologias</h2>
            {methodologies.length > 0 && (
              <Button onClick={handleAddMethodology}>
                <Plus size={20} className="mr-2" />
                Adicionar Metodologia
              </Button>
            )}
          </div>

          {methodologies.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground mb-4">
                Nenhuma metodologia criada ainda
              </p>
              <Button onClick={handleAddMethodology}>
                <Plus size={20} className="mr-2" />
                Criar Primeira Metodologia
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {methodologies.map((methodology) => (
                <MethodologyCard
                  key={methodology.id}
                  methodology={methodology}
                  onEdit={handleEditMethodology}
                  onDelete={handleDeleteMethodology}
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
              {editingMethodology ? 'Editar' : 'Nova'} Metodologia
            </h2>
            <Button variant="ghost" size="icon" onClick={handleCancelForm}>
              <X size={20} />
            </Button>
          </div>
          
          <MethodologyForm
          editingMethodology={editingMethodology}
          allMethodologies={methodologies}
          onSave={handleSaveMethodologies}
          onUpdate={setMethodologies}
          onCancel={handleCancelForm}
          onAutoSavingChange={setIsAutoSaving}
          />
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta metodologia? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMethodology}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
