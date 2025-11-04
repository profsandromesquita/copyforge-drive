import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, ArrowLeft } from 'phosphor-react';

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email obrigatório',
        description: 'Por favor, insira um email.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_super_admin', {
        user_email: email,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };

      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.message,
        });
        setEmail('');
      } else {
        toast({
          title: 'Erro',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating super admin:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o super admin.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar ao Dashboard
        </Button>

        <Card className="border-2 border-primary">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield size={40} className="text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Criar Super Admin</CardTitle>
            <CardDescription>
              Rota temporária para criar o primeiro super admin do sistema
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleCreateSuperAdmin} className="space-y-4">
              {user && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium">Usuário logado:</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Email do usuário para tornar Super Admin
                </label>
                <Input
                  type="email"
                  placeholder="admin@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  O usuário deve estar cadastrado no sistema
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Criando...' : 'Criar Super Admin'}
              </Button>
            </form>

            <div className="mt-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-xs text-destructive font-medium">
                ⚠️ AVISO DE SEGURANÇA
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Esta rota deve ser removida após criar o primeiro super admin.
                Super admins têm acesso total ao sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdmin;
