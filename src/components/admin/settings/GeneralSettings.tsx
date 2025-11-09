import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "phosphor-react";

interface SystemSettings {
  id: string;
  system_name: string;
  system_description: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  maintenance_mode: boolean;
  disable_signup: boolean;
}

export const GeneralSettings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error("Configurações do sistema não encontradas");
        setLoading(false);
        return;
      }
      
      // Se não houver logos configuradas, usar as logos padrão dos assets
      setSettings({
        ...data,
        logo_light_url: data.logo_light_url || '/src/assets/copydrive-logo.png',
        logo_dark_url: data.logo_dark_url || '/src/assets/copydrive-logo.png',
        favicon_url: data.favicon_url || '/src/assets/copydrive-icon.svg'
      });
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Delete old file if exists
      const oldUrl = path === 'logo-light' ? settings?.logo_light_url :
                     path === 'logo-dark' ? settings?.logo_dark_url :
                     settings?.favicon_url;
      
      if (oldUrl) {
        const oldPath = oldUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('system-assets')
            .remove([oldPath]);
        }
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('system-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('system-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    }
  };

  const handleImageUpload = async (file: File, type: 'logo-light' | 'logo-dark' | 'favicon') => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    const url = await uploadImage(file, type);
    if (url && settings) {
      setSettings({
        ...settings,
        [type === 'logo-light' ? 'logo_light_url' : 
         type === 'logo-dark' ? 'logo_dark_url' : 
         'favicon_url']: url
      });
      toast.success('Imagem carregada com sucesso!');
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .update({
          system_name: settings.system_name,
          system_description: settings.system_description,
          logo_light_url: settings.logo_light_url,
          logo_dark_url: settings.logo_dark_url,
          favicon_url: settings.favicon_url,
          maintenance_mode: settings.maintenance_mode,
          disable_signup: settings.disable_signup,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!settings) {
    return <div>Erro ao carregar configurações</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
          <CardDescription>
            Configure as informações básicas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="system_name">Nome do Sistema</Label>
            <Input
              id="system_name"
              value={settings.system_name}
              onChange={(e) =>
                setSettings({ ...settings, system_name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="system_description">Descrição</Label>
            <Textarea
              id="system_description"
              value={settings.system_description || ""}
              onChange={(e) =>
                setSettings({ ...settings, system_description: e.target.value })
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logotipos e Ícones</CardTitle>
          <CardDescription>
            Configure os logotipos e ícones do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Modo Claro */}
          <div className="space-y-3">
            <Label>Logo Modo Claro</Label>
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              <img 
                src={settings.logo_light_url || '/src/assets/copydrive-logo.png'} 
                alt="Logo Claro" 
                className="h-16 w-auto object-contain"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettings({ ...settings, logo_light_url: null })}
              >
                Remover
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'logo-light');
                }}
                className="cursor-pointer"
              />
              <Button variant="outline" size="icon" asChild>
                <label className="cursor-pointer">
                  <Upload size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'logo-light');
                    }}
                  />
                </label>
              </Button>
            </div>
          </div>

          {/* Logo Modo Escuro */}
          <div className="space-y-3">
            <Label>Logo Modo Escuro</Label>
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              <img 
                src={settings.logo_dark_url || '/src/assets/copydrive-logo.png'} 
                alt="Logo Escuro" 
                className="h-16 w-auto object-contain"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettings({ ...settings, logo_dark_url: null })}
              >
                Remover
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'logo-dark');
                }}
                className="cursor-pointer"
              />
              <Button variant="outline" size="icon" asChild>
                <label className="cursor-pointer">
                  <Upload size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'logo-dark');
                    }}
                  />
                </label>
              </Button>
            </div>
          </div>

          {/* Favicon */}
          <div className="space-y-3">
            <Label>Favicon</Label>
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              <img 
                src={settings.favicon_url || '/src/assets/copydrive-icon.svg'} 
                alt="Favicon" 
                className="h-8 w-8 object-contain"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettings({ ...settings, favicon_url: null })}
              >
                Remover
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'favicon');
                }}
                className="cursor-pointer"
              />
              <Button variant="outline" size="icon" asChild>
                <label className="cursor-pointer">
                  <Upload size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'favicon');
                    }}
                  />
                </label>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Controle de Acesso</CardTitle>
          <CardDescription>
            Configure as permissões de acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Modo Manutenção</p>
              <p className="text-sm text-muted-foreground">
                Quando ativado, apenas administradores poderão acessar o sistema
              </p>
            </div>
            <Switch
              checked={settings.maintenance_mode}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, maintenance_mode: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <p className="font-medium">Desabilitar Cadastro</p>
              <p className="text-sm text-muted-foreground">
                Quando ativado, novos usuários não poderão criar contas no sistema
              </p>
            </div>
            <Switch
              checked={settings.disable_signup}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, disable_signup: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};
