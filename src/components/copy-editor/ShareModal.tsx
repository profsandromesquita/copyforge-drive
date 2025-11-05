import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copyId: string;
}

export const ShareModal = ({ open, onOpenChange, copyId }: ShareModalProps) => {
  const [isPublic, setIsPublic] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showInDiscover, setShowInDiscover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicLink = `${window.location.origin}/view/${copyId}`;

  useEffect(() => {
    if (open) {
      loadCopySettings();
    }
  }, [open, copyId]);

  const loadCopySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('copies')
        .select('is_public, public_password, show_in_discover')
        .eq('id', copyId)
        .single();

      if (error) throw error;

      setIsPublic(data.is_public || false);
      setHasPassword(!!data.public_password);
      setPassword(data.public_password || '');
      setShowInDiscover(data.show_in_discover || false);
    } catch (error) {
      console.error('Error loading copy settings:', error);
      toast.error('Erro ao carregar configurações');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('copies')
        .update({
          is_public: isPublic,
          public_password: hasPassword ? password : null,
          show_in_discover: isPublic && showInDiscover,
        })
        .eq('id', copyId);

      if (error) throw error;

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Copy</DialogTitle>
          <DialogDescription>
            Configure como você deseja compartilhar esta copy
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Visibilidade Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="visibility">Visibilidade</Label>
              <p className="text-sm text-muted-foreground">
                {isPublic ? 'Pública' : 'Privada'}
              </p>
            </div>
            <Switch
              id="visibility"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Opções Públicas */}
          {isPublic && (
            <div className="space-y-4 pl-4 border-l-2 border-primary/20">
              {/* Link Público */}
              <div className="space-y-2">
                <Label>Link Público</Label>
                <div className="flex gap-2">
                  <Input value={publicLink} readOnly className="flex-1" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Proteger com Senha */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password-toggle">Proteger com senha</Label>
                  <Switch
                    id="password-toggle"
                    checked={hasPassword}
                    onCheckedChange={setHasPassword}
                  />
                </div>
                {hasPassword && (
                  <Input
                    type="password"
                    placeholder="Digite a senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
              </div>

              {/* Exibir em Descobrir */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="discover">Exibir em "Descobrir"</Label>
                  <p className="text-sm text-muted-foreground">
                    Outros usuários poderão ver e copiar
                  </p>
                </div>
                <Switch
                  id="discover"
                  checked={showInDiscover}
                  onCheckedChange={setShowInDiscover}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
