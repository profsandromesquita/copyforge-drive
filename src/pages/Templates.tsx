import { useNavigate } from 'react-router-dom';
import { SquaresFour, MagnifyingGlass, CheckSquare, XSquare } from 'phosphor-react';
import { Input } from '@/components/ui/input';
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import { Button } from '@/components/ui/button';
import { useTemplates } from '@/hooks/useTemplates';
import TemplateCard from '@/components/templates/TemplateCard';
import { CopyDestinationModal } from '@/components/discover/CopyDestinationModal';
import { CopySuccessDialog } from '@/components/discover/CopySuccessDialog';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useProject } from '@/hooks/useProject';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { TypeFilter } from '@/components/filters/TypeFilter';
import { CreatorFilter } from '@/components/filters/CreatorFilter';
import { DateFilter, DateFilterType } from '@/components/filters/DateFilter';
import { startOfDay, endOfDay, subDays, startOfYear, endOfYear, subYears, isWithinInterval } from 'date-fns';
import copyDriveIcon from "@/assets/copydrive-icon.svg";
import { UserMenu } from '@/components/layout/UserMenu';
import { CreateCopyDialog, CopyType } from '@/components/drive/CreateCopyDialog';
import { CreateFolderDialog } from '@/components/drive/CreateFolderDialog';
import { useDrive } from '@/hooks/useDrive';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BulkSelectionToolbar } from '@/components/drive/BulkSelectionToolbar';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { cn } from '@/lib/utils';

const Templates = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { templates, loading, createFromTemplate, deleteTemplate, deleteTemplates, duplicateTemplate } = useTemplates();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProject();
  const { createCopy, createFolder } = useDrive();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [createCopyOpen, setCreateCopyOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>(null);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para fluxo de sucesso
  const [isCopying, setIsCopying] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdCopy, setCreatedCopy] = useState<{ id: string; title: string } | null>(null);

  // ✅ ESTADOS DE SELEÇÃO EM MASSA
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Força modo claro no Templates
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  // ✅ LISTENER PARA ATIVAR SELEÇÃO VIA LONG PRESS
  useEffect(() => {
    const handleActivateSelection = () => setSelectionMode(true);
    window.addEventListener('activate-selection-mode', handleActivateSelection);
    return () => window.removeEventListener('activate-selection-mode', handleActivateSelection);
  }, []);

  // ✅ ATALHOS DE TECLADO
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectionMode) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }
      if (e.key === 'Escape') {
        handleExitSelectionMode();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTemplateIds.size > 0) {
        e.preventDefault();
        setBulkDeleteDialogOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionMode, selectedTemplateIds]);

  const handleUseTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setShowDestinationModal(true);
  };

  const handleConfirmDestination = async (folderId: string | null) => {
    if (!selectedTemplateId || !activeWorkspace?.id || !user?.id) return;

    setIsCopying(true);
    setCopyingId(selectedTemplateId);

    try {
      const newCopy = await createFromTemplate(
        selectedTemplateId,
        activeWorkspace.id,
        activeProject?.id || null,
        folderId,
        user.id
      );

      setShowDestinationModal(false);
      setSelectedTemplateId(null);

      if (newCopy) {
        // Mostrar dialog de sucesso em vez de redirecionar
        setCreatedCopy({ id: newCopy.id, title: newCopy.title });
        setSuccessDialogOpen(true);
      }
    } finally {
      setIsCopying(false);
      setCopyingId(null);
    }
  };

  const handleEditTemplate = (templateId: string) => {
    navigate(`/copy/${templateId}`);
  };

  const handleCreateCopy = async (name: string, type: CopyType) => {
    const copy = await createCopy(name, type);
    if (copy) {
      setCreateCopyOpen(false);
      navigate(`/copy/${copy.id}`);
    }
  };

  const handleCreateFolder = async (name: string) => {
    await createFolder(name);
    setCreateFolderOpen(false);
    navigate('/drive');
  };

  const handleMoveTemplate = async (templateId: string, targetFolderId: string | null) => {
    try {
      const { error } = await supabase
        .from('copies')
        .update({ folder_id: targetFolderId })
        .eq('id', templateId);
      
      if (error) throw error;
      toast.success('Modelo movido com sucesso!');
      // Recarrega templates para atualizar a lista
      window.location.reload();
    } catch (error) {
      console.error('Error moving template:', error);
      toast.error('Erro ao mover modelo');
    }
  };

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

  // ✅ HANDLERS DE SELEÇÃO
  const toggleTemplateSelection = useCallback((id: string) => {
    setSelectedTemplateIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedTemplateIds(new Set(filteredTemplates.map(t => t.id)));
  }, [filteredTemplates]);

  const handleClearSelection = useCallback(() => {
    setSelectedTemplateIds(new Set());
  }, []);

  const handleExitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    handleClearSelection();
  }, [handleClearSelection]);

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTemplates(Array.from(selectedTemplateIds));
      handleExitSelectionMode();
    } finally {
      setIsDeleting(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        onCreateCopy={() => setCreateCopyOpen(true)}
        onCreateFolder={() => setCreateFolderOpen(true)}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header com barra de pesquisa */}
        <header className="bg-background px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
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
            </div>
            <div className="flex items-center gap-3">
              {/* Botão Selecionar */}
              {filteredTemplates.length > 0 && (
                <Button
                  variant={selectionMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectionMode ? handleExitSelectionMode() : setSelectionMode(true)}
                  className={cn(
                    "transition-all duration-200",
                    selectionMode && "ring-2 ring-primary/30 ring-offset-2"
                  )}
                >
                  {selectionMode ? (
                    <>
                      <XSquare size={16} className="mr-2" />
                      Cancelar
                    </>
                  ) : (
                    <>
                      <CheckSquare size={16} className="mr-2" />
                      Selecionar
                    </>
                  )}
                </Button>
              )}
              <UserMenu />
            </div>
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
                  <SquaresFour size={32} className="text-primary" weight="duotone" />
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
                  <Button onClick={() => navigate('/drive')}>
                    Ir para Drive
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
                    onMove={handleMoveTemplate}
                    isCopying={isCopying}
                    copyingId={copyingId}
                    selectionMode={selectionMode}
                    isSelected={selectedTemplateIds.has(template.id)}
                    onToggleSelect={toggleTemplateSelection}
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

      <CopySuccessDialog
        open={successDialogOpen}
        onOpenChange={setSuccessDialogOpen}
        copyTitle={createdCopy?.title || ''}
        onEditNow={() => {
          setSuccessDialogOpen(false);
          navigate(`/copy/${createdCopy?.id}`);
        }}
        onContinueExploring={() => {
          setSuccessDialogOpen(false);
          setCreatedCopy(null);
        }}
      />

      <CreateCopyDialog
        open={createCopyOpen}
        onOpenChange={setCreateCopyOpen}
        onCreateCopy={handleCreateCopy}
      />
      
      <CreateFolderDialog 
        open={createFolderOpen} 
        onOpenChange={setCreateFolderOpen}
      />

      {/* ✅ TOOLBAR DE SELEÇÃO EM MASSA */}
      {selectionMode && (
        <BulkSelectionToolbar
          selectedCount={selectedTemplateIds.size}
          totalCount={filteredTemplates.length}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onDelete={() => setBulkDeleteDialogOpen(true)}
          onExitSelectionMode={handleExitSelectionMode}
          isDeleting={isDeleting}
        />
      )}

      {/* ✅ DIALOG DE CONFIRMAÇÃO BULK DELETE */}
      <DeleteConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        itemName=""
        itemCount={selectedTemplateIds.size}
        onConfirm={handleBulkDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Templates;
