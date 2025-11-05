import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@/types/copy-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { BlockPreview } from '@/components/copy-editor/BlockPreview';

const PublicCopy = () => {
  const { id } = useParams<{ id: string }>();
  const [copy, setCopy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (id) {
      loadCopy();
    }
  }, [id]);

  const loadCopy = async () => {
    try {
      const { data, error } = await supabase
        .from('copies')
        .select('*, profiles(name, avatar_url)')
        .eq('id', id)
        .eq('is_public', true)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error('Copy não encontrada ou não é pública');
        return;
      }

      setCopy(data);

      if (data.public_password) {
        setPasswordRequired(true);
      } else {
        setAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading copy:', error);
      toast.error('Erro ao carregar copy');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === copy.public_password) {
      setAuthenticated(true);
      toast.success('Acesso liberado!');
    } else {
      toast.error('Senha incorreta');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!copy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Copy não encontrada</CardTitle>
            <CardDescription>
              Esta copy não existe ou não está disponível publicamente.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (passwordRequired && !authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>{copy.title}</CardTitle>
            </div>
            <CardDescription>
              Esta copy está protegida por senha
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Digite a senha"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePasswordSubmit();
              }}
            />
            <Button onClick={handlePasswordSubmit} className="w-full">
              Acessar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold">{copy.title}</h1>
          </div>
          {copy.profiles && (
            <p className="text-sm text-muted-foreground mt-1">
              Por {copy.profiles.name}
            </p>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-6">
          {copy.sessions && Array.isArray(copy.sessions) && copy.sessions.map((session: Session) => (
            <section key={session.id} className="space-y-4">
              <div className="border-b pb-2">
                <h2 className="text-lg font-semibold text-primary">
                  {session.title}
                </h2>
              </div>
              <div className="space-y-3">
                {session.blocks.map((block) => (
                  <BlockPreview key={block.id} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};

export default PublicCopy;
