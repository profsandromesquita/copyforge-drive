import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderOpen, FileText, CreditCard } from "phosphor-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditTransactionCard } from "@/components/credits/CreditTransactionCard";
import { TokensByModelCard } from "@/components/admin/TokensByModelCard";

interface Stats {
  clientes: number;
  workspaces: number;
  copies: number;
  creditos: number;
  saldo_total: number;
}

interface LastTransaction {
  debited: number;
  tokens: number;
  tpc: number;
  timestamp: string;
}

interface ModelTokenStats {
  model_used: string;
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_credits_debited: number;
  transaction_count: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    clientes: 0,
    workspaces: 0,
    copies: 0,
    creditos: 0,
    saldo_total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastTransaction, setLastTransaction] = useState<LastTransaction | null>(null);
  const [modelStats, setModelStats] = useState<ModelTokenStats[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clientesRes, workspacesRes, copiesRes, creditsRes, lastTransactionRes, modelStatsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('workspaces').select('id', { count: 'exact', head: true }),
          supabase.from('copies').select('id', { count: 'exact', head: true }),
          supabase.from('workspace_credits').select('balance, total_used'),
          supabase
            .from('ai_generation_history')
            .select('credits_debited, total_tokens, tpc_snapshot, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('credit_transactions')
            .select('model_used, tokens_used, input_tokens, output_tokens, amount')
            .eq('transaction_type', 'debit')
            .not('model_used', 'is', null)
        ]);

        // Calcular total de créditos usados e saldo total em todas as workspaces
        const totalUsed = creditsRes.data?.reduce((sum, item) => sum + item.total_used, 0) || 0;
        const totalBalance = creditsRes.data?.reduce((sum, item) => sum + item.balance, 0) || 0;

        setStats({
          clientes: clientesRes.count || 0,
          workspaces: workspacesRes.count || 0,
          copies: copiesRes.count || 0,
          creditos: totalUsed,
          saldo_total: totalBalance,
        });

        if (lastTransactionRes.data) {
          setLastTransaction({
            debited: lastTransactionRes.data.credits_debited || 0,
            tokens: lastTransactionRes.data.total_tokens || 0,
            tpc: lastTransactionRes.data.tpc_snapshot || 10000,
            timestamp: lastTransactionRes.data.created_at || new Date().toISOString()
          });
        }

        // Agregar dados por modelo
        if (modelStatsRes.data) {
          const aggregated = modelStatsRes.data.reduce((acc, transaction) => {
            const model = transaction.model_used as string;
            if (!acc[model]) {
              acc[model] = {
                model_used: model,
                total_tokens: 0,
                total_input_tokens: 0,
                total_output_tokens: 0,
                total_credits_debited: 0,
                transaction_count: 0,
              };
            }
            acc[model].total_tokens += transaction.tokens_used || 0;
            acc[model].total_input_tokens += transaction.input_tokens || 0;
            acc[model].total_output_tokens += transaction.output_tokens || 0;
            acc[model].total_credits_debited += transaction.amount || 0;
            acc[model].transaction_count += 1;
            return acc;
          }, {} as Record<string, ModelTokenStats>);

          setModelStats(Object.values(aggregated).sort((a, b) => b.total_credits_debited - a.total_credits_debited));
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Total de Clientes",
      value: stats.clientes,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total de Workspaces",
      value: stats.workspaces,
      icon: FolderOpen,
      color: "text-purple-600",
    },
    {
      title: "Total de Copies",
      value: stats.copies,
      icon: FileText,
      color: "text-green-600",
    },
    {
      title: "Créditos Usados (Total)",
      value: stats.creditos.toFixed(2),
      icon: CreditCard,
      color: "text-orange-600",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground break-words leading-tight">
                  {card.title}
                </CardTitle>
                <card.icon size={20} className={`${card.color} flex-shrink-0`} />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-3xl font-bold break-all">{card.value.toLocaleString()}</div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {/* Card de Saldo Total da Plataforma */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground break-words leading-tight">
                Saldo Total (Plataforma)
              </CardTitle>
              <CreditCard size={20} className="text-green-600 flex-shrink-0" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold break-all">{stats.saldo_total.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Última Transação */}
        {lastTransaction && !loading && (
          <CreditTransactionCard
            debited={lastTransaction.debited}
            tokens={lastTransaction.tokens}
            tpc={lastTransaction.tpc}
            timestamp={lastTransaction.timestamp}
          />
        )}

        <TokensByModelCard modelStats={modelStats} loading={loading} />
      </div>
    </AdminLayout>
  );
};
