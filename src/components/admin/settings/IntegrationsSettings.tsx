import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plug, Lightning } from "phosphor-react";

interface Integration {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  is_enabled: boolean;
}

export const IntegrationsSettings = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .order("name");

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error("Erro ao carregar integrações:", error);
      toast.error("Erro ao carregar integrações");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIntegration = async (integrationId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("integrations")
        .update({ is_enabled: !currentState })
        .eq("id", integrationId);

      if (error) throw error;

      setIntegrations(
        integrations.map((int) =>
          int.id === integrationId
            ? { ...int, is_enabled: !currentState }
            : int
        )
      );

      toast.success(
        !currentState ? "Integração ativada" : "Integração desativada"
      );
    } catch (error) {
      console.error("Erro ao atualizar integração:", error);
      toast.error("Erro ao atualizar integração");
    }
  };

  if (loading) {
    return <div>Carregando integrações...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Integrações Disponíveis</h2>
        <p className="text-muted-foreground">
          Conecte e configure integrações com serviços externos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <Card key={integration.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {integration.icon_url ? (
                      <img
                        src={integration.icon_url}
                        alt={integration.name}
                        className="w-6 h-6"
                      />
                    ) : (
                      <Plug size={24} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                  </div>
                </div>
                {integration.is_enabled && (
                  <Badge variant="default" className="ml-2">
                    <Lightning size={12} className="mr-1" />
                    Ativo
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-2">
                {integration.description || "Sem descrição"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={integration.is_enabled ? "outline" : "default"}
                  size="sm"
                  onClick={() =>
                    handleToggleIntegration(integration.id, integration.is_enabled)
                  }
                  className="flex-1"
                >
                  {integration.is_enabled ? "Desativar" : "Ativar"}
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {integrations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Plug size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma integração disponível no momento
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
