import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminWorkspaces } from "@/hooks/useAdminWorkspaces";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Eye, Trash } from "phosphor-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useWorkspacePlan } from "@/hooks/useWorkspacePlan";

const WorkspacePlanBadge = ({ workspaceId }: { workspaceId: string }) => {
  const { data: plan } = useWorkspacePlan(workspaceId);
  
  if (!plan) return null;
  
  return (
    <Badge variant="outline" className="ml-2 text-xs font-normal text-muted-foreground border-border/50">
      {plan.plan_name}
    </Badge>
  );
};

const AdminWorkspaces = () => {
  const navigate = useNavigate();
  const { data: workspaces, isLoading } = useAdminWorkspaces();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{ id: string; name: string } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      const { data, error } = await supabase.rpc('delete_workspace_admin', {
        p_workspace_id: workspaceId
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; copies_count?: number };
      
      if (!result.success) {
        if (result.error === 'workspace_has_copies') {
          throw new Error(`Não é possível excluir. Este workspace possui ${result.copies_count} copies criadas.`);
        }
        throw new Error('Erro ao excluir workspace');
      }
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Workspace excluído",
        description: "O workspace e seus projetos foram excluídos com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-workspaces'] });
      setDeleteDialogOpen(false);
      setWorkspaceToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (workspace: { id: string; name: string }) => {
    setWorkspaceToDelete(workspace);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (workspaceToDelete) {
      deleteMutation.mutate(workspaceToDelete.id);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        {!isLoading && workspaces && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total de Workspaces</p>
              <p className="text-2xl font-bold mt-1">{workspaces.length}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total de Membros</p>
              <p className="text-2xl font-bold mt-1">
                {workspaces.reduce((acc, w) => acc + w.members_count, 0)}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total de Projetos</p>
              <p className="text-2xl font-bold mt-1">
                {workspaces.reduce((acc, w) => acc + w.projects_count, 0)}
              </p>
            </div>
          </div>
        )}

        {/* Workspaces Table */}
        <div className="bg-card border border-border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workspace</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead className="text-center">Membros</TableHead>
                <TableHead className="text-center">Projetos</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : workspaces && workspaces.length > 0 ? (
                workspaces.map((workspace) => (
                  <TableRow key={workspace.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={workspace.avatar_url || ''} />
                          <AvatarFallback>
                            {workspace.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center">
                            <p className="font-medium">{workspace.name}</p>
                            <WorkspacePlanBadge workspaceId={workspace.id} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {workspace.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={workspace.owner.avatar_url || ''} />
                          <AvatarFallback>
                            {workspace.owner.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{workspace.owner.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {workspace.owner.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{workspace.members_count}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{workspace.projects_count}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {format(new Date(workspace.created_at), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(workspace.created_at), "HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/painel/admin/workspaces/${workspace.id}`)}
                        >
                          <Eye size={16} className="mr-2" />
                          Ver
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteClick({ id: workspace.id, name: workspace.name })}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum workspace encontrado
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o workspace "{workspaceToDelete?.name}"?
              <br /><br />
              <strong>Esta ação irá:</strong>
              <ul className="list-disc list-inside mt-2">
                <li>Excluir todos os projetos deste workspace</li>
                <li>Excluir todas as configurações e membros</li>
              </ul>
              <br />
              <strong className="text-destructive">Esta ação não pode ser desfeita.</strong>
              <br /><br />
              <em className="text-sm text-muted-foreground">
                Nota: Workspaces com copies criadas não podem ser excluídos.
              </em>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminWorkspaces;
