import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash } from 'lucide-react';
import { AudienceSegment } from '@/types/project-config';

interface AudienceSegmentCardProps {
  segment: AudienceSegment;
  onEdit: (segment: AudienceSegment) => void;
  onDelete: (segmentId: string) => void;
}

export const AudienceSegmentCard = ({ 
  segment, 
  onEdit, 
  onDelete
}: AudienceSegmentCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base mb-1 truncate">{segment.id}</h3>
          {segment.analysis_generated_at && (
            <Badge variant="secondary" className="text-xs">
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
    </div>
  );
};
