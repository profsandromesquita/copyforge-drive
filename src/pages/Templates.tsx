import { useNavigate } from 'react-router-dom';
import { SquaresFour, MagnifyingGlass, CheckSquare, XSquare } from 'phosphor-react';
import { Input } from '@/components/ui/input';
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import { Button } from '@/components/ui/button';
import { useTemplates } from '@/hooks/useTemplates';
import TemplateCard from '@/components/templates/TemplateCard';
import { TemplateCardSkeleton } from '@/components/templates/TemplateCardSkeleton';
import { CopyDestinationModal } from '@/components/discover/CopyDestinationModal';
import { CopySuccessDialog } from '@/components/discover/CopySuccessDialog';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useProject } from '@/hooks/useProject';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import { TypeFilter } from '@/components/filters/TypeFilter';
import { CreatorFilter } from '@/components/filters/CreatorFilter';
import { DateFilter, DateFilterType } from '@/components/filters/DateFilter';
import { startOfDay, endOfDay, subDays, startOfYear, endOfYear, subYears } from 'date-fns';
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
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useInView } from 'react-intersection-observer';

const Templates = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProject();
  const { createCopy, createFolder } = useDrive();

  // Estados de filtro
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>(null);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>();

  // Debounce search para evitar muitas requisições
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Calcular datas para filtro server-side
  const getDateRangeValues = useCallback(() => {
    const now = new Date();
    switch (selectedDateFilter) {
      case 'today':
        return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
      case 'last7days':
        return { from: startOfDay(subDays(now, 7)).toISOString(), to: endOfDay(now).toISOString() };
      case 'last30days':
        return { from: startOfDay(subDays(now, 30)).toISOString(), to: endOfDay(now).toISOString() };
      case 'thisYear':
        return { from: startOfYear(now).toISOString(), to: endOfYear(now).toISOString() };
      case 'lastYear':
        const lastYear = subYears(now, 1);
        return { from: startOfYear(lastYear).toISOString(), to: endOfYear(lastYear).toISOString() };
      case 'custom':
        return { 
          from: dateRange?.from?.toISOString() || null, 
          to: dateRange?.to?.toISOString() || null 
        };
      default:
        return { from: null, to: null };
    }
  }, [selectedDateFilter, dateRange]);

  const dateValues = getDateRangeValues();

  // Hook com filtros server-side
  const { 
    templates, 
    loading, 
    loadingMore,
    hasMore,
    loadMore,
    createFromTemplate, 
    deleteTemplate, 
    deleteTemplates, 
    duplicateTemplate 
  } = useTemplates({
    searchQuery: debouncedSearch,
    selectedType,
    selectedCreator,
    dateFrom: dateValues.from,
    dateTo: dateValues.to,
  });

  // Infinite scroll
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });
  
  useEffect(() => {
    if (inView && hasMore && !loadingMore && !loading) {
      loadMore();
    }
  }, [inView, hasMore, loadingMore, loading, loadMore]);

  // Estados de UI
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [createCopyOpen, setCreateCopyOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  
  // Estados para fluxo de sucesso
  const [isCopying, setIsCopying] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdCopy, setCreatedCopy] = useState<{ id: string; title: string } | null>(null);

  // Estados de seleção em massa
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Força modo claro no Templates
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  // Listener para ativar seleção via long press
  useEffect(() => {
    const handleActivateSelection = () => setSelectionMode(true);
    window.addEventListener('activate-selection-mode', handleActivateSelection);
    return () => window.removeEventListener('activate-selection-mode', handleActivateSelection);
  }, []);

  // Atalhos de teclado
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

  // Handlers de seleção
  const toggleTemplateSelection = useCallback((id: string) => {
    setSelectedTemplateIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedTemplateIds(new Set(templates.map(t => t.id)));
  }, [templates]);

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
              {templates.length > 0 && (
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
            ) : templates.length === 0 ? (
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
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

                {/* Infinite scroll trigger */}
                {hasMore && (
                  <div ref={loadMoreRef} className="py-4">
                    {loadingMore && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <TemplateCardSkeleton key={`skeleton-more-${i}`} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
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

      {/* Toolbar de seleção em massa */}
      {selectionMode && (
        <BulkSelectionToolbar
          selectedCount={selectedTemplateIds.size}
          totalCount={templates.length}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onDelete={() => setBulkDeleteDialogOpen(true)}
          onExitSelectionMode={handleExitSelectionMode}
          isDeleting={isDeleting}
        />
      )}

      {/* Dialog de confirmação bulk delete */}
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
