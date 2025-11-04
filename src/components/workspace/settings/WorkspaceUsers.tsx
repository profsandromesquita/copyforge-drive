import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash, UserPlus } from "phosphor-react";
import { Badge } from "@/components/ui/badge";

interface WorkspaceMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor';
  profile: {
    name: string;
    email: string;
  };
}

export const WorkspaceUsers = () => {
  const { activeWorkspace } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor'>("editor");
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    if (!activeWorkspace) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        id,
        user_id,
        role,
        profile:profiles (
          name,
          email
        )
      `)
      .eq('workspace_id', activeWorkspace.id);

    if (error) {
      console.error('Error fetching members:', error);
      toast.error("Erro ao carregar membros");
    } else {
      setMembers(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [activeWorkspace]);

  const handleInvite = async () => {
    if (!activeWorkspace || !inviteEmail) return;

    setInviting(true);

    // Check if user exists
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail)
      .single();

    if (!profiles) {
      toast.error("Usuário não encontrado");
      setInviting(false);
      return;
    }

    // Add member to workspace
    const { error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: activeWorkspace.id,
        user_id: profiles.id,
        role: inviteRole
      });

    if (error) {
      toast.error("Erro ao adicionar membro");
      console.error(error);
    } else {
      toast.success("Membro adicionado com sucesso");
      setInviteEmail("");
      setInviteRole("editor");
      fetchMembers();
    }

    setInviting(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast.error("Erro ao remover membro");
      console.error(error);
    } else {
      toast.success("Membro removido com sucesso");
      fetchMembers();
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      owner: "default",
      admin: "secondary",
      editor: "outline"
    };
    
    const labels: Record<string, string> = {
      owner: "Owner",
      admin: "Admin",
      editor: "Editor"
    };

    return <Badge variant={variants[role] as any}>{labels[role]}</Badge>;
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">Membros do Workspace</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie os membros e permissões do workspace
        </p>
      </div>

      {/* Invite Form */}
      <div className="border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus size={20} className="text-primary" />
          <h4 className="font-semibold">Adicionar Novo Membro</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="email@exemplo.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="invite-role">Cargo</Label>
            <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
          {inviting ? "Enviando..." : "Enviar Convite"}
        </Button>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        <h4 className="font-semibold">Membros Atuais</h4>
        <div className="border border-border rounded-lg divide-y divide-border">
          {members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">{member.profile.name}</p>
                <p className="text-sm text-muted-foreground">{member.profile.email}</p>
              </div>
              <div className="flex items-center gap-4">
                {getRoleBadge(member.role)}
                {member.role !== 'owner' && activeWorkspace?.role !== 'editor' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <Trash size={18} className="text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
