import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderOpen, FileText, CreditCard } from "phosphor-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditTransactionCard } from "@/components/credits/CreditTransactionCard";

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clientesRes, workspacesRes, copiesRes, creditsRes, lastTransactionRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('workspaces').select('id', { count: 'exact', head: true }),
          supabase.from('copies').select('id', { count: 'exact', head: true }),
          supabase.from('workspace_credits').select('balance, total_used'),
          supabase
            .from('ai_generation_history')
            .select('credits_debited, total_tokens, tpc_snapshot, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
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
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon size={20} className={card.color} />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-3xl font-bold">{card.value.toLocaleString()}</div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {/* Card de Saldo Total da Plataforma */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Total (Plataforma)
              </CardTitle>
              <CreditCard size={20} className="text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold">{stats.saldo_total.toFixed(2)}</div>
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

        <Card>
          <CardHeader>
            <CardTitle>Tokens Usados por Modelo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Sistema de tracking de tokens em desenvolvimento
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
