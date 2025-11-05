import { useNavigate } from 'react-router-dom';
import { Plus, Sparkle } from 'phosphor-react';
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import { Button } from '@/components/ui/button';
import { useTemplates } from '@/hooks/useTemplates';
import TemplateCard from '@/components/templates/TemplateCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CopyDestinationModal } from '@/components/discover/CopyDestinationModal';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useProject } from '@/hooks/useProject';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

const Templates = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { templates, loading, createFromTemplate, deleteTemplate, duplicateTemplate } = useTemplates();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProject();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);

  // Força modo claro no Templates
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  const handleUseTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setShowDestinationModal(true);
  };

  const handleConfirmDestination = async (folderId: string | null) => {
    if (!selectedTemplateId || !activeWorkspace?.id || !user?.id) return;

    const newCopy = await createFromTemplate(
      selectedTemplateId,
      activeWorkspace.id,
      activeProject?.id || null,
      folderId,
      user.id
    );

    if (newCopy) {
      navigate(`/copy/${newCopy.id}`);
    }

    setShowDestinationModal(false);
    setSelectedTemplateId(null);
  };

  const handleEditTemplate = (templateId: string) => {
    navigate(`/copy/${templateId}`);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 pb-20 lg:pb-0 bg-muted/30 rounded-tl-3xl overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Modelos</h1>
              <p className="text-muted-foreground">
                Crie copies rapidamente usando modelos pré-definidos
              </p>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Sparkle size={32} className="text-primary" weight="duotone" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Nenhum modelo ainda
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Crie seu primeiro modelo salvando uma copy como modelo no editor.
                Modelos ajudam a agilizar a criação de novas copies.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Ir para Dashboard
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={handleUseTemplate}
                  onEdit={handleEditTemplate}
                  onDuplicate={duplicateTemplate}
                  onDelete={deleteTemplate}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <MobileMenu />

      {activeWorkspace && (
        <CopyDestinationModal
          open={showDestinationModal}
          onOpenChange={setShowDestinationModal}
          onConfirm={handleConfirmDestination}
          workspaceId={activeWorkspace.id}
          projectId={activeProject?.id || null}
        />
      )}
    </div>
  );
};

export default Templates;
