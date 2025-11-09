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
import { formatCredits } from "@/lib/utils";

interface WorkspaceMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor';
  invited_at: string;
  profile: {
    name: string;
    email: string;
  };
  credits_used: number;
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'admin' | 'editor';
  created_at: string;
}

export const WorkspaceUsers = () => {
  const { activeWorkspace } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
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
        invited_at,
        profile:profiles!workspace_members_user_id_fkey (
          name,
          email
        )
      `)
      .eq('workspace_id', activeWorkspace.id);

    if (error) {
      console.error('Error fetching members:', error);
      toast.error("Erro ao carregar membros");
      setLoading(false);
      return;
    }

    // Fetch credits used by each user in this workspace
      const { data: creditsData } = await supabase
        .from('credit_transactions')
        .select('user_id, amount')
        .eq('workspace_id', activeWorkspace.id)
        .eq('transaction_type', 'debit');

    // Calculate total credits used per user
    const creditsMap = new Map<string, number>();
      creditsData?.forEach((transaction) => {
        const current = creditsMap.get(transaction.user_id) || 0;
        creditsMap.set(transaction.user_id, current + Number(transaction.amount));
      });

    // Merge members data with credits data
    const membersWithCredits = data?.map((member: any) => ({
      ...member,
      credits_used: creditsMap.get(member.user_id) || 0
    }));

    setMembers(membersWithCredits as any);
    
    // Fetch pending invites
    const { data: invites } = await supabase
      .from('workspace_invitations')
      .select('id, email, role, created_at')
      .eq('workspace_id', activeWorkspace.id)
      .eq('status', 'pending');
    
    setPendingInvites((invites || []) as PendingInvite[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [activeWorkspace]);

  const handleInvite = async () => {
    if (!activeWorkspace || !inviteEmail || !inviteRole) return;

    setInviting(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        toast.error('Você precisa estar logado');
        setInviting(false);
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('user_id, profiles!inner(email)')
        .eq('workspace_id', activeWorkspace.id);

      const isAlreadyMember = existingMember?.some(
        (member: any) => member.profiles.email === inviteEmail
      );

      if (isAlreadyMember) {
        toast.error('Este usuário já é membro do workspace');
        setInviting(false);
        return;
      }

      // Check if there's already a pending invite
      const { data: pendingInvite } = await supabase
        .from('workspace_invitations')
        .select('id')
        .eq('workspace_id', activeWorkspace.id)
        .eq('email', inviteEmail)
        .eq('status', 'pending')
        .single();

      if (pendingInvite) {
        toast.error('Já existe um convite pendente para este email');
        setInviting(false);
        return;
      }

      // Create invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('workspace_invitations')
        .insert({
          workspace_id: activeWorkspace.id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: user.id,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Get current user's profile for inviter name
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-workspace-invite', {
        body: {
          workspace_id: activeWorkspace.id,
          email: inviteEmail,
          role: inviteRole,
          token: invitation.token,
          workspace_name: activeWorkspace.name,
          inviter_name: profile?.name || 'Um membro',
        },
      });

      if (emailError) throw emailError;

      toast.success(`Convite enviado para ${inviteEmail}!`);
      setInviteEmail('');
      setInviteRole('editor');
      fetchMembers();
    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Deseja realmente remover ${memberName} do workspace?`)) return;

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

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'editor') => {
    const { error } = await supabase
      .from('workspace_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      toast.error("Erro ao alterar cargo");
      console.error(error);
    } else {
      toast.success("Cargo alterado com sucesso");
      fetchMembers();
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from('workspace_invitations')
      .delete()
      .eq('id', inviteId);

    if (error) {
      toast.error("Erro ao cancelar convite");
      console.error(error);
    } else {
      toast.success("Convite cancelado");
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

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold">Convites Pendentes</h4>
          <div className="border border-border rounded-lg divide-y divide-border">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{invite.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Convite enviado em {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                    Pendente
                  </Badge>
                  <Badge variant="secondary">
                    {invite.role === 'admin' ? 'Admin' : 'Editor'}
                  </Badge>
                  {activeWorkspace?.role !== 'editor' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvite(invite.id)}
                    >
                      <Trash size={18} className="text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-2">
        <h4 className="font-semibold">Membros Atuais</h4>
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted/30 border-b border-border font-semibold text-sm">
            <div className="col-span-3">Membro</div>
            <div className="col-span-3">Data de Entrada</div>
            <div className="col-span-2 text-right">Créditos Usados</div>
            <div className="col-span-2 text-center">Cargo</div>
            <div className="col-span-2 text-center">Ações</div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-border">
            {members.map((member) => (
              <div key={member.id} className="grid grid-cols-12 gap-4 p-4 items-center">
                <div className="col-span-3 min-w-0">
                  <p className="font-medium truncate">{member.profile.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{member.profile.email}</p>
                </div>
                
                <div className="col-span-3">
                  <p className="text-sm">
                    {new Date(member.invited_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                
                <div className="col-span-2 text-right">
                  <p className="text-sm font-medium tabular-nums">
                    {formatCredits(member.credits_used)}
                  </p>
                </div>
                
                <div className="col-span-2 flex justify-center">
                  {member.role === 'owner' ? (
                    getRoleBadge(member.role)
                  ) : activeWorkspace?.role !== 'editor' ? (
                    <Select 
                      value={member.role} 
                      onValueChange={(value: 'admin' | 'editor') => handleChangeRole(member.id, value)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    getRoleBadge(member.role)
                  )}
                </div>
                
                <div className="col-span-2 flex justify-center">
                  {member.role !== 'owner' && activeWorkspace?.role !== 'editor' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id, member.profile.name)}
                    >
                      <Trash size={18} className="text-destructive" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
