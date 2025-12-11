import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import copydriveIcon from "@/assets/copydrive-icon.svg";
import { ValidateInviteResponse, InviteDisplayData, AcceptInviteResponse } from "@/types/invite";

export default function SignupInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);

  const [inviteData, setInviteData] = useState<InviteDisplayData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!token) {
      toast.error("Token de convite inválido");
      navigate("/auth");
      return;
    }

    loadInviteData();
  }, [token]);

  const loadInviteData = async () => {
    try {
      const { data, error } = await supabase.rpc('validate_invite_token', {
        p_token: token
      });

      if (error) {
        console.error("Error validating invite:", error);
        toast.error("Erro ao validar convite");
        navigate("/auth");
        return;
      }

      const result = data as unknown as ValidateInviteResponse;

      if (!result?.success) {
        const errorMsg = result?.error === 'invite_expired' 
          ? 'Este convite expirou' 
          : 'Convite não encontrado ou já utilizado';
        toast.error(errorMsg);
        navigate("/auth");
        return;
      }

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
      navigate("/auth");
    }
  };

  const acceptInviteAfterAuth = async () => {
    try {
      const { data, error } = await supabase.rpc('accept_invite_by_token', {
        p_token: token
      });

      if (error) {
        console.error("Error accepting invite:", error);
        toast.error("Erro ao aceitar convite. Tente novamente.");
        navigate("/my-project");
        return;
      }

      const result = data as unknown as AcceptInviteResponse;

      if (result?.success) {
        if (result.workspace_id) {
          localStorage.setItem('activeWorkspaceId', result.workspace_id);
        }
        toast.success(`Bem-vindo ao workspace ${inviteData?.workspace?.name}!`);
      } else if (result?.already_member) {
        toast.info('Você já é membro deste workspace');
      } else if (result?.error) {
        const errorMessages: Record<string, string> = {
          'email_mismatch': 'Este convite foi enviado para outro email',
          'invite_expired': 'Este convite expirou',
          'invite_not_found': 'Convite não encontrado',
          'not_authenticated': 'Você precisa estar autenticado',
        };
        toast.error(errorMessages[result.error] || 'Erro ao processar convite');
      }

      navigate("/my-project");
    } catch (error) {
      console.error("Error in acceptInviteAfterAuth:", error);
      navigate("/my-project");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password) {
      toast.error("Por favor, preencha sua senha");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: inviteData!.email,
        password: formData.password,
      });

      if (error) throw error;

      // Sessão estabelecida - aceitar o convite
      await acceptInviteAfterAuth();
    } catch (error: any) {
      console.error("Error logging in:", error);
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Por favor, preencha seu nome");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: inviteData!.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });

      if (error) {
        // Detectar erro de usuário já registrado
        if (error.message?.toLowerCase().includes('already registered') || 
            error.message?.toLowerCase().includes('already exists')) {
          toast.error("Este email já está cadastrado. Faça login para continuar.");
          setIsLoginMode(true);
          setSubmitting(false);
          return;
        }
        throw error;
      }
      
      // Sessão estabelecida - aceitar o convite
      await acceptInviteAfterAuth();
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 flex items-center justify-center">
            <img src={copydriveIcon} alt="CopyDrive" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-2xl">
            {isLoginMode ? "Fazer Login" : "Criar Conta"}
          </CardTitle>
          <CardDescription>
            Você foi convidado para o workspace <strong>{inviteData?.workspace?.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isLoginMode ? handleLogin : handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={inviteData?.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Este email está associado ao convite
              </p>
            </div>

            {!isLoginMode && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isLoginMode ? "Sua senha" : "Mínimo 6 caracteres"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={isLoginMode ? undefined : 6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLoginMode && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting 
                ? (isLoginMode ? "Entrando..." : "Criando conta...") 
                : (isLoginMode ? "Entrar e Aceitar Convite" : "Criar Conta e Aceitar Convite")
              }
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setFormData({ ...formData, password: "", confirmPassword: "" });
              }}
              className="text-sm text-primary hover:underline"
            >
              {isLoginMode 
                ? "Não tem conta? Cadastre-se" 
                : "Já tem uma conta? Faça Login"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
