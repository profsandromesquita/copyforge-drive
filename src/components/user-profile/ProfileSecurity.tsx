import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isOAuthOnlyUser, getOAuthProviderName, hasPasswordAuth } from "@/lib/auth-helpers";
import { Info, ShieldCheck, CheckCircle2 } from "lucide-react";

export const ProfileSecurity = () => {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const isOAuthOnly = isOAuthOnlyUser(user);
  const providerName = getOAuthProviderName(user);
  const hasPassword = hasPasswordAuth(user);

  const handleChangePassword = async () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a nova senha e confirmação",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: isOAuthOnly ? "Senha definida com sucesso!" : "Senha atualizada",
        description: isOAuthOnly 
          ? "Agora você pode fazer login com email e senha, além do " + providerName
          : "Sua senha foi alterada com sucesso",
      });

      // Clear form
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Não foi possível alterar sua senha",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Segurança</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie a segurança da sua conta
        </p>
      </div>

      {/* OAuth User Banner */}
      {isOAuthOnly && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 max-w-md">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Você entrou com {providerName}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Defina uma senha abaixo para ter uma forma alternativa de acessar sua conta, 
              caso o {providerName} esteja indisponível.
            </p>
          </div>
        </div>
      )}

      {/* Password Already Set Banner */}
      {hasPassword && !isOAuthOnly && providerName && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 max-w-md">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Login redundante ativado
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Você pode acessar sua conta via {providerName} ou com email e senha.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6 max-w-md">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            <h4 className="font-medium">
              {isOAuthOnly ? "Definir Senha de Acesso" : "Alterar Senha"}
            </h4>
          </div>

          {isOAuthOnly && (
            <p className="text-sm text-muted-foreground mb-4">
              Esta senha permitirá que você faça login usando seu email ({user?.email}) e senha, 
              além do {providerName}.
            </p>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">
                {isOAuthOnly ? "Senha" : "Nova Senha"}
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={isOAuthOnly ? "Digite sua senha" : "Digite sua nova senha"}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                {isOAuthOnly ? "Confirmar Senha" : "Confirmar Nova Senha"}
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={isOAuthOnly ? "Confirme sua senha" : "Confirme sua nova senha"}
                disabled={saving}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              A senha deve ter no mínimo 6 caracteres
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t max-w-md">
        <Button
          onClick={handleChangePassword}
          disabled={saving || !newPassword || !confirmPassword}
        >
          {saving 
            ? (isOAuthOnly ? "Definindo..." : "Alterando...") 
            : (isOAuthOnly ? "Definir Senha" : "Alterar Senha")
          }
        </Button>
      </div>
    </div>
  );
};
