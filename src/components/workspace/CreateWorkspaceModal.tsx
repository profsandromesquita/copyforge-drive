import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspace } from '@/hooks/useWorkspace';
import { toast } from 'sonner';
import { UpgradeModal } from './UpgradeModal';

interface CreateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WorkspaceLimitCheck {
  can_create: boolean;
  current_count: number;
  max_allowed: number;
}

export const CreateWorkspaceModal = ({ open, onOpenChange }: CreateWorkspaceModalProps) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string | null>(null);
  const { user } = useAuth();
  const { refreshWorkspaces, setActiveWorkspace } = useWorkspace();

  const handleCreate = async () => {
    if (!name.trim() || name.trim().length < 3) {
      toast.error('Nome do workspace deve ter pelo menos 3 caracteres');
      return;
    }

    if (!user?.id) {
      toast.error('Usuário não encontrado');
      return;
    }

    setLoading(true);
    try {
      // Verificar limite de workspaces free
      const { data: limitCheck, error: limitError } = await supabase
        .rpc('can_create_free_workspace', { _user_id: user.id });

      if (limitError) throw limitError;

      const limitData = limitCheck as unknown as WorkspaceLimitCheck;
      const isOverLimit = !limitData.can_create;

      // Criar workspace (ativo se dentro do limite, inativo se excedeu)
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({ 
          name: name.trim(), 
          created_by: user.id,
          is_active: !isOverLimit // Inativo se excedeu o limite
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Add user as owner
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      if (isOverLimit) {
        // Workspace criado mas inativo - mostrar modal de upgrade
        toast.info('Workspace criado! Escolha um plano para ativá-lo.');
        setCreatedWorkspaceId(workspace.id);
        setShowUpgradeModal(true);
        setLoading(false);
        return;
      }

      // Workspace ativo - sucesso normal
      toast.success('Workspace criado com sucesso!');
      await refreshWorkspaces();
      
      // Set as active workspace
      setActiveWorkspace({
        id: workspace.id,
        name: workspace.name,
        role: 'owner',
      });

      onOpenChange(false);
      setName('');
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Erro ao criar workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeModalClose = async (open: boolean) => {
    setShowUpgradeModal(open);
    if (!open) {
      // Refresh workspaces ao fechar o modal
      await refreshWorkspaces();
      onOpenChange(false);
      setName('');
      setCreatedWorkspaceId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Workspace</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Nome do Workspace</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Meu Workspace"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreate();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? 'Criando...' : 'Criar Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={handleUpgradeModalClose}
        limitType="general"
        workspaceId={createdWorkspaceId || undefined}
      />
    </>
  );
};
