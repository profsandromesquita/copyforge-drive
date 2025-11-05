import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash, UserCircle } from "phosphor-react";
import { AddUserDialog } from "./AddUserDialog";

interface UserWithRole {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

export const UsersSettings = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserOpen, setAddUserOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const userIds = userRoles.map((ur) => ur.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const usersWithRoles = profiles?.map((profile) => {
        const userRole = userRoles.find((ur) => ur.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || "user",
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário admin?")) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      setUsers(users.filter((u) => u.id !== userId));
      toast.success("Usuário removido com sucesso");
    } catch (error) {
      console.error("Erro ao remover usuário:", error);
      toast.error("Erro ao remover usuário");
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Admin";
      default:
        return "Usuário";
    }
  };

  if (loading) {
    return <div>Carregando usuários...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Usuários Administradores</h2>
          <p className="text-muted-foreground">
            Gerencie os usuários com acesso ao painel administrativo
          </p>
        </div>
        <Button onClick={() => setAddUserOpen(true)}>
          <Plus size={20} className="mr-2" />
          Adicionar Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Lista de todos os usuários administradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <UserCircle size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum usuário administrador cadastrado
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash size={20} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onUserAdded={loadUsers}
      />
    </div>
  );
};
