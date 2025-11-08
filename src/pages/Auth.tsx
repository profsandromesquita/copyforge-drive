import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import copyDriveLogo from "@/assets/copydrive-logo.png";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupDisabled, setSignupDisabled] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Force light mode on login page
    document.documentElement.classList.remove('dark');
    
    // Check if signup is disabled
    const checkSignupStatus = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('disable_signup')
        .single();
      
      if (data?.disable_signup) {
        setSignupDisabled(true);
        setIsLogin(true); // Force login mode if signup is disabled
      }
    };
    
    checkSignupStatus();
    
    return () => {
      // Restore theme preference on unmount
      const theme = localStorage.getItem('theme');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Redirect to the specified path or dashboard
      navigate(redirectPath || '/dashboard');
    }
  }, [user, navigate, redirectPath]);

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (XX) XXXXX-XXXX
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && signupDisabled) {
      toast.error("Cadastro de novos usuários está desabilitado");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (!isLogin && phone.replace(/\D/g, '').length !== 11) {
      toast.error("Telefone inválido. Use o formato (XX) XXXXX-XXXX");
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || "Erro ao fazer login");
        }
      } else {
        const { error } = await signUp(email, password, name, phone);
        if (error) {
          toast.error(error.message || "Erro ao criar conta");
        } else {
          toast.success("Conta criada com sucesso!");
        }
      }
    } catch (error) {
      toast.error("Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={copyDriveLogo} 
              alt="CopyDrive" 
              className="h-12"
            />
          </div>
          <p className="text-muted-foreground">
            {isLogin ? "Acesse sua conta" : "Crie sua conta"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={handlePhoneChange}
                    required
                    maxLength={15}
                    className="bg-background"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Processando..." : (isLogin ? "Entrar" : "Criar conta")}
            </Button>
          </form>

          {!signupDisabled && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? "Não tem conta? " : "Já tem conta? "}
                <span className="text-primary font-medium">
                  {isLogin ? "Criar conta" : "Fazer login"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
