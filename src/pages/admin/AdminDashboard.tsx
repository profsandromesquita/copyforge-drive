import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderOpen, FileText, CreditCard } from "phosphor-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  clientes: number;
  workspaces: number;
  copies: number;
  creditos: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    clientes: 0,
    workspaces: 0,
    copies: 0,
    creditos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clientesRes, workspacesRes, copiesRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('workspaces').select('id', { count: 'exact', head: true }),
          supabase.from('copies').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          clientes: clientesRes.count || 0,
          workspaces: workspacesRes.count || 0,
          copies: copiesRes.count || 0,
          creditos: 0, // TODO: Implementar sistema de créditos
        });
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
      title: "Créditos Usados",
      value: stats.creditos,
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>

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
