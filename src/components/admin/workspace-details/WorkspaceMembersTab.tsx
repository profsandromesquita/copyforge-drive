import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { Loader2, UserPlus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface WorkspaceMember {
  id: string;
  user_id: string;
  role: string;
  invited_at: string;
  invited_by: string | null;
  profiles: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  credits_used?: number;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface WorkspaceMembersTabProps {
  workspaceId: string;
}

export const WorkspaceMembersTab = ({ workspaceId }: WorkspaceMembersTabProps) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "admin" | "editor" | "viewer">("editor");
  const [inviting, setInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Fetch members with credits used - usando basic_profiles VIEW (sem PII)
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_members')
        .select(`
          id,
          user_id,
          role,
          invited_at,
          invited_by,
          profiles:basic_profiles!workspace_members_user_id_fkey(name, email, avatar_url)
        `)
        .eq('workspace_id', workspaceId)
        .order('invited_at', { ascending: false });

      if (membersError) throw membersError;

      // Calculate credits used per member
      const membersWithCredits = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: creditsData } = await supabase
            .from('credit_transactions')
            .select('amount')
            .eq('workspace_id', workspaceId)
            .eq('user_id', member.user_id)
            .eq('transaction_type', 'debit');

          const creditsUsed = creditsData?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

          return {
            ...member,
            credits_used: creditsUsed,
          };
        })
      );

      setMembers(membersWithCredits as WorkspaceMember[]);

      // Fetch pending invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('workspace_invitations')
        .select('id, email, role, created_at')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      setPendingInvites(invitesData || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Digite um email');
      return;
    }

    setInviting(true);
    try {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', inviteEmail)
        .single();

      if (existingMember) {
        toast.error('Este usuário já é membro do workspace');
        return;
      }

      // Check if already invited
      const { data: existingInvite } = await supabase
        .from('workspace_invitations')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('email', inviteEmail)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        toast.error('Este usuário já foi convidado');
        return;
      }

      // Send invitation
      const { error } = await supabase.functions.invoke('send-workspace-invite', {
        body: {
          workspace_id: workspaceId,
          email: inviteEmail,
          role: inviteRole as string,
        },
      });

      if (error) throw error;

      toast.success('Convite enviado com sucesso');
      setInviteEmail('');
      setInviteRole('editor');
      fetchMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Erro ao enviar convite');
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role: newRole as any })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Role alterada com sucesso');
      fetchMembers();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Erro ao alterar role');
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberToRemove);

      if (error) throw error;

      toast.success('Membro removido com sucesso');
      setMemberToRemove(null);
      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Erro ao remover membro');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_invitations')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      toast.success('Convite cancelado');
      fetchMembers();
    } catch (error) {
      console.error('Error cancelling invite:', error);
      toast.error('Erro ao cancelar convite');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'editor':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'admin':
        return 'Administrador';
      case 'editor':
        return 'Editor';
      case 'viewer':
        return 'Visualizador';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Convidar Novo Membro</h3>
        <div className="flex gap-4">
          <Input
            type="email"
            placeholder="Email do membro"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <Select 
            value={inviteRole} 
            onValueChange={(value) => setInviteRole(value as "owner" | "admin" | "editor" | "viewer")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Proprietário</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Visualizador</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleInvite} disabled={inviting}>
            {inviting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Convites Pendentes</h3>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{invite.email}</span>
                  <Badge variant="outline">{getRoleLabel(invite.role)}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(invite.created_at), 'dd/MM/yyyy')}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancelInvite(invite.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Members Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membro</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Data de Entrada</TableHead>
              <TableHead>Créditos Usados</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profiles.avatar_url} />
                      <AvatarFallback>
                        {member.profiles.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.profiles.name}</span>
                  </div>
                </TableCell>
                <TableCell>{member.profiles.email}</TableCell>
                <TableCell>
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleChangeRole(member.id, value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Proprietário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{format(new Date(member.invited_at), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{member.credits_used?.toFixed(2) || '0.00'}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMemberToRemove(member.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este membro do workspace? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
