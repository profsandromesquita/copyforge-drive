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
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo_light">Logo Modo Claro (URL)</Label>
            <div className="flex gap-2">
              <Input
                id="logo_light"
                placeholder="https://exemplo.com/logo-light.png"
                value={settings.logo_light_url || ""}
                onChange={(e) =>
                  setSettings({ ...settings, logo_light_url: e.target.value })
                }
              />
              {settings.logo_light_url && (
                <Button variant="outline" size="icon" asChild>
                  <a href={settings.logo_light_url} target="_blank" rel="noopener noreferrer">
                    <ImageIcon size={20} />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_dark">Logo Modo Escuro (URL)</Label>
            <div className="flex gap-2">
              <Input
                id="logo_dark"
                placeholder="https://exemplo.com/logo-dark.png"
                value={settings.logo_dark_url || ""}
                onChange={(e) =>
                  setSettings({ ...settings, logo_dark_url: e.target.value })
                }
              />
              {settings.logo_dark_url && (
                <Button variant="outline" size="icon" asChild>
                  <a href={settings.logo_dark_url} target="_blank" rel="noopener noreferrer">
                    <ImageIcon size={20} />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="favicon">Favicon (URL)</Label>
            <div className="flex gap-2">
              <Input
                id="favicon"
                placeholder="https://exemplo.com/favicon.ico"
                value={settings.favicon_url || ""}
                onChange={(e) =>
                  setSettings({ ...settings, favicon_url: e.target.value })
                }
              />
              {settings.favicon_url && (
                <Button variant="outline" size="icon" asChild>
                  <a href={settings.favicon_url} target="_blank" rel="noopener noreferrer">
                    <ImageIcon size={20} />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modo Manutenção</CardTitle>
          <CardDescription>
            Ative para colocar o sistema em modo de manutenção
          </CardDescription>
        </CardHeader>
        <CardContent>
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
