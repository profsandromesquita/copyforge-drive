import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <div className="bg-card border border-border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-lg">{segment.who_is}</h3>
          {segment.analysis_generated_at && (
            <Badge variant="secondary" className="mt-2">
              <Sparkles className="h-3 w-3 mr-1" />
              Análise IA gerada
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(segment)}>
            <Pencil size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(segment.id)}>
            <Trash size={18} className="text-destructive" />
          </Button>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-muted-foreground">O que mais quer:</p>
          <p className="line-clamp-2">{segment.biggest_desire}</p>
        </div>

        <div>
          <p className="font-medium text-muted-foreground">Maior dor:</p>
          <p className="line-clamp-2">{segment.biggest_pain}</p>
        </div>

        <div>
          <p className="font-medium text-muted-foreground">Jornada:</p>
          <p className="line-clamp-2">{segment.journey}</p>
        </div>
      </div>

      {segment.advanced_analysis && onViewAnalysis && (
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => onViewAnalysis(segment)}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Ver Análise Avançada
        </Button>
      )}
    </div>
  );
};
