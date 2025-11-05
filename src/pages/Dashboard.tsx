import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const navigate = useNavigate();
  const { folders, copies, loading, navigateToFolder, createCopy, moveFolder, moveCopy } = useDrive();
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createCopyOpen, setCreateCopyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

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

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCopies = copies.filter(copy =>
    copy.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          />
        )
      };
    }
    
    return null;
  };

  const activeItem = getActiveItem();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 pb-20 lg:pb-0 bg-muted/30 rounded-tl-3xl overflow-hidden">
        {/* Header */}
        <div className="bg-muted/30 sticky top-0 z-40 rounded-tl-3xl">
          <div className="px-6 py-4 space-y-4">
            <Breadcrumbs />
            
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md relative">
                <MagnifyingGlass 
                  size={20} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Buscar..."
                  className="pl-10 bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Plus size={20} weight="bold" />
                    <span className="hidden sm:inline">Novo</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border z-50">
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => setCreateCopyOpen(true)}
                  >
                    <Plus size={18} className="mr-2" />
                    Nova Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => setCreateFolderOpen(true)}
                  >
                    <FolderPlus size={18} className="mr-2" />
                    Nova Pasta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {filteredFolders.length === 0 && filteredCopies.length === 0 ? (
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
