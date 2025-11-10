import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, CreditCard, Plus, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useWorkspacePlan } from "@/hooks/useWorkspacePlan";
import { useWorkspaceSubscription } from "@/hooks/useWorkspaceSubscription";
import { useWorkspaceInvoices } from "@/hooks/useWorkspaceInvoices";
import { useWorkspaceOffer } from "@/hooks/useWorkspaceOffer";
import { AdminChangePlanModal } from "./AdminChangePlanModal";
import { AdminAddCreditsModal } from "./AdminAddCreditsModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface WorkspacePlanBillingTabProps {
  workspaceId: string;
}

export const WorkspacePlanBillingTab = ({ workspaceId }: WorkspacePlanBillingTabProps) => {
  const queryClient = useQueryClient();
  const { data: plan, isLoading: planLoading } = useWorkspacePlan(workspaceId);
  const { data: subscription, isLoading: subscriptionLoading } = useWorkspaceSubscription(workspaceId);
  const { invoices, isLoading: invoicesLoading, markAsPaid, cancelInvoice } = useWorkspaceInvoices(workspaceId);
  const { data: currentOffer } = useWorkspaceOffer(workspaceId);
  
  const [changePlanModalOpen, setChangePlanModalOpen] = useState(false);
  const [addCreditsModalOpen, setAddCreditsModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Pago</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelado</Badge>;
      case 'refunded':
        return <Badge variant="outline">Reembolsado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.id) return;

    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from("workspace_subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      if (error) throw error;

      toast.success("Assinatura cancelada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["workspace-subscription", workspaceId] });
      setCancelDialogOpen(false);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Erro ao cancelar assinatura");
    } finally {
      setIsCancelling(false);
    }
  };

  if (planLoading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">
              {plan?.plan_name || 'Plano Gratuito'}
            </h3>
            <div className="flex items-center gap-3">
              {currentOffer && (
                <Badge variant="secondary">
                  {currentOffer.name}
                </Badge>
              )}
              <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                {subscription?.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              {currentOffer 
                ? formatCurrency(currentOffer.price)
                : 'R$ 0,00'}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentOffer && `/${currentOffer.billing_period_value} ${
                currentOffer.billing_period_unit === 'months' ? 'mês(es)' :
                currentOffer.billing_period_unit === 'years' ? 'ano(s)' : 
                currentOffer.billing_period_unit
              }`}
            </p>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Projetos</p>
            <p className="text-2xl font-semibold">
              {subscription?.projects_count || 0}
              {subscription?.current_max_projects && (
                <span className="text-sm text-muted-foreground">
                  {' '}/ {subscription.current_max_projects}
                </span>
              )}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Copies</p>
            <p className="text-2xl font-semibold">
              {subscription?.copies_count || 0}
              {subscription?.current_max_copies && (
                <span className="text-sm text-muted-foreground">
                  {' '}/ {subscription.current_max_copies}
                </span>
              )}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">IA de Copy</p>
            <p className="text-2xl font-semibold">
              {subscription?.current_copy_ai_enabled ? '✓' : '✗'}
            </p>
          </div>
        </div>

        {subscription?.current_period_end && (
          <p className="text-sm text-muted-foreground">
            Renovação: {format(new Date(subscription.current_period_end), 'dd/MM/yyyy')}
          </p>
        )}

        {/* Admin Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" size="sm" onClick={() => setChangePlanModalOpen(true)}>
            <CreditCard className="h-4 w-4 mr-2" />
            Alterar Plano
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddCreditsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Créditos
          </Button>
          {subscription?.status === 'active' && (
            <Button variant="outline" size="sm" onClick={() => setCancelDialogOpen(true)}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar Assinatura
            </Button>
          )}
        </div>
      </Card>

      {/* Invoices Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Histórico de Faturas</h3>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Fatura
          </Button>
        </div>

        {invoicesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : invoices.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.billing_period_start), 'dd/MM/yyyy')} -{' '}
                      {format(new Date(invoice.billing_period_end), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{format(new Date(invoice.due_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      {invoice.paid_at ? format(new Date(invoice.paid_at), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {invoice.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsPaid.mutate(invoice.id)}
                          >
                            Marcar como Pago
                          </Button>
                        )}
                        {invoice.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelInvoice.mutate(invoice.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
          </Card>
        )}
      </div>

      {/* Modals */}
      <AdminChangePlanModal
        open={changePlanModalOpen}
        onOpenChange={setChangePlanModalOpen}
        workspaceId={workspaceId}
        currentPlanId={subscription?.plan?.id}
      />

      <AdminAddCreditsModal
        open={addCreditsModalOpen}
        onOpenChange={setAddCreditsModalOpen}
        workspaceId={workspaceId}
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a assinatura deste workspace? O plano será alterado para Free e os limites serão reduzidos.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubscription} disabled={isCancelling}>
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
