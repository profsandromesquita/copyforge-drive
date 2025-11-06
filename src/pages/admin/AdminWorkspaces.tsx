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
import { Eye } from "phosphor-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminWorkspaces = () => {
  const navigate = useNavigate();
  const { data: workspaces, isLoading } = useAdminWorkspaces();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os workspaces do sistema
          </p>
        </div>

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
                          <p className="font-medium">{workspace.name}</p>
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/painel/admin/workspaces/${workspace.id}`)}
                      >
                        <Eye size={16} className="mr-2" />
                        Ver
                      </Button>
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
    </AdminLayout>
  );
};

export default AdminWorkspaces;
