import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, Sun, Moon, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@/types/copy-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { BlockPreview } from '@/components/copy-editor/BlockPreview';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import copyDriveIcon from '@/assets/copydrive-icon.svg';

const PublicCopy = () => {
  const { id } = useParams<{ id: string }>();
  const [copy, setCopy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id) {
      loadCopy();
    }
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('public-copy-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
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

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('public-copy-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Focus on the input and let user use browser's native search
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
    
    // Show a helpful message
    toast.info(`Procure por "${searchQuery}" usando Ctrl/Cmd + F`);
    
    // Copy search query to clipboard for easy pasting
    navigator.clipboard.writeText(searchQuery).catch(() => {});
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
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Copy Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-semibold truncate">
                {copy.title}
              </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>

              {/* Search */}
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Search className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="end">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      placeholder="Buscar na copy..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* CopyDrive Link */}
              <a
                href="https://copydrive.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <img 
                    src={copyDriveIcon} 
                    alt="CopyDrive" 
                    className="h-5 w-5"
                  />
                </Button>
              </a>
            </div>
          </div>
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
