import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, DragStartEvent } from "@dnd-kit/core";
import { Plus, MagnifyingGlass, FolderPlus } from "phosphor-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import FolderCard from "@/components/drive/FolderCard";
import CopyCard from "@/components/drive/CopyCard";
import { Breadcrumbs } from "@/components/drive/Breadcrumbs";
import { CreateFolderDialog } from "@/components/drive/CreateFolderDialog";
import { CreateCopyDialog, CopyType } from "@/components/drive/CreateCopyDialog";
import { useDrive } from "@/hooks/useDrive";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, startOfDay, endOfDay, subDays, startOfYear, endOfYear, subYears, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import copyDriveIcon from "@/assets/copydrive-icon.svg";
import { TypeFilter } from '@/components/filters/TypeFilter';
import { CreatorFilter } from '@/components/filters/CreatorFilter';
import { DateFilter, DateFilterType } from '@/components/filters/DateFilter';
import { UserMenu } from '@/components/layout/UserMenu';
import { useProject } from '@/hooks/useProject';

const Dashboard = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { activeProject } = useProject();
  const { folders, copies, loading, navigateToFolder, createCopy, moveFolder, moveCopy } = useDrive();
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createCopyOpen, setCreateCopyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>(null);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Força modo claro no Dashboard
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleCreateCopy = async (name: string, type: CopyType) => {
    const copy = await createCopy(name, type);
    if (copy) {
      setCreateCopyOpen(false);
      navigate(`/copy/${copy.id}`);
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

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCopies = copies.filter((copy: any) => {
    // Search filter
    if (searchQuery && !copy.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Type filter
    if (selectedType && copy.copy_type !== selectedType) {
      return false;
    }

    // Creator filter
    if (selectedCreator && copy.created_by !== selectedCreator) {
      return false;
    }

    // Date filter
    if (selectedDateFilter) {
      const range = getDateRange();
      if (range) {
        const updatedAt = new Date(copy.updated_at);
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

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ptBR 
    }).replace('há cerca de ', '').replace('há ', '');
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Se soltar sobre uma pasta
    if (overData?.type === 'folder') {
      const targetFolderId = over.id as string;
      
      if (activeData?.type === 'folder') {
        // Mover pasta para dentro de outra pasta
        await moveFolder(active.id as string, targetFolderId);
      } else if (activeData?.type === 'copy') {
        // Mover copy para dentro da pasta
        await moveCopy(active.id as string, targetFolderId);
      }
    }
  };

  const getActiveItem = () => {
    if (!activeId) return null;
    
    const folder = filteredFolders.find(f => f.id === activeId);
    if (folder) {
      return { 
        type: 'folder' as const, 
        component: (
          <FolderCard
            id={folder.id}
            title={folder.name}
            folderId={folder.parent_id}
          />
        )
      };
    }
    
    const copy = filteredCopies.find((c: any) => c.id === activeId);
    if (copy) {
      return { 
        type: 'copy' as const, 
        component: (
          <CopyCard
            id={copy.id}
            title={copy.title}
            folderId={copy.folder_id}
            creatorName={copy.creator?.name}
            creatorAvatar={copy.creator?.avatar_url}
            status={(copy as any).status || 'draft'}
            subtitle={formatDate(copy.updated_at)}
            sessions={(copy as any).sessions}
            copyType={(copy as any).copy_type}
          />
        )
      };
    }
    
    return null;
  };

  const activeItem = getActiveItem();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        onCreateCopy={activeProject ? () => setCreateCopyOpen(true) : undefined}
        onCreateFolder={activeProject ? () => setCreateFolderOpen(true) : undefined}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header com barra de pesquisa */}
        <header className="bg-background px-6 py-4 sticky top-0 z-40">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlass 
                  size={20} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Buscar..."
                  className="pl-10 bg-muted/30 rounded-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <img 
                src="/favicon.svg" 
                alt="CopyDrive" 
                className="h-7 opacity-90"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                  aria-label="Buscar"
                >
                  <MagnifyingGlass size={20} className="text-muted-foreground" />
                </button>
                <UserMenu />
              </div>
            </div>
            
            {/* Expanded Search Bar */}
            {isSearchExpanded && (
              <div className="mt-3">
                <div className="relative">
                  <MagnifyingGlass 
                    size={20} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="Buscar..."
                    className="pl-10 bg-muted/30 rounded-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0 rounded-tl-3xl overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
          {/* Breadcrumbs */}
          <div className="sticky top-0 z-40 rounded-tl-3xl" style={{ backgroundColor: '#f5f5f5' }}>
            <div className="px-6 py-4">
              <Breadcrumbs />
            </div>
            {/* Filters */}
            <div className="px-6 pb-4 flex items-center gap-2 flex-wrap">
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
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <DragOverlay dropAnimation={{
              duration: 200,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
              {activeItem && (
                <div className="rotate-3 scale-105 opacity-90">
                  {activeItem.component}
                </div>
              )}
            </DragOverlay>
            
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
            ) : (
              <>
                {!activeProject ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center max-w-md">
                      <div className="mb-6">
                        <img 
                          src={copyDriveIcon} 
                          alt="CopyDrive" 
                          className="h-16 mx-auto mb-4 opacity-50"
                        />
                        <h2 className="text-xl font-semibold mb-2">Nenhum projeto selecionado</h2>
                        <p className="text-muted-foreground mb-6">
                          Para começar a criar pastas e copies, você precisa primeiro criar ou selecionar um projeto.
                        </p>
                      </div>
                      <Button onClick={() => navigate('/project/new')} size="lg">
                        <Plus size={20} className="mr-2" />
                        Criar Primeiro Projeto
                      </Button>
                    </div>
                  </div>
                ) : filteredFolders.length === 0 && filteredCopies.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum item nesta pasta'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setCreateFolderOpen(true)}>
                        <FolderPlus size={20} className="mr-2" />
                        Criar Primeira Pasta
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Folders Section */}
                    {filteredFolders.length > 0 && (
                      <div>
                        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                          Pastas
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                          {filteredFolders.map((folder) => (
                            <FolderCard
                              key={folder.id}
                              id={folder.id}
                              title={folder.name}
                              folderId={folder.parent_id}
                              onClick={() => navigateToFolder(folder.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Copies Section */}
                    {filteredCopies.length > 0 && (
                      <div>
                        <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                          Copies
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredCopies.map((copy: any) => (
                            <CopyCard
                              key={copy.id}
                              id={copy.id}
                              title={copy.title}
                              folderId={copy.folder_id}
                              creatorName={copy.creator?.name}
                              creatorAvatar={copy.creator?.avatar_url}
                              status={copy.status || 'draft'}
                              subtitle={formatDate(copy.updated_at)}
                              sessions={copy.sessions}
                              copyType={copy.copy_type}
                              onClick={() => navigate(`/copy/${copy.id}`)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </DndContext>
          </div>
        </main>
      </div>

      <MobileMenu />
      <CreateFolderDialog open={createFolderOpen} onOpenChange={setCreateFolderOpen} />
      <CreateCopyDialog 
        open={createCopyOpen} 
        onOpenChange={setCreateCopyOpen}
        onCreateCopy={handleCreateCopy}
      />
    </div>
  );
};

export default Dashboard;
