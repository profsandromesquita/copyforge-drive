import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check } from 'phosphor-react';
import { useProject } from '@/hooks/useProject';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProjectConfigHeaderProps {
  isNew: boolean;
}

export const ProjectConfigHeader = ({ isNew }: ProjectConfigHeaderProps) => {
  const navigate = useNavigate();
  const { activeProject, refreshProjects, createProject } = useProject();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingName, setIsEditingName] = useState(isNew);

  useEffect(() => {
    if (activeProject && !isNew) {
      // Usa brand_name se disponível, senão usa name
      setName(activeProject.brand_name || activeProject.name);
      setIsEditingName(false);
    } else if (isNew) {
      setName('Novo Projeto');
    }
  }, [activeProject?.id, activeProject?.name, activeProject?.brand_name, isNew]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome do projeto é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        const project = await createProject(name.trim());
        if (project) {
          toast.success('Projeto criado com sucesso!');
          navigate(`/project/${project.id}`);
        }
      } else if (activeProject) {
        const { error } = await supabase
          .from('projects')
          .update({ name: name.trim() })
          .eq('id', activeProject.id);

        if (error) throw error;

        toast.success('Nome atualizado com sucesso!');
        await refreshProjects();
        setIsEditingName(false);
      }
    } catch (error: any) {
      console.error('Error saving project:', error);
      if (error.code === '23505') {
        toast.error('Já existe um projeto com este nome neste workspace');
      } else {
        toast.error('Erro ao salvar projeto');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    navigate('/dashboard');
  };

  return (
    <div className="border-b border-border bg-background sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={20} />
          </Button>

          {isEditingName ? (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do projeto"
                disabled={isSaving}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave();
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
              >
                <Check size={16} />
              </Button>
            </div>
          ) : (
            <h1
              className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsEditingName(true)}
            >
              {name}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {isSaving ? 'Salvando...' : 'Salvo'}
          </span>
          <Button onClick={handleSaveAndClose} disabled={isSaving}>
            Salvar e Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
