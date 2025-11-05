import { useState } from 'react';
import { Eye, Copy as CopyIcon } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PreviewModal } from '@/components/copy-editor/PreviewModal';
import { BlockPreview } from '@/components/copy-editor/BlockPreview';
import { Session } from '@/types/copy-editor';

interface DiscoverCardProps {
  copy: {
    id: string;
    title: string;
    sessions: Session[];
    copy_count: number;
    creator: {
      name: string;
      avatar_url: string | null;
    };
  };
  onCopy: (copyId: string) => void;
}

export const DiscoverCard = ({ copy, onCopy }: DiscoverCardProps) => {
  const [showPreview, setShowPreview] = useState(false);

  const getFirstBlocks = () => {
    if (!copy.sessions || copy.sessions.length === 0) return [];
    const firstSession = copy.sessions[0];
    return firstSession.blocks.slice(0, 4); // Pegar os 4 primeiros blocos
  };

  const firstBlocks = getFirstBlocks();

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
        {/* Visual Preview Section */}
        <div className="relative h-48 md:h-56 bg-gradient-to-br from-background via-muted/10 to-muted/30 overflow-hidden border-b">
          <div className="absolute inset-0 p-4 md:p-6 overflow-hidden">
            <div className="space-y-2 scale-75 origin-top-left transform-gpu pointer-events-none">
              {firstBlocks.length > 0 ? (
                firstBlocks.map((block) => (
                  <div key={block.id} className="opacity-80">
                    <BlockPreview block={block} />
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">Sem conteúdo para visualizar</p>
                </div>
              )}
            </div>
          </div>
          {/* Bottom Fade Overlay */}
          <div className="absolute bottom-0 inset-x-0 h-16 md:h-20 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
          {/* Preview Icon Badge */}
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
            <Eye className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        <CardContent className="flex-1 p-4 md:p-6">
          <div className="space-y-3">
            {/* Title */}
            <h2 className="text-lg md:text-xl font-bold line-clamp-1">{copy.title}</h2>

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
          >
            <CopyIcon className="h-4 w-4 mr-2" />
            Copiar
          </Button>
        </CardFooter>
      </Card>

      <PreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        title={copy.title}
        sessions={copy.sessions}
      />
    </>
  );
};
