import { useNavigate } from 'react-router-dom';
import { Plus, Sparkle } from 'phosphor-react';
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import { Button } from '@/components/ui/button';
import { useTemplates } from '@/hooks/useTemplates';
import TemplateCard from '@/components/templates/TemplateCard';
import { Skeleton } from '@/components/ui/skeleton';

const Templates = () => {
  const navigate = useNavigate();
  const { templates, loading, createFromTemplate, deleteTemplate, duplicateTemplate } = useTemplates();

  const handleUseTemplate = async (templateId: string) => {
    const newCopy = await createFromTemplate(templateId);
    if (newCopy) {
      navigate(`/copy/${newCopy.id}`);
    }
  };

  const handleEditTemplate = (templateId: string) => {
    navigate(`/copy/${templateId}`);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="p-6 max-w-7xl mx-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </div>
  );
};

export default Templates;
