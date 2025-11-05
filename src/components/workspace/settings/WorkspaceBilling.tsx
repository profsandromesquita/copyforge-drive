import { useState, useEffect } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, CreditCard, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  description: string;
  receipt_url?: string;
}

export const WorkspaceBilling = () => {
  const { activeWorkspace } = useWorkspace();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [activeWorkspace]);

  const fetchPayments = async () => {
    if (!activeWorkspace) return;

    setLoading(true);
    
    // Simulando dados de pagamento (substitua pela chamada real à API do Stripe)
    // Quando você integrar com Stripe, use uma edge function para buscar os pagamentos
    setTimeout(() => {
      const mockPayments: Payment[] = [
        {
          id: "pay_1",
          amount: 4900,
          currency: "BRL",
          status: "succeeded",
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Plano Pro - Mensal",
          receipt_url: "#"
        },
        {
          id: "pay_2",
          amount: 4900,
          currency: "BRL",
          status: "succeeded",
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Plano Pro - Mensal",
          receipt_url: "#"
        },
        {
          id: "pay_3",
          amount: 4900,
          currency: "BRL",
          status: "succeeded",
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Plano Pro - Mensal",
          receipt_url: "#"
        }
      ];
      
      setPayments(mockPayments);
      setLoading(false);
    }, 1000);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      succeeded: { label: 'Pago', variant: 'default' },
      pending: { label: 'Pendente', variant: 'secondary' },
      failed: { label: 'Falhou', variant: 'destructive' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Plano Atual</h3>
              </div>
              <p className="text-2xl font-bold text-primary">Plano Pro</p>
              <p className="text-sm text-muted-foreground">
                Renovação automática em 15 de dezembro de 2024
              </p>
            </div>
            <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Histórico de Pagamentos</h3>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg">
            <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-base">
                          {payment.description}
                        </p>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      
                      {payment.receipt_url && payment.status === 'succeeded' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Aqui você implementaria o download do comprovante
                            toast.info("Funcionalidade de download em desenvolvimento");
                            // window.open(payment.receipt_url, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Comprovante
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};