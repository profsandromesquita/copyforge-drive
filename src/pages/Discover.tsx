import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass } from 'phosphor-react';
import { Input } from '@/components/ui/input';
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import { useDiscover } from '@/hooks/useDiscover';
import { DiscoverCard } from '@/components/discover/DiscoverCard';
import { DiscoverCardSkeleton } from '@/components/discover/DiscoverCardSkeleton';
import { useState, useEffect, useRef, useCallback } from 'react';
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
import { useDebouncedValue } from '@/hooks/useDebouncedValue';


const Discover = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProject();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<SortType>('popular');
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  
  // Use the optimized hook with server-side filtering
  const { 
    copies, 
    loading, 
    loadingMore,
    hasMore,
    loadMore,
    copyCopy, 
    toggleLike, 
    isLikedByUser,
    isLiking,
  } = useDiscover({
    search: debouncedSearch,
    type: selectedType,
    sort: selectedSort,
    limit: 20,
  });

  // Copy modal states
  const [selectedCopyId, setSelectedCopyId] = useState<string | null>(null);
  const [selectedCopyTitle, setSelectedCopyTitle] = useState<string>('');
  const [showDestinationModal, setShowDestinationModal] = useState(false);

  // Copy flow states
  const [isCopying, setIsCopying] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdCopy, setCreatedCopy] = useState<{ id: string; title: string } | null>(null);

  // Infinite scroll sentinel ref
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Force light mode on Discover
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  const handleCopy = useCallback((copyId: string) => {
    const copy = copies.find(c => c.id === copyId);
    setSelectedCopyId(copyId);
    setSelectedCopyTitle(copy?.title || '');
    setShowDestinationModal(true);
  }, [copies]);

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
            ) : copies.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Nenhuma copy encontrada. Tente outros termos de busca.'
                    : 'Nenhuma copy pública disponível no momento'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {copies.map((copy) => (
                    <DiscoverCard
                      key={copy.id}
                      copy={copy}
                      onCopy={handleCopy}
                      onLike={toggleLike}
                      isLikedByUser={isLikedByUser(copy.id)}
                      isLiking={isLiking(copy.id)}
                      isCopying={isCopying}
                      copyingId={copyingId}
                    />
                  ))}
                </div>
                
                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="h-4" />
                
                {/* Loading more indicator */}
                {loadingMore && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <DiscoverCardSkeleton key={`skeleton-${i}`} />
                    ))}
                  </div>
                )}
                
                {/* End of list indicator */}
                {!hasMore && copies.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Você viu todas as copies!</p>
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
    </div>
  );
};

export default Discover;
