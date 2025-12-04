import { useState, useMemo, memo } from 'react';
import { Eye, Copy as CopyIcon, MoreVertical, Trash, FolderInput, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PreviewModal } from '@/components/copy-editor/PreviewModal';
import { BlockPreview } from '@/components/copy-editor/BlockPreview';
import { Session } from '@/types/copy-editor';
import copyDriveLogo from '@/assets/copydrive-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MoveModal from '@/components/drive/MoveModal';
import { useAuth } from '@/hooks/useAuth';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';

interface DiscoverCardProps {
  copy: {
    id: string;
    title: string;
    sessions: Session[];
    copy_count: number;
    copy_type?: string;
    created_by: string;
    creator: {
      name: string;
      avatar_url: string | null;
    };
  };
  onCopy: (copyId: string) => void;
  onDelete?: (copyId: string) => Promise<void> | void;
  onMove?: (copyId: string, targetFolderId: string | null) => Promise<void> | void;
  isCopying?: boolean;
  copyingId?: string | null;
}

const COPY_TYPE_LABELS: Record<string, string> = {
  'landing_page': 'Landing Page',
  'anuncio': 'Anúncio',
  'vsl': 'Video de Vendas',
  'email': 'E-mail',
  'webinar': 'Webinar',
  'conteudo': 'Conteúdo',
  'mensagem': 'Mensagem',
  'outro': 'Outro',
};

export const DiscoverCard = memo(({ 
  copy, 
  onCopy, 
  onDelete, 
  onMove,
  isCopying = false,
  copyingId = null,
}: DiscoverCardProps) => {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Verificar se o usuário é o dono
  const isOwner = user?.id === copy.created_by;
  const isThisCopying = isCopying && copyingId === copy.id;

  // Memoizar extração de blocos para evitar recálculo a cada render
  const firstBlocks = useMemo(() => {
    if (!copy.sessions || copy.sessions.length === 0) return [];
    const firstSession = copy.sessions[0];
    return firstSession.blocks.slice(0, 4);
  }, [copy.sessions]);

  // Memoizar extração de imagem para evitar recálculo a cada render
  const firstImage = useMemo(() => {
    if (!copy.sessions || copy.sessions.length === 0) return null;
    
    for (const session of copy.sessions) {
      for (const block of session.blocks) {
        if (block.type === 'image' && block.config?.imageUrl) {
          return block.config.imageUrl;
        }
      }
    }
    return null;
  }, [copy.sessions]);

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
        {/* Visual Preview Section */}
        <div className="relative h-48 md:h-56 bg-gradient-to-br from-background via-muted/10 to-muted/30 overflow-hidden border-b">
          {firstImage ? (
            // Thumbnail de imagem
            <>
              <img 
                src={firstImage} 
                alt={copy.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
            </>
          ) : firstBlocks.length > 0 ? (
            // Preview de blocos
            <>
              <div className="absolute inset-0 p-2 md:p-3 overflow-hidden">
                <div className="space-y-0.5 scale-[0.55] md:scale-[0.6] origin-top-left transform-gpu pointer-events-none" style={{ width: '165%' }}>
                  {firstBlocks.map((block) => (
                    <div key={block.id} className="opacity-90 preview-scale">
                      <BlockPreview block={block} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Bottom Fade Overlay */}
              <div className="absolute bottom-0 inset-x-0 h-16 md:h-20 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
            </>
          ) : (
            // Fallback: Logo CopyDrive
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={copyDriveLogo} 
                alt="CopyDrive"
                className="w-24 h-24 object-contain opacity-30"
              />
            </div>
          )}
          {/* Preview Icon Badge e Menu */}
          <div className="absolute top-2 right-2 flex items-center gap-2">
            {isOwner && onDelete && onMove && (
              <DropdownMenu>
                <DropdownMenuTrigger 
                  onClick={(e) => e.stopPropagation()}
                  className="bg-background/80 backdrop-blur-sm p-1.5 rounded-md hover:bg-background transition-colors"
                >
                  <MoreVertical size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border z-50">
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoveModalOpen(true);
                    }}
                  >
                    <FolderInput size={16} className="mr-2" />
                    Mover
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="cursor-pointer text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash size={16} className="mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
              <Eye className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        </div>

        <CardContent className="flex-1 p-4 md:p-6">
          <div className="space-y-3">
            {/* Title */}
            <div>
              <h2 className="text-lg md:text-xl font-bold line-clamp-1">{copy.title}</h2>
              {copy.copy_type && (
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {COPY_TYPE_LABELS[copy.copy_type] || copy.copy_type}
                </p>
              )}
            </div>

            {/* Creator Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={copy.creator.avatar_url || undefined} />
                <AvatarFallback>
                  {copy.creator.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{copy.creator.name}</p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {copy.copy_count} {copy.copy_count === 1 ? 'cópia' : 'cópias'}
              </Badge>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button
            className="flex-1"
            onClick={() => onCopy(copy.id)}
            disabled={isThisCopying}
          >
            {isThisCopying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CopyIcon className="h-4 w-4 mr-2" />
            )}
            {isThisCopying ? 'Copiando...' : 'Copiar'}
          </Button>
        </CardFooter>
      </Card>

      <PreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        title={copy.title}
        sessions={copy.sessions}
      />

      {onMove && (
        <MoveModal
          open={moveModalOpen}
          onOpenChange={setMoveModalOpen}
          itemId={copy.id}
          itemType="copy"
          currentFolderId={null}
          onMove={async (targetFolderId) => {
            await onMove(copy.id, targetFolderId);
          }}
        />
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={copy.title}
        itemType="copy"
        onConfirm={() => {
          if (onDelete) {
            onDelete(copy.id);
          }
          setDeleteDialogOpen(false);
        }}
      />
    </>
  );
});
