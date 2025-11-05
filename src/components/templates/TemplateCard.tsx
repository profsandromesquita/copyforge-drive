import { useState } from 'react';
import { Eye, Copy as CopyIcon } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PreviewModal } from '@/components/copy-editor/PreviewModal';
import { Copy } from '@/types/copy-editor';

interface TemplateCardProps {
  template: Copy;
  onUse: (templateId: string) => void;
  onEdit: (templateId: string) => void;
  onDuplicate: (templateId: string) => void;
  onDelete: (templateId: string) => void;
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

const TemplateCard = ({ template, onUse, onEdit, onDuplicate, onDelete }: TemplateCardProps) => {
  const [showPreview, setShowPreview] = useState(false);

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
          <div className="absolute inset-0 p-4 md:p-6 scale-90 opacity-70 origin-top-left">
            <div className="space-y-1">
              {getPreviewContent()}
            </div>
          </div>
          {/* Bottom Fade Overlay */}
          <div className="absolute bottom-0 inset-x-0 h-12 md:h-16 bg-gradient-to-t from-background/90 via-background/50 to-transparent pointer-events-none" />
          {/* Preview Icon Badge */}
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
            <Eye className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        <CardContent className="flex-1 p-4 md:p-6">
          <div className="space-y-3">
            {/* Title */}
            <div>
              <h2 className="text-lg md:text-xl font-bold line-clamp-1">{template.title}</h2>
              {template.copy_type && (
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {COPY_TYPE_LABELS[template.copy_type] || template.copy_type}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {sessionsCount} {sessionsCount === 1 ? 'sessão' : 'sessões'} • {blocksCount} {blocksCount === 1 ? 'bloco' : 'blocos'}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                Modelo
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
            onClick={() => onUse(template.id)}
          >
            <CopyIcon className="h-4 w-4 mr-2" />
            Copiar
          </Button>
        </CardFooter>
      </Card>

      <PreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        title={template.title}
        sessions={template.sessions}
      />
    </>
  );
};

export default TemplateCard;
