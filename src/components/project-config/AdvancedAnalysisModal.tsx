import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AudienceSegment } from '@/types/project-config';
import { Pencil, Save, X, RotateCw } from 'lucide-react';
import { AdvancedAnalysisView } from './AdvancedAnalysisView';

interface AdvancedAnalysisModalProps {
  segment: AudienceSegment;
  open: boolean;
  onClose: () => void;
  onSave: (analysis: any) => Promise<void>;
  onRegenerate: () => Promise<void>;
}

export function AdvancedAnalysisModal({
  segment,
  open,
  onClose,
  onSave,
  onRegenerate,
}: AdvancedAnalysisModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState(segment.advanced_analysis || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleEdit = () => {
    setEditedAnalysis(segment.advanced_analysis || {});
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(editedAnalysis);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedAnalysis(segment.advanced_analysis || {});
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await onRegenerate();
    setIsRegenerating(false);
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditedAnalysis((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">Análise Avançada de Público</DialogTitle>
              <DialogDescription className="mt-2">
                {segment.id}
              </DialogDescription>
              {segment.analysis_generated_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Gerada em: {new Date(segment.analysis_generated_at).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            
            <div className="flex gap-2 shrink-0">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="gap-2"
                  >
                    <Pencil size={16} />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="gap-2"
                  >
                    <RotateCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
                    {isRegenerating ? 'Regenerando...' : 'Regenerar'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="gap-2"
                  >
                    <X size={16} />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <Save size={16} />
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <AdvancedAnalysisView
          segment={segment}
          isEditing={isEditing}
          editedAnalysis={editedAnalysis}
          onFieldChange={handleFieldChange}
        />
      </DialogContent>
    </Dialog>
  );
}