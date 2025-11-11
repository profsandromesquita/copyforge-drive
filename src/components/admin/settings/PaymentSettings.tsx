import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Gear } from "phosphor-react";
import { TictoConfigModal } from "@/components/admin/integrations/TictoConfigModal";
import { WebhookLogsModal } from "@/components/admin/integrations/WebhookLogsModal";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";

interface Integration {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  is_enabled: boolean;
}

export const PaymentSettings = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [tictoConfigOpen, setTictoConfigOpen] = useState(false);
  const [tictoLogsOpen, setTictoLogsOpen] = useState(false);
  const { config: tictoConfig } = usePaymentGateway('ticto');

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
      console.error("Erro ao carregar gateways de pagamento:", error);
      toast.error("Erro ao carregar gateways de pagamento");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando gateways de pagamento...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gateways de Pagamento</h2>
        <p className="text-muted-foreground">
          Configure e gerencie os gateways de pagamento disponíveis no sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    {integration.icon_url ? (
                      <img
                        src={integration.icon_url}
                        alt={integration.name}
                        className="w-8 h-8"
                      />
                    ) : (
                      <CreditCard size={32} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{integration.name}</CardTitle>
                    {tictoConfig?.is_active && integration.slug === 'ticto' && (
                      <Badge variant="default" className="mt-1">
                        Configurado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <CardDescription>
                {integration.description || "Gateway de pagamento para processar transações"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={tictoConfig?.is_active && integration.slug === 'ticto' ? "default" : "secondary"}>
                    {tictoConfig?.is_active && integration.slug === 'ticto' ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      if (integration.slug === 'ticto') {
                        setTictoConfigOpen(true);
                      }
                    }}
                    disabled={integration.slug !== 'ticto'}
                  >
                    <Gear size={16} className="mr-2" />
                    Configurar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (integration.slug === 'ticto') {
                        setTictoLogsOpen(true);
                      }
                    }}
                    disabled={integration.slug !== 'ticto'}
                  >
                    Ver Logs
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  * A ativação do gateway é feita automaticamente ao criar ofertas de planos vinculadas a ele
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {integrations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum gateway de pagamento disponível no momento
            </p>
          </CardContent>
        </Card>
      )}

      <TictoConfigModal 
        open={tictoConfigOpen}
        onOpenChange={setTictoConfigOpen}
        onViewLogs={() => {
          setTictoConfigOpen(false);
          setTictoLogsOpen(true);
        }}
      />

      <WebhookLogsModal
        open={tictoLogsOpen}
        onOpenChange={setTictoLogsOpen}
        integrationSlug="ticto"
      />
    </div>
  );
};
