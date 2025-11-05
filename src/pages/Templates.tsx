import { useNavigate } from 'react-router-dom';
import { Sparkle, MagnifyingGlass } from 'phosphor-react';
import { Input } from '@/components/ui/input';
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
import { TypeFilter } from '@/components/filters/TypeFilter';
import { CreatorFilter } from '@/components/filters/CreatorFilter';
import { DateFilter, DateFilterType } from '@/components/filters/DateFilter';
import { startOfDay, endOfDay, subDays, startOfYear, endOfYear, subYears, isWithinInterval } from 'date-fns';
import copyDriveIcon from "@/assets/copydrive-icon.svg";

const Templates = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { templates, loading, createFromTemplate, deleteTemplate, duplicateTemplate } = useTemplates();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProject();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>(null);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>();

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

  const [searchQuery, setSearchQuery] = useState('');

  const handleDateFilterChange = (type: DateFilterType, range?: { from?: Date; to?: Date }) => {
    setSelectedDateFilter(type);
    setDateRange(range);
  };

  const getDateRange = () => {
    const now = new Date();
    switch (selectedDateFilter) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'last7days':
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case 'last30days':
        return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      case 'thisYear':
        return { from: startOfYear(now), to: endOfYear(now) };
      case 'lastYear':
        const lastYear = subYears(now, 1);
        return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
      case 'custom':
        return dateRange;
      default:
        return null;
    }
  };

  const filteredTemplates = templates.filter(template => {
    // Search filter
    if (searchQuery && !template.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Type filter
    if (selectedType && template.copy_type !== selectedType) {
      return false;
    }

    // Creator filter
    if (selectedCreator && template.created_by !== selectedCreator) {
      return false;
    }

    // Date filter
    if (selectedDateFilter) {
      const range = getDateRange();
      if (range) {
        const updatedAt = new Date(template.updated_at);
        if (range.from && range.to) {
          if (!isWithinInterval(updatedAt, { start: range.from, end: range.to })) {
            return false;
          }
        } else if (range.from && updatedAt < range.from) {
          return false;
        } else if (range.to && updatedAt > range.to) {
          return false;
        }
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header com barra de pesquisa */}
        <header className="bg-background px-6 py-4 sticky top-0 z-40">
          <div className="flex-1 max-w-md relative">
            <MagnifyingGlass 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Buscar modelos..."
              className="pl-10 bg-muted/30 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0 rounded-tl-3xl overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
          {/* Filters */}
          <div className="sticky top-0 z-40 rounded-tl-3xl" style={{ backgroundColor: '#f5f5f5' }}>
            <div className="px-6 py-4 flex items-center gap-2 flex-wrap">
              <TypeFilter selectedType={selectedType} onTypeChange={setSelectedType} />
              <CreatorFilter selectedCreator={selectedCreator} onCreatorChange={setSelectedCreator} />
              <DateFilter 
                selectedDateFilter={selectedDateFilter} 
                dateRange={dateRange}
                onDateFilterChange={handleDateFilterChange}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                  <img 
                    src={copyDriveIcon} 
                    alt="Loading" 
                    className="h-16 animate-spin"
                  />
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                </div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Sparkle size={32} className="text-primary" weight="duotone" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {searchQuery ? 'Nenhum modelo encontrado' : 'Nenhum modelo ainda'}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchQuery 
                    ? 'Tente usar outros termos de busca.'
                    : 'Crie seu primeiro modelo salvando uma copy como modelo no editor. Modelos ajudam a agilizar a criação de novas copies.'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate('/dashboard')}>
                    Ir para Dashboard
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
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
      </div>

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
