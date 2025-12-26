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
import { Check, X, AlertTriangle, LogOut } from "lucide-react";
import { 
  ValidateInviteResponse, 
  AcceptInviteResponse, 
  DeclineInviteResponse,
  InviteDisplayData 
} from "@/types/invite";
import { savePendingInvite, clearPendingInvite } from "@/lib/invite-utils";

interface EmailMismatchError {
  invitedEmail: string;
  currentEmail: string;
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { refreshWorkspaces } = useWorkspace();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [inviteData, setInviteData] = useState<InviteDisplayData | null>(null);
  const [emailMismatchError, setEmailMismatchError] = useState<EmailMismatchError | null>(null);

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
      // Use RPC function instead of direct table access
      const { data, error } = await supabase.rpc('validate_invite_token', {
        p_token: token
      });

      if (error) {
        console.error("Error validating invite:", error);
        toast.error("Erro ao validar convite");
        navigate("/my-project");
        return;
      }

      const result = data as unknown as ValidateInviteResponse;

      if (!result?.success) {
        const errorMsg = result?.error === 'invite_expired' 
          ? 'Este convite expirou' 
          : 'Convite não encontrado ou já utilizado';
        toast.error(errorMsg);
        navigate("/my-project");
        return;
      }

      // If user is not logged in, save token and redirect silently
      if (!user) {
        console.log('[AcceptInvite] User not logged in, saving token and redirecting to signup-invite');
        savePendingInvite(token!);
        navigate(`/signup-invite?token=${token}`);
        return;
      }

      // Check if email matches using profile lookup
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (profile?.email !== result.email) {
        // Show email mismatch UI instead of redirecting
        setEmailMismatchError({
          invitedEmail: result.email!,
          currentEmail: profile?.email || user.email || 'desconhecido'
        });
        setLoading(false);
        return;
      }

      // Transform RPC response to display data structure
      setInviteData({
        email: result.email!,
        role: result.role!,
        workspace: {
          name: result.workspace_name!,
          avatar_url: result.workspace_avatar,
        },
        inviter: {
          name: result.inviter_name!,
        },
        expires_at: result.expires_at!,
      });
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
      // Use RPC function instead of manual INSERT + UPDATE
      const { data, error } = await supabase.rpc('accept_invite_by_token', {
        p_token: token
      });

      if (error) {
        console.error("Error accepting invite:", error);
        toast.error("Erro ao aceitar convite");
        return;
      }

      const result = data as unknown as AcceptInviteResponse;

      if (!result?.success) {
        const errorMessages: Record<string, string> = {
          'email_mismatch': 'Este convite foi enviado para outro email',
          'invite_expired': 'Este convite expirou',
          'invite_not_found': 'Convite não encontrado',
          'not_authenticated': 'Você precisa estar logado',
        };
        toast.error(errorMessages[result?.error || ''] || 'Erro ao aceitar convite');
        return;
      }

      if (result.already_member) {
        toast.info(`Você já é membro do workspace ${inviteData.workspace.name}!`);
      } else {
        toast.success(`Você agora faz parte do workspace ${inviteData.workspace.name}!`);
      }

      // Save the workspace ID to localStorage before refreshing
      if (result.workspace_id) {
        localStorage.setItem('activeWorkspaceId', result.workspace_id);
      }

      // Clear pending invite token
      clearPendingInvite();

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
      // Use RPC function instead of manual UPDATE
      const { data, error } = await supabase.rpc('decline_invite_by_token', {
        p_token: token
      });

      if (error) {
        console.error("Error declining invite:", error);
        toast.error("Erro ao recusar convite");
        return;
      }

      const result = data as unknown as DeclineInviteResponse;

      if (!result?.success) {
        toast.error('Erro ao recusar convite');
        return;
      }

      // Clear pending invite token
      clearPendingInvite();

      toast.info("Convite recusado");
      navigate("/my-project");
    } catch (error: any) {
      console.error("Error declining invite:", error);
      toast.error(error.message || "Erro ao recusar convite");
    } finally {
      setProcessing(false);
    }
  };

  const handleSwitchAccount = async () => {
    setProcessing(true);
    // Save the token before signing out so user can accept after re-login
    savePendingInvite(token!);
    await signOut();
    navigate(`/signup-invite?token=${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show email mismatch error UI
  if (emailMismatchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
            </div>
            <CardTitle className="text-2xl">Conta Incorreta</CardTitle>
            <CardDescription className="text-base space-y-2">
              <p>
                Este convite foi enviado para <strong className="text-foreground">{emailMismatchError.invitedEmail}</strong>
              </p>
              <p>
                Mas você está logado como <strong className="text-foreground">{emailMismatchError.currentEmail}</strong>
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Para aceitar este convite, você precisa entrar com a conta correta.
            </p>
            <Button 
              onClick={handleSwitchAccount} 
              variant="default" 
              className="w-full"
              disabled={processing}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {processing ? "Saindo..." : "Trocar de Conta"}
            </Button>
            <Button 
              onClick={() => navigate("/my-project")} 
              variant="outline" 
              className="w-full"
            >
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
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