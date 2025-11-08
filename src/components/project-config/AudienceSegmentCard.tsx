import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, Trash, Sparkles } from 'lucide-react';
import { AudienceSegment } from '@/types/project-config';

interface AudienceSegmentCardProps {
  segment: AudienceSegment;
  onEdit: (segment: AudienceSegment) => void;
  onDelete: (segmentId: string) => void;
  onViewAnalysis?: (segment: AudienceSegment) => void;
}

export const AudienceSegmentCard = ({ 
  segment, 
  onEdit, 
  onDelete,
  onViewAnalysis 
}: AudienceSegmentCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base mb-1 truncate">{segment.id}</h3>
          {segment.analysis_generated_at && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Análise IA gerada
            </Badge>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(segment)}>
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(segment.id)}>
            <Trash size={16} className="text-destructive" />
          </Button>
        </div>
      </div>

      {onViewAnalysis && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Button 
                  variant={segment.advanced_analysis ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                  onClick={() => onViewAnalysis(segment)}
                  disabled={!segment.is_completed}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {segment.advanced_analysis ? 'Ver Análise Avançada IA' : 'Gerar Análise Avançada IA'}
                </Button>
              </div>
            </TooltipTrigger>
            {!segment.is_completed && (
              <TooltipContent>
                <p>Conclua o preenchimento das 7 perguntas para habilitar</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
