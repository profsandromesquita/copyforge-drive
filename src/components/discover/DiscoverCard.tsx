import { useState } from 'react';
import { Eye, Copy as CopyIcon } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PreviewModal } from '@/components/copy-editor/PreviewModal';
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

  const getPreviewContent = () => {
    if (!copy.sessions || copy.sessions.length === 0) return null;
    const firstSession = copy.sessions[0];
    const firstBlocks = firstSession.blocks.slice(0, 3);

    return firstBlocks.map((block) => {
      if (block.type === 'headline') {
        return (
          <h3 key={block.id} className="text-lg font-semibold line-clamp-2">
            {block.content}
          </h3>
        );
      }
      if (block.type === 'text') {
        return (
          <p key={block.id} className="text-sm text-muted-foreground line-clamp-2">
            {block.content}
          </p>
        );
      }
      return null;
    });
  };

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        <CardContent className="flex-1 p-6">
          <div className="space-y-3">
            {/* Preview Content */}
            <div className="min-h-[80px] space-y-2">
              {getPreviewContent()}
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold line-clamp-1">{copy.title}</h2>

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
