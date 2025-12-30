import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Loader2, Eye, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { useWorkspaceCopies } from "@/hooks/useWorkspaceCopies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface WorkspaceCopiesTabProps {
  workspaceId: string;
}

export const WorkspaceCopiesTab = ({ workspaceId }: WorkspaceCopiesTabProps) => {
  const navigate = useNavigate();
  const [copyTypeFilter, setCopyTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [isTemplateFilter, setIsTemplateFilter] = useState<string | undefined>(undefined);
  const [copyToDelete, setCopyToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: copies, isLoading, refetch } = useWorkspaceCopies({
    workspaceId,
    copyType: copyTypeFilter,
    status: statusFilter,
    isTemplate: isTemplateFilter === "true" ? true : isTemplateFilter === "false" ? false : undefined,
  });

  const handleDeleteCopy = async () => {
    if (!copyToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('copies')
        .delete()
        .eq('id', copyToDelete);

      if (error) throw error;

      toast.success('Copy deletada com sucesso');
      setCopyToDelete(null);
      refetch();
    } catch (error) {
      console.error('Error deleting copy:', error);
      toast.error('Erro ao deletar copy');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleTemplate = async (copyId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('copies')
        .update({ is_template: !currentValue })
        .eq('id', copyId);

      if (error) throw error;

      toast.success(currentValue ? 'Removido dos templates' : 'Marcado como template');
      refetch();
    } catch (error) {
      console.error('Error toggling template:', error);
      toast.error('Erro ao atualizar template');
    }
  };

  const handleToggleDiscover = async (copyId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('copies')
        .update({ show_in_discover: !currentValue })
        .eq('id', copyId);

      if (error) throw error;

      toast.success(currentValue ? 'Removido do Discover' : 'Adicionado ao Discover');
      refetch();
    } catch (error) {
      console.error('Error toggling discover:', error);
      toast.error('Erro ao atualizar Discover');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">Publicado</Badge>;
      case 'draft':
        return <Badge variant="secondary">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <Select value={copyTypeFilter || undefined} onValueChange={(value) => setCopyTypeFilter(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os Tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="landing-page">Landing Page</SelectItem>
              <SelectItem value="social-media">Social Media</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter || undefined} onValueChange={(value) => setStatusFilter(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={isTemplateFilter || undefined} onValueChange={(value) => setIsTemplateFilter(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Apenas Templates</SelectItem>
              <SelectItem value="false">Não Templates</SelectItem>
            </SelectContent>
          </Select>

          {(copyTypeFilter || statusFilter || isTemplateFilter) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setCopyTypeFilter(undefined);
                setStatusFilter(undefined);
                setIsTemplateFilter(undefined);
              }}
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Copies Table */}
      {copies && copies.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Criador</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {copies.map((copy) => (
                <TableRow key={copy.id}>
                  <TableCell className="font-medium">{copy.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{copy.copy_type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(copy.status)}</TableCell>
                  <TableCell>{copy.project?.name || '-'}</TableCell>
                  <TableCell>{copy.creator.name}</TableCell>
                  <TableCell>{format(new Date(copy.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {copy.is_template && <Badge variant="secondary">Template</Badge>}
                      {copy.is_public && <Badge variant="outline">Público</Badge>}
                      {copy.show_in_discover && <Badge variant="default">Discover</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/copy/${copy.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleTemplate(copy.id, copy.is_template)}
                        title={copy.is_template ? "Remover de templates" : "Marcar como template"}
                      >
                        <FileText className={`h-4 w-4 ${copy.is_template ? 'text-primary' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCopyToDelete(copy.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhuma copy encontrada com os filtros selecionados</p>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!copyToDelete} onOpenChange={() => setCopyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Copy</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta copy? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCopy} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
