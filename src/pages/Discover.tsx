import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Sparkle } from 'phosphor-react';
import { Input } from '@/components/ui/input';
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import { useDiscover } from '@/hooks/useDiscover';
import { DiscoverCard } from '@/components/discover/DiscoverCard';
import { useState, useEffect } from 'react';
import { CopyDestinationModal } from '@/components/discover/CopyDestinationModal';
import { CopySuccessDialog } from '@/components/discover/CopySuccessDialog';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useProject } from '@/hooks/useProject';
import { useTheme } from 'next-themes';
import { TypeFilter } from '@/components/filters/TypeFilter';
import { SortFilter, SortType } from '@/components/filters/SortFilter';
import copyDriveIcon from "@/assets/copydrive-icon.svg";
import { UserMenu } from '@/components/layout/UserMenu';

const Discover = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { copies, loading, copyCopy, deleteCopy, moveCopy } = useDiscover();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProject();
  const [selectedCopyId, setSelectedCopyId] = useState<string | null>(null);
  const [selectedCopyTitle, setSelectedCopyTitle] = useState<string>('');
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<SortType>('popular');

  // Estados para fluxo de sucesso
  const [isCopying, setIsCopying] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdCopy, setCreatedCopy] = useState<{ id: string; title: string } | null>(null);

  // Força modo claro no Discover
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  const handleCopy = (copyId: string) => {
    const copy = copies.find(c => c.id === copyId);
    setSelectedCopyId(copyId);
    setSelectedCopyTitle(copy?.title || '');
    setShowDestinationModal(true);
  };

  const handleConfirmDestination = async (folderId: string | null) => {
    if (!selectedCopyId || !activeWorkspace?.id || !user?.id) return;

    setIsCopying(true);
    setCopyingId(selectedCopyId);
    setShowDestinationModal(false);

    try {
      await copyCopy(
        selectedCopyId,
        activeWorkspace.id,
        activeProject?.id || null,
        folderId,
        user.id,
        (newCopyId) => {
          // Mostrar dialog de sucesso em vez de redirecionar
          setCreatedCopy({ id: newCopyId, title: selectedCopyTitle });
          setSuccessDialogOpen(true);
        }
      );
    } finally {
      setIsCopying(false);
      setCopyingId(null);
      setSelectedCopyId(null);
      setSelectedCopyTitle('');
    }
  };

  const filteredCopies = copies
    .filter((copy: any) => {
      // Search filter
      if (searchQuery && !copy.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Type filter
      if (selectedType && copy.copy_type !== selectedType) {
        return false;
      }

      return true;
    })
    .sort((a: any, b: any) => {
      if (selectedSort === 'popular') {
        return (b.copy_count || 0) - (a.copy_count || 0);
      } else {
        // Sort by creation date for recents
        return new Date(b.sessions?.[0]?.created_at || 0).getTime() - new Date(a.sessions?.[0]?.created_at || 0).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
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
                  placeholder="Buscar copies públicas..."
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
        </header>

        <main className="flex-1 pb-20 lg:pb-0 rounded-tl-3xl overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
          {/* Filters */}
          <div className="sticky top-0 z-40 rounded-tl-3xl" style={{ backgroundColor: '#f5f5f5' }}>
            <div className="px-6 py-4 flex items-center gap-2 flex-wrap">
              <TypeFilter selectedType={selectedType} onTypeChange={setSelectedType} />
              <SortFilter selectedSort={selectedSort} onSortChange={setSelectedSort} />
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
            ) : filteredCopies.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Nenhuma copy encontrada. Tente outros termos de busca.'
                    : 'Nenhuma copy pública disponível no momento'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCopies.map((copy) => (
                  <DiscoverCard
                    key={copy.id}
                    copy={copy}
                    onCopy={handleCopy}
                    onDelete={deleteCopy}
                    onMove={moveCopy}
                    isCopying={isCopying}
                    copyingId={copyingId}
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
    </div>
  );
};

export default Discover;
