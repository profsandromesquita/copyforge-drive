import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import { DiscoverCard } from '@/components/discover/DiscoverCard';
import { CopyDestinationModal } from '@/components/discover/CopyDestinationModal';
import { useDiscover } from '@/hooks/useDiscover';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useProject } from '@/hooks/useProject';

const Discover = () => {
  const navigate = useNavigate();
  const { copies, loading, copyCopy } = useDiscover();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { activeProject } = useProject();
  const [selectedCopyId, setSelectedCopyId] = useState<string | null>(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Descobrir</h1>
            <p className="text-muted-foreground">
              Explore e copie copies criadas por outros usuários
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : copies.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                Nenhuma copy pública disponível no momento
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {copies.map((copy) => (
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
