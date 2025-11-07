import { useState } from 'react';
import { Eye, Copy as CopyIcon, MoreVertical, Trash, FolderInput } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PreviewModal } from '@/components/copy-editor/PreviewModal';
import { Copy } from '@/types/copy-editor';
import copyDriveLogo from '@/assets/copydrive-logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MoveModal from '@/components/drive/MoveModal';
import { useAuth } from '@/hooks/useAuth';

interface TemplateCardProps {
  template: Copy;
  onUse: (templateId: string) => void;
  onEdit: (templateId: string) => void;
  onDuplicate: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  onMove: (templateId: string, targetFolderId: string | null) => Promise<void> | void;
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

const TemplateCard = ({ template, onUse, onEdit, onDuplicate, onDelete, onMove }: TemplateCardProps) => {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  
  // Verificar se o usuário é o dono
  const isOwner = user?.id === template.created_by;

  const getFirstImage = () => {
    if (!template.sessions || template.sessions.length === 0) return null;
    
    for (const session of template.sessions) {
      for (const block of session.blocks) {
        if (block.type === 'image' && block.config?.imageUrl) {
          return block.config.imageUrl;
        }
      }
    }
    return null;
  };

  const firstImage = getFirstImage();

  const getPreviewContent = () => {
    if (!template.sessions || template.sessions.length === 0) return null;
    const firstSession = template.sessions[0];
    const firstBlocks = firstSession.blocks.slice(0, 6);

    return firstBlocks.map((block) => {
      if (block.type === 'headline') {
        return (
          <h3 key={block.id} className="text-base font-bold line-clamp-1 mb-2">
            {block.content}
          </h3>
        );
      }
      if (block.type === 'subheadline') {
        return (
          <h4 key={block.id} className="text-sm font-semibold line-clamp-1 mb-1.5">
            {block.content}
          </h4>
        );
      }
      if (block.type === 'text') {
        return (
          <p key={block.id} className="text-xs text-muted-foreground/80 line-clamp-2 mb-1.5">
            {block.content}
          </p>
        );
      }
      if (block.type === 'list' && Array.isArray(block.content)) {
        return (
          <ul key={block.id} className="text-xs text-muted-foreground/80 space-y-0.5 mb-1.5">
            {block.content.slice(0, 2).map((item, i) => (
              <li key={i} className="line-clamp-1">• {item}</li>
            ))}
          </ul>
        );
      }
      return null;
    });
  };

  const sessionsCount = template.sessions?.length || 0;
  const blocksCount = template.sessions?.reduce((acc, session) => acc + (session.blocks?.length || 0), 0) || 0;

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
        {/* Visual Preview Section */}
        <div className="relative h-36 md:h-48 bg-gradient-to-br from-background via-muted/10 to-muted/30 overflow-hidden border-b">
          {firstImage ? (
            // Thumbnail de imagem
            <>
              <img 
                src={firstImage} 
                alt={template.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
            </>
          ) : (
            // Fallback: Preview de texto ou logo
            <>
              <div className="absolute inset-0 p-4 md:p-6 scale-90 opacity-70 origin-top-left">
                <div className="space-y-1">
                  {getPreviewContent()}
                </div>
              </div>
              {/* Bottom Fade Overlay */}
              <div className="absolute bottom-0 inset-x-0 h-12 md:h-16 bg-gradient-to-t from-background/90 via-background/50 to-transparent pointer-events-none" />
            </>
          )}
          {/* Preview Icon Badge e Menu */}
          <div className="absolute top-2 right-2 flex items-center gap-2">
            {isOwner && (
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
                      if (confirm(`Deseja realmente excluir o modelo "${template.title}"?`)) {
                        onDelete(template.id);
                      }
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

        <CardContent className="flex-1 p-3 md:p-6">
          <div className="space-y-3">
            {/* Title */}
            <div>
              <h2 className="text-lg md:text-xl font-bold truncate">{template.title}</h2>
              {template.copy_type && (
                <p className="text-xs text-muted-foreground/60 mt-1 truncate">
                  {COPY_TYPE_LABELS[template.copy_type] || template.copy_type}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {sessionsCount} {sessionsCount === 1 ? 'sessão' : 'sessões'} • {blocksCount} {blocksCount === 1 ? 'bloco' : 'blocos'}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                Modelo
              </Badge>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-3 md:p-4 pt-0 gap-1.5 md:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-0"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4 xl:mr-2" />
            <span className="hidden xl:inline truncate">Visualizar</span>
          </Button>
          <Button
            size="sm"
            className="flex-1 min-w-0"
            onClick={() => onUse(template.id)}
          >
            <CopyIcon className="h-4 w-4 xl:mr-2" />
            <span className="hidden xl:inline truncate">Copiar</span>
          </Button>
        </CardFooter>
      </Card>

      <PreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        title={template.title}
        sessions={template.sessions}
      />

      <MoveModal
        open={moveModalOpen}
        onOpenChange={setMoveModalOpen}
        itemId={template.id}
        itemType="copy"
        currentFolderId={template.folder_id || null}
        onMove={async (targetFolderId) => {
          await onMove(template.id, targetFolderId);
        }}
      />
    </>
  );
};

export default TemplateCard;
