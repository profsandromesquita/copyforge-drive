import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash } from 'phosphor-react';
import { AudienceSegment } from '@/types/project-config';
import { AWARENESS_LEVELS } from '@/types/project-config';

interface AudienceSegmentCardProps {
  segment: AudienceSegment;
  onEdit: (segment: AudienceSegment) => void;
  onDelete: (segmentId: string) => void;
}

export const AudienceSegmentCard = ({ segment, onEdit, onDelete }: AudienceSegmentCardProps) => {
  const awarenessLabel = AWARENESS_LEVELS.find(l => l.value === segment.awareness_level)?.label || segment.awareness_level;

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-lg">{segment.avatar}</h3>
          <p className="text-sm text-muted-foreground mt-1">{segment.segment}</p>
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
          <p className="font-medium">Situação atual:</p>
          <p className="text-muted-foreground">{segment.current_situation}</p>
        </div>

        <div>
          <p className="font-medium">Resultado desejado:</p>
          <p className="text-muted-foreground">{segment.desired_result}</p>
        </div>

        <div>
          <p className="font-medium">Nível de consciência:</p>
          <Badge variant="secondary">{awarenessLabel}</Badge>
        </div>

        {segment.objections && segment.objections.length > 0 && (
          <div>
            <p className="font-medium mb-2">Objeções:</p>
            <div className="flex flex-wrap gap-2">
              {segment.objections.map((objection, idx) => (
                <Badge key={idx} variant="outline">
                  {objection}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="font-medium">Tom de comunicação:</p>
          <p className="text-muted-foreground">{segment.communication_tone}</p>
        </div>
      </div>
    </div>
  );
};
