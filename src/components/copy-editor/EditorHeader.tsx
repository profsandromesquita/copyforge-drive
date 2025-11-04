import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Upload, ShareNetwork } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCopyEditor } from '@/hooks/useCopyEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { PreviewModal } from './PreviewModal';
import { ImportModal } from './ImportModal';
import { ShareModal } from './ShareModal';
import { Session } from '@/types/copy-editor';

export const EditorHeader = () => {
  const navigate = useNavigate();
  const { copyId, copyTitle, setCopyTitle, isSaving, sessions, updateStatus, importSessions } = useCopyEditor();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handlePublish = async () => {
    await updateStatus('published');
  };

  const handleSaveAsDraft = async () => {
    await updateStatus('draft');
  };

  const handleSaveAsTemplate = async () => {
    if (!copyId || !activeWorkspace?.id || !user?.id) {
      toast.error('Informações necessárias não encontradas');
      return;
    }

    try {
      const { data: currentCopy, error: fetchError } = await supabase
        .from('copies')
        .select('*')
        .eq('id', copyId)
        .single();

      if (fetchError) throw fetchError;

      const { error: insertError } = await supabase
        .from('copies')
        .insert({
          title: `${currentCopy.title} (Modelo)`,
          workspace_id: currentCopy.workspace_id,
          project_id: currentCopy.project_id,
          copy_type: currentCopy.copy_type,
          sessions: currentCopy.sessions,
          is_template: true,
          status: 'draft',
          created_by: user.id,
        });

      if (insertError) throw insertError;

      toast.success('Modelo criado com sucesso!', {
        description: 'Você pode encontrá-lo na página de Modelos.',
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Erro ao criar modelo');
    }
  };

  const handleImport = (importedSessions: Session[]) => {
    importSessions(importedSessions);
  };

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {isEditingTitle ? (
          <Input
            value={copyTitle}
            onChange={(e) => setCopyTitle(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingTitle(false);
            }}
            className="max-w-xs"
            autoFocus
          />
        ) : (
          <h1
            className="text-lg font-semibold cursor-pointer hover:text-primary"
            onClick={() => setIsEditingTitle(true)}
          >
            {copyTitle}
          </h1>
        )}

        <span className="text-sm text-muted-foreground">
          {isSaving ? 'Salvando...' : 'Salvo'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
          <Eye className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Pré-visualizar</span>
        </Button>

        <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
          <Upload className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Importar</span>
        </Button>

        <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
          <ShareNetwork className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Compartilhar</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Publicar</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handlePublish}>
              Publicar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSaveAsDraft}>
              Salvar como rascunho
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSaveAsTemplate}>
              Salvar como Modelo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <PreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        title={copyTitle}
        sessions={sessions}
      />

      <ImportModal
        open={showImport}
        onOpenChange={setShowImport}
        onImport={handleImport}
      />

      {copyId && (
        <ShareModal
          open={showShare}
          onOpenChange={setShowShare}
          copyId={copyId}
        />
      )}
    </header>
  );
};
