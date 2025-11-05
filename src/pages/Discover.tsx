import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { MagnifyingGlass } from 'phosphor-react';
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import { Input } from '@/components/ui/input';
import { DiscoverCard } from '@/components/discover/DiscoverCard';
import { CopyDestinationModal } from '@/components/discover/CopyDestinationModal';
import { useDiscover } from '@/hooks/useDiscover';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useProject } from '@/hooks/useProject';

const Discover = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { copies, loading, copyCopy } = useDiscover();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProject();
  const [selectedCopyId, setSelectedCopyId] = useState<string | null>(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);

  // Força modo claro no Discover
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  const handleCopy = (copyId: string) => {
    setSelectedCopyId(copyId);
    setShowDestinationModal(true);
  };

  const handleConfirmDestination = (folderId: string | null) => {
    if (!selectedCopyId || !activeWorkspace?.id || !user?.id) return;

    copyCopy(
      selectedCopyId,
      activeWorkspace.id,
      activeProject?.id || null,
      folderId,
      user.id,
      (newCopyId) => {
        navigate(`/copy/${newCopyId}`);
      }
    );

    setShowDestinationModal(false);
    setSelectedCopyId(null);
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredCopies = copies.filter(copy =>
    copy.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              placeholder="Buscar copies públicas..."
              className="pl-10 bg-muted/30 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0 rounded-tl-3xl overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
          {/* Header da página */}
          <div className="sticky top-0 z-40 rounded-tl-3xl" style={{ backgroundColor: '#f5f5f5' }}>
            <div className="px-6 py-4">
              <h1 className="text-3xl font-bold mb-2">Descobrir</h1>
              <p className="text-muted-foreground">
                Explore e copie copies criadas por outros usuários
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Carregando...</p>
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

export default Discover;
