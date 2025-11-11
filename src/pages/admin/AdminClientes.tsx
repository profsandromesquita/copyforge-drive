import { AdminLayout } from "@/components/admin/AdminLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DotsThree, Eye, Trash } from "phosphor-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Cliente {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  workspaces_count: number;
  copies_count: number;
}

export default function AdminClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        // Buscar profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Para cada profile, buscar contagem de workspaces e copies
        const clientesWithCounts = await Promise.all(
          (profiles || []).map(async (profile) => {
            const [workspacesRes, copiesRes] = await Promise.all([
              supabase
                .from('workspace_members')
                .select('workspace_id', { count: 'exact', head: true })
                .eq('user_id', profile.id),
              supabase
                .from('copies')
                .select('id', { count: 'exact', head: true })
                .eq('created_by', profile.id),
            ]);

            return {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              avatar_url: profile.avatar_url,
              created_at: profile.created_at,
              workspaces_count: workspacesRes.count || 0,
              copies_count: copiesRes.count || 0,
            };
          })
        );

        setClientes(clientesWithCounts);
      } catch (error) {
        console.error('Error fetching clientes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = async (cliente: Cliente) => {
    if (cliente.workspaces_count > 0 || cliente.copies_count > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Este usuário possui ${cliente.workspaces_count} workspace(s) e ${cliente.copies_count} copy(ies). Apenas usuários sem workspaces e copies podem ser removidos.`,
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir ${cliente.name}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    setDeleting(cliente.id);
    
    try {
      const { data, error } = await supabase.rpc('delete_user_admin', {
        p_user_id: cliente.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        let message = "Erro ao excluir usuário";
        
        if (result.error === 'unauthorized') {
          message = "Você não tem permissão para excluir usuários";
        } else if (result.error === 'user_not_found') {
          message = "Usuário não encontrado";
        } else if (result.error === 'user_has_workspaces') {
          message = "Usuário possui workspaces e não pode ser excluído";
        } else if (result.error === 'user_has_copies') {
          message = "Usuário possui copies e não pode ser excluído";
        }
        
        toast({
          title: "Erro",
          description: message,
          variant: "destructive",
        });
        return;
      }

      // Remover da lista local
      setClientes(prev => prev.filter(c => c.id !== cliente.id));
      
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-center">Workspaces</TableHead>
                <TableHead className="text-center">Copies</TableHead>
                <TableHead>Data de Entrada</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={cliente.avatar_url} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getUserInitials(cliente.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{cliente.name}</p>
                          <p className="text-sm text-muted-foreground">{cliente.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{cliente.workspaces_count}</TableCell>
                    <TableCell className="text-center">{cliente.copies_count}</TableCell>
                    <TableCell>
                      {format(new Date(cliente.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <DotsThree size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/painel/admin/clientes/${cliente.id}`)}>
                            <Eye size={16} className="mr-2" />
                            Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(cliente)}
                            disabled={deleting === cliente.id || cliente.workspaces_count > 0 || cliente.copies_count > 0}
                            className={cliente.workspaces_count === 0 && cliente.copies_count === 0 ? "text-destructive" : "text-muted-foreground"}
                          >
                            <Trash size={16} className="mr-2" />
                            {deleting === cliente.id ? "Excluindo..." : "Excluir"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};
