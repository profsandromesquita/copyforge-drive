import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AudienceSegment } from '@/types/project-config';
import { Pencil, Check, X, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AdvancedAnalysisModalProps {
  segment: AudienceSegment;
  open: boolean;
  onClose: () => void;
  onSave: (updatedAnalysis: string) => Promise<void>;
  onRegenerate: () => Promise<void>;
}

export const AdvancedAnalysisModal = ({ 
  segment, 
  open, 
  onClose, 
  onSave,
  onRegenerate 
}: AdvancedAnalysisModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState(segment.advanced_analysis || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedAnalysis);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate();
      setEditedAnalysis(segment.advanced_analysis || '');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCancel = () => {
    setEditedAnalysis(segment.advanced_analysis || '');
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Análise Avançada do Público
            </DialogTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isRegenerating ? 'Regenerando...' : 'Regenerar'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {segment.analysis_generated_at && (
            <p className="text-xs text-muted-foreground mb-4">
              Gerada em: {new Date(segment.analysis_generated_at).toLocaleString('pt-BR')}
            </p>
          )}

          {isEditing ? (
            <Textarea
              value={editedAnalysis}
              onChange={(e) => setEditedAnalysis(e.target.value)}
              className="min-h-[500px] font-mono text-sm"
              placeholder="Digite a análise em markdown..."
            />
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>
                {segment.advanced_analysis || 'Nenhuma análise disponível.'}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
