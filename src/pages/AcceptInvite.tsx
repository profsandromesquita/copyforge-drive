import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshWorkspaces, setActiveWorkspace } = useWorkspace();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      toast.error("Token de convite inválido");
      navigate("/auth");
      return;
    }

    loadInviteData();
  }, [token, user]);

  const loadInviteData = async () => {
    try {
      const { data, error } = await supabase
        .from("workspace_invitations")
        .select(`
          *,
          workspace:workspaces(id, name, avatar_url),
          inviter:profiles!workspace_invitations_invited_by_fkey(name)
        `)
        .eq("token", token)
        .eq("status", "pending")
        .single();

      if (error || !data) {
        toast.error("Convite não encontrado ou já utilizado");
        navigate("/my-project");
        return;
      }

      // Check if invite has expired
      if (new Date(data.expires_at) < new Date()) {
        toast.error("Este convite expirou");
        navigate("/my-project");
        return;
      }

      // If user is not logged in, redirect to auth
      if (!user) {
        toast.error("Você precisa estar logado para aceitar o convite");
        navigate(`/auth?redirect=/accept-invite?token=${token}`);
        return;
      }

      // Check if email matches
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (profile?.email !== data.email) {
        toast.error("Este convite foi enviado para outro email");
        navigate("/my-project");
        return;
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", data.workspace_id)
        .eq("user_id", user.id)
        .single();

      if (existingMember) {
        toast.info("Você já é membro deste workspace");
        navigate("/my-project");
        return;
      }

      setInviteData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading invite:", error);
      toast.error("Erro ao carregar convite");
      navigate("/my-project");
    }
  };

  const handleAccept = async () => {
    if (!user || !inviteData) return;

    setProcessing(true);

    try {
      // Add user to workspace
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: inviteData.workspace_id,
          user_id: user.id,
          role: inviteData.role,
          invited_by: inviteData.invited_by,
        });

      // Check if error is duplicate key (user already member)
      if (memberError && memberError.code !== '23505') {
        // Only throw if it's not a duplicate key error
        throw memberError;
      }

      // If user is already a member (duplicate key error), just update the invite status
      if (memberError && memberError.code === '23505') {
        console.log("User already member of workspace, updating invite status");
      }

      // Update invite status
      const { error: updateError } = await supabase
        .from("workspace_invitations")
        .update({ status: "accepted" })
        .eq("token", token);

      if (updateError) throw updateError;

      const workspaceName = inviteData?.workspace?.name || "este workspace";
      toast.success(`Você agora faz parte do workspace ${workspaceName}!`);

      // Save the workspace ID to localStorage before refreshing
      if (inviteData?.workspace?.id) {
        localStorage.setItem('activeWorkspaceId', inviteData.workspace.id);
      }

      // Refresh workspaces (will pick up the saved workspace ID)
      await refreshWorkspaces();

      navigate("/my-project");
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      toast.error(error.message || "Erro ao aceitar convite");
      // Even on error, try to redirect to dashboard after a delay
      setTimeout(() => {
        navigate("/my-project");
      }, 2000);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);

    try {
      const { error } = await supabase
        .from("workspace_invitations")
        .update({ status: "declined" })
        .eq("token", token);

      if (error) throw error;

      toast.info("Convite recusado");
      navigate("/my-project");
    } catch (error: any) {
      console.error("Error declining invite:", error);
      toast.error(error.message || "Erro ao recusar convite");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!inviteData) {
    return null;
  }

  const roleName = inviteData.role === "admin" ? "Administrador" : "Editor";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Avatar className="w-20 h-20 mx-auto">
              <AvatarImage src={inviteData?.workspace?.avatar_url || ""} />
              <AvatarFallback className="text-2xl">
                {inviteData?.workspace?.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">Convite para Workspace</CardTitle>
          <CardDescription className="text-base">
            <strong>{inviteData?.inviter?.name}</strong> convidou você para fazer parte de
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <h3 className="text-xl font-semibold">{inviteData?.workspace?.name}</h3>
            <Badge variant="secondary" className="text-sm">
              {roleName}
            </Badge>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleAccept}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              <Check className="mr-2 h-5 w-5" />
              {processing ? "Processando..." : "Aceitar Convite"}
            </Button>

            <Button
              onClick={handleDecline}
              disabled={processing}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <X className="mr-2 h-5 w-5" />
              Recusar
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Ao aceitar, você terá acesso aos projetos e arquivos deste workspace
          </p>
        </CardContent>
      </Card>
    </div>
  );
}