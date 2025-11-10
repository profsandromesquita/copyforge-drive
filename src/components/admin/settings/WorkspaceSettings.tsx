import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const WorkspaceSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [maxFreeWorkspaces, setMaxFreeWorkspaces] = useState<number>(1);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('max_free_workspaces_per_user')
        .single();

      if (error) throw error;

      if (data) {
        setMaxFreeWorkspaces(data.max_free_workspaces_per_user);
      }
    } catch (error) {
      console.error('Error fetching workspace settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('system_settings')
        .update({ max_free_workspaces_per_user: maxFreeWorkspaces })
        .eq('id', (await supabase.from('system_settings').select('id').single()).data?.id);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving workspace settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações de Workspace</h1>
        <p className="text-muted-foreground mt-2">
          Configure limites e restrições para criação de workspaces
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Limite de Workspaces Free</CardTitle>
          <CardDescription>
            Define quantos workspaces no plano gratuito um usuário pode criar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-free-workspaces">
              Máximo de workspaces free por usuário
            </Label>
            <Input
              id="max-free-workspaces"
              type="number"
              min="0"
              value={maxFreeWorkspaces}
              onChange={(e) => setMaxFreeWorkspaces(parseInt(e.target.value) || 0)}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Defina 0 para permitir criação ilimitada de workspaces gratuitos
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
