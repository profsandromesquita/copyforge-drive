import { useState, memo } from 'react';
import { Eye, Copy as CopyIcon, Loader2, Heart } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import copyDriveLogo from '@/assets/copydrive-logo.png';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { PreviewModal } from '@/components/copy-editor/PreviewModal';
import { Session } from '@/types/copy-editor';

interface DiscoverCardProps {
  copy: {
    id: string;
    title: string;
    copy_type?: string | null;
    copy_count: number;
    likes_count: number;
    created_by: string;
    preview_image_url: string | null;
    preview_text: string | null;
    creator: {
      name: string;
      avatar_url: string | null;
    };
  };
  onCopy: (copyId: string) => void;
  onLike?: (copyId: string) => void;
  isLikedByUser?: boolean;
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
  onLike,
  isLikedByUser = false,
  isCopying = false,
  copyingId = null,
}: DiscoverCardProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewSessions, setPreviewSessions] = useState<Session[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const isThisCopying = isCopying && copyingId === copy.id;

  // Lazy load full sessions only when preview is requested
  const handleShowPreview = async () => {
    if (previewSessions) {
      setShowPreview(true);
      return;
    }

    setLoadingPreview(true);
    try {
      const { data, error } = await supabase
        .from('public_copies')
        .select('sessions')
        .eq('id', copy.id)
        .single();

      if (error) throw error;
      
      setPreviewSessions(data.sessions as unknown as Session[]);
      setShowPreview(true);
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
        {/* Visual Preview Section - Now uses preview_image_url and preview_text from VIEW */}
        <div className="relative h-48 md:h-56 bg-gradient-to-br from-background via-muted/10 to-muted/30 overflow-hidden border-b">
          {copy.preview_image_url ? (
            // Thumbnail de imagem - URL vem diretamente da VIEW
            <>
              <img 
                src={copy.preview_image_url} 
                alt={copy.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
            </>
          ) : copy.preview_text ? (
            // Preview de texto - vem diretamente da VIEW
            <>
              <div className="absolute inset-0 p-4 overflow-hidden">
                <p className="text-sm text-muted-foreground line-clamp-6 leading-relaxed">
                  {copy.preview_text}
                </p>
              </div>
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
          {/* Preview Icon Badge */}
          <div className="absolute top-2 right-2 flex items-center gap-2">
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
              <div className="flex items-center gap-2 shrink-0">
                {/* Like Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike?.(copy.id);
                  }}
                  className="flex items-center gap-1 group"
                  aria-label={isLikedByUser ? 'Remover curtida' : 'Curtir copy'}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isLikedByUser
                        ? "fill-primary text-primary scale-110"
                        : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                    )}
                  />
                  <span className="text-sm text-muted-foreground">
                    {copy.likes_count || 0}
                  </span>
                </button>
                <Badge variant="secondary">
                  {copy.copy_count} {copy.copy_count === 1 ? 'cópia' : 'cópias'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleShowPreview}
            disabled={loadingPreview}
          >
            {loadingPreview ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
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

      {previewSessions && (
        <PreviewModal
          open={showPreview}
          onOpenChange={setShowPreview}
          title={copy.title}
          sessions={previewSessions}
        />
      )}
    </>
  );
});
