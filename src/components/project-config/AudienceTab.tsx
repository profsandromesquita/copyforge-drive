import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'phosphor-react';
import { AudienceSegment } from '@/types/project-config';
import { AudienceSegmentCard } from './AudienceSegmentCard';
import { AudienceSegmentForm } from './AudienceSegmentForm';
import { useProject } from '@/hooks/useProject';

interface AudienceTabProps {
  onSaveSuccess?: () => void;
}

export const AudienceTab = ({ onSaveSuccess }: AudienceTabProps) => {
  const { activeProject } = useProject();
  const [segments, setSegments] = useState<AudienceSegment[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<AudienceSegment | null>(null);

  useEffect(() => {
    if (activeProject?.audience_segments) {
      setSegments(activeProject.audience_segments);
    }
  }, [activeProject]);

  const handleAddSegment = () => {
    setEditingSegment(null);
    setIsFormOpen(true);
  };

  const handleEditSegment = (segment: AudienceSegment) => {
    setEditingSegment(segment);
    setIsFormOpen(true);
  };

  const handleDeleteSegment = (segmentId: string) => {
    setSegments(segments.filter(s => s.id !== segmentId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Segmentos de Público</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Defina os diferentes segmentos de público que você deseja atingir
          </p>
        </div>
        <Button onClick={handleAddSegment}>
          <Plus size={20} className="mr-2" />
          Adicionar Segmento
        </Button>
      </div>

      {segments.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Nenhum segmento de público criado ainda
          </p>
          <Button onClick={handleAddSegment}>
            <Plus size={20} className="mr-2" />
            Criar Primeiro Segmento
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {segments.map((segment) => (
            <AudienceSegmentCard
              key={segment.id}
              segment={segment}
              onEdit={handleEditSegment}
              onDelete={handleDeleteSegment}
            />
          ))}
        </div>
      )}

      <AudienceSegmentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        segment={editingSegment}
        allSegments={segments}
        onSave={(newSegments) => {
          setSegments(newSegments);
          // Se é um novo segmento (não está editando), chama o callback
          if (!editingSegment) {
            onSaveSuccess?.();
          }
        }}
      />
    </div>
  );
};
