import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, FileText, FolderOpen, Globe, Layout } from 'lucide-react';

export interface ProjectDeletionImpact {
  totalCopies: number;
  totalFolders: number;
  publicCopies: number;
  templates: number;
}

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  impact: ProjectDeletionImpact;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
}

export const DeleteProjectDialog = ({
  open,
  onOpenChange,
  projectName,
  impact,
  onConfirm,
  isDeleting = false,
}: DeleteProjectDialogProps) => {
  const [confirmationText, setConfirmationText] = useState('');
  
  // Reset confirmation text when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setConfirmationText('');
    }
  }, [open]);

  const isConfirmationValid = confirmationText === projectName;
  const hasImpact = impact.totalCopies > 0 || impact.totalFolders > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4 text-left">
            <p>
              Você está prestes a excluir permanentemente o projeto{' '}
              <strong className="text-foreground">"{projectName}"</strong>.
            </p>
            
            {hasImpact && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Os seguintes itens serão excluídos permanentemente:
                </p>
                <ul className="space-y-2 text-sm">
                  {impact.totalCopies > 0 && (
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span><strong className="text-foreground">{impact.totalCopies}</strong> {impact.totalCopies === 1 ? 'copy' : 'copies'}</span>
                    </li>
                  )}
                  {impact.totalFolders > 0 && (
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <FolderOpen className="h-4 w-4" />
                      <span><strong className="text-foreground">{impact.totalFolders}</strong> {impact.totalFolders === 1 ? 'pasta' : 'pastas'}</span>
                    </li>
                  )}
                  {impact.publicCopies > 0 && (
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span><strong className="text-foreground">{impact.publicCopies}</strong> {impact.publicCopies === 1 ? 'link público' : 'links públicos'} (ficarão inacessíveis)</span>
                    </li>
                  )}
                  {impact.templates > 0 && (
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Layout className="h-4 w-4" />
                      <span><strong className="text-foreground">{impact.templates}</strong> {impact.templates === 1 ? 'modelo salvo' : 'modelos salvos'}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-delete" className="text-sm">
                Digite <strong className="text-foreground">{projectName}</strong> para confirmar:
              </Label>
              <Input
                id="confirm-delete"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Nome do projeto"
                disabled={isDeleting}
                autoComplete="off"
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting || !isConfirmationValid}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
