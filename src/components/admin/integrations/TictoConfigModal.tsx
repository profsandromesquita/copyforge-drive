import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Loader2, ExternalLink, Info } from "lucide-react";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TictoConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewLogs: () => void;
}

export function TictoConfigModal({ open, onOpenChange, onViewLogs }: TictoConfigModalProps) {
  const { config, saveConfig, testConnection } = usePaymentGateway('ticto');
  
  const [validationToken, setValidationToken] = useState('');
  const [isActive, setIsActive] = useState(false);

  const projectId = 'fnebftywudiyjguzrofg';
  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/webhook-ticto`;

  useEffect(() => {
    if (config) {
      setValidationToken(config.config?.validation_token || '');
      setIsActive(config.is_active);
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

    saveConfig.mutate({
      config: {
        validation_token: validationToken,
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

          {/* Nota informativa sobre ofertas */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Para configurar ofertas e seus IDs de gateway, acesse{" "}
              <strong>Planos de Assinatura → Ofertas</strong>.
            </AlertDescription>
          </Alert>

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
