import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentTransaction } from "@/hooks/usePaymentTransactions";
import { formatCurrency, formatCredits } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Copy, Eye } from "phosphor-react";
import { toast } from "sonner";
import { GatewayBadge } from "./GatewayBadge";
import { StatusBadge } from "./StatusBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface TransactionDetailsModalProps {
  transaction: PaymentTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper para formatar telefone
const formatPhone = (phone: any): string => {
  if (!phone) return 'N/A';
  
  // Se for string, retorna direto
  if (typeof phone === 'string') return phone;
  
  // Se for objeto com ddd, ddi, number
  if (phone.ddd && phone.number) {
    return `${phone.ddi || '+55'} (${phone.ddd}) ${phone.number}`;
  }
  
  return 'N/A';
};

export const TransactionDetailsModal = ({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailsModalProps) => {
  const [payloadOpen, setPayloadOpen] = useState(false);
  const navigate = useNavigate();

  if (!transaction) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(transaction.id);
    toast.success("ID copiado para a área de transferência");
  };

  const handleViewWorkspace = () => {
    if (transaction.workspace_id) {
      navigate(`/painel/admin/workspaces/${transaction.workspace_id}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Detalhes da Transação
            <StatusBadge status={transaction.status} />
            <GatewayBadge slug={transaction.integration_slug} />
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            {/* Informações da Venda */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Informações da Venda</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pago</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(transaction.paid_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID da Transação</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {transaction.id.slice(0, 8)}...
                    </code>
                    <Button size="sm" variant="ghost" onClick={handleCopyId}>
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data da Transação</p>
                  <p className="font-medium">
                    {format(new Date(transaction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {transaction.processed_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Processada em</p>
                    <p className="font-medium">
                      {format(new Date(transaction.processed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Workspace */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Workspace</h3>
              {transaction.workspace_id ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome do Workspace</p>
                    <p className="font-medium">{transaction.workspace_name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{transaction.workspace_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Proprietário</p>
                    <p className="font-medium">{transaction.owner_name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{transaction.owner_email || 'N/A'}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleViewWorkspace}>
                    <Eye size={16} className="mr-2" />
                    Ver Workspace
                  </Button>
                </div>
              ) : (
                <Badge variant="primary-subtle">
                  Workspace não identificado
                </Badge>
              )}
            </div>

            <Separator />

            {/* Oferta */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Oferta Contratada</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nome da Oferta</p>
                  <p className="font-medium">{transaction.offer_name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{transaction.offer_id}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cliente */}
            {transaction.payload?.customer && (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Cliente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{transaction.payload.customer.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{transaction.payload.customer.email || 'N/A'}</p>
                    </div>
                    {transaction.payload.customer.cpf && (
                      <div>
                        <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                        <p className="font-medium">{transaction.payload.customer.cpf}</p>
                      </div>
                    )}
                    {transaction.payload.customer.cnpj && (
                      <div>
                        <p className="text-sm text-muted-foreground">CNPJ</p>
                        <p className="font-medium">{transaction.payload.customer.cnpj}</p>
                      </div>
                    )}
                    {transaction.payload.customer.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <p className="font-medium">{formatPhone(transaction.payload.customer.phone)}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Erro */}
            {transaction.error_message && (
              <>
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-destructive">Mensagem de Erro</h3>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm">{transaction.error_message}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Dados Técnicos */}
            <Collapsible open={payloadOpen} onOpenChange={setPayloadOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full">
                  {payloadOpen ? 'Ocultar' : 'Mostrar'} Dados Técnicos
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Payload Completo</p>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64">
                      {JSON.stringify(transaction.payload, null, 2)}
                    </pre>
                  </div>
                  {transaction.headers && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Headers</p>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64">
                        {JSON.stringify(transaction.headers, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
