import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MagnifyingGlass, FolderPlus } from "phosphor-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import DriveCard from "@/components/drive/DriveCard";
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
  const { folders, copies, loading, navigateToFolder, createCopy } = useDrive();
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createCopyOpen, setCreateCopyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 pb-20 lg:pb-0 bg-[#EEEEEE]">
        {/* Header */}
        <div className="bg-[#EEEEEE] sticky top-0 z-40">
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
        <div className="p-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredFolders.map((folder) => (
                    <DriveCard
                      key={folder.id}
                      id={folder.id}
                      type="folder"
                      title={folder.name}
                      folderId={folder.parent_id}
                      subtitle={`Criada ${formatDistanceToNow(new Date(folder.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}`}
                      onClick={() => navigateToFolder(folder.id)}
                    />
                  ))}
                  {filteredCopies.map((copy: any) => (
                    <DriveCard
                      key={copy.id}
                      id={copy.id}
                      type="copy"
                      title={copy.title}
                      folderId={copy.folder_id}
                      creatorName={copy.creator?.name}
                      creatorAvatar={copy.creator?.avatar_url}
                      status={copy.status || 'draft'}
                      subtitle={formatDate(copy.updated_at)}
                      onClick={() => navigate(`/copy/${copy.id}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
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
