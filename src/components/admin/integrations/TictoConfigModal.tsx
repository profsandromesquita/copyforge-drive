import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Loader2, ExternalLink } from "lucide-react";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { toast } from "sonner";

interface TictoConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewLogs: () => void;
}

export function TictoConfigModal({ open, onOpenChange, onViewLogs }: TictoConfigModalProps) {
  const { config, saveConfig, testConnection } = usePaymentGateway('ticto');
  const { plans } = useSubscriptionPlans();
  
  const [validationToken, setValidationToken] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [offerMappings, setOfferMappings] = useState({
    starter_offer_id: '',
    pro_offer_id: '',
    business_offer_id: '',
  });

  const webhookUrl = `${window.location.origin.replace('lovableproject.com', 'supabase.co')}/functions/v1/webhook-ticto`;

  useEffect(() => {
    if (config) {
      setValidationToken(config.config?.validation_token || '');
      setIsActive(config.is_active);
      setOfferMappings({
        starter_offer_id: config.config?.offer_mappings?.starter_offer_id || '',
        pro_offer_id: config.config?.offer_mappings?.pro_offer_id || '',
        business_offer_id: config.config?.offer_mappings?.business_offer_id || '',
      });
    }
  }, [config]);

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('URL copiada para a área de transferência!');
  };

  const handleTestConnection = () => {
    if (!validationToken) {
      toast.error('Por favor, insira o token de validação');
      return;
    }
    testConnection.mutate(validationToken);
  };

  const handleSave = () => {
    if (!validationToken) {
      toast.error('Por favor, insira o token de validação');
      return;
    }

    const starterPlan = plans?.find(p => p.slug === 'starter');
    const proPlan = plans?.find(p => p.slug === 'pro');
    const businessPlan = plans?.find(p => p.slug === 'business');

    const mappings: any = {};
    if (offerMappings.starter_offer_id && starterPlan) {
      mappings[offerMappings.starter_offer_id] = starterPlan.id;
    }
    if (offerMappings.pro_offer_id && proPlan) {
      mappings[offerMappings.pro_offer_id] = proPlan.id;
    }
    if (offerMappings.business_offer_id && businessPlan) {
      mappings[offerMappings.business_offer_id] = businessPlan.id;
    }

    saveConfig.mutate({
      config: {
        validation_token: validationToken,
        offer_mappings: mappings,
        webhook_url: webhookUrl,
      },
      isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar Integração Ticto</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* URL do Webhook */}
          <div className="space-y-2">
            <Label>URL do Webhook</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopyWebhookUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copie esta URL e configure no painel da Ticto
            </p>
          </div>

          {/* Token de Validação */}
          <div className="space-y-2">
            <Label htmlFor="validation_token">Token de Validação *</Label>
            <Input
              id="validation_token"
              type="password"
              value={validationToken}
              onChange={(e) => setValidationToken(e.target.value)}
              placeholder="Cole o token fornecido pela Ticto"
            />
            <p className="text-xs text-muted-foreground">
              Token fornecido pela Ticto para validar os webhooks
            </p>
          </div>

          {/* Mapeamento de Ofertas */}
          <div className="space-y-4">
            <Label>Mapeamento de Ofertas</Label>
            <p className="text-sm text-muted-foreground">
              Insira o ID de cada oferta configurada na Ticto
            </p>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4 items-center">
                <Label htmlFor="starter_offer">Oferta Starter</Label>
                <Input
                  id="starter_offer"
                  value={offerMappings.starter_offer_id}
                  onChange={(e) => setOfferMappings({ ...offerMappings, starter_offer_id: e.target.value })}
                  placeholder="ID da oferta Starter"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <Label htmlFor="pro_offer">Oferta Pro</Label>
                <Input
                  id="pro_offer"
                  value={offerMappings.pro_offer_id}
                  onChange={(e) => setOfferMappings({ ...offerMappings, pro_offer_id: e.target.value })}
                  placeholder="ID da oferta Pro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <Label htmlFor="business_offer">Oferta Business</Label>
                <Input
                  id="business_offer"
                  value={offerMappings.business_offer_id}
                  onChange={(e) => setOfferMappings({ ...offerMappings, business_offer_id: e.target.value })}
                  placeholder="ID da oferta Business"
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testConnection.isPending || !validationToken}
            >
              {testConnection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Testar Conexão
            </Button>
            <Button variant="outline" onClick={onViewLogs}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver Logs
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saveConfig.isPending}>
            {saveConfig.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
