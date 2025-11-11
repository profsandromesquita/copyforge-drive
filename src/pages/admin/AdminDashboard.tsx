import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, FolderOpen, FileText, CreditCard, TrendingUp, Wallet, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

interface Stats {
  mrr: number;
  assinaturas: number;
  clientes: number;
  workspaces: number;
  projetos: number;
  copies: number;
  creditos_consumidos: number;
  custo_ia: number;
}

interface CopyByType {
  copy_type: string;
  count: number;
}

interface ModelConsumption {
  model_used: string;
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_credits_debited: number;
  transaction_count: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    mrr: 0,
    assinaturas: 0,
    clientes: 0,
    workspaces: 0,
    projetos: 0,
    copies: 0,
    creditos_consumidos: 0,
    custo_ia: 0,
  });
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("last-7-days");
  const [planFilter, setPlanFilter] = useState("all");
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [copiesByType, setCopiesByType] = useState<CopyByType[]>([]);
  const [modelConsumption, setModelConsumption] = useState<ModelConsumption[]>([]);

  const getDateRange = () => {
    const now = new Date();
    
    switch (periodFilter) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "yesterday":
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case "last-7-days":
        return { start: subDays(now, 7), end: now };
      case "last-15-days":
        return { start: subDays(now, 15), end: now };
      case "last-month":
        return { start: subDays(now, 30), end: now };
      case "previous-month":
        const prevMonth = subDays(startOfMonth(now), 1);
        return { start: startOfMonth(prevMonth), end: endOfMonth(prevMonth) };
      case "custom":
        if (dateRange?.from && dateRange?.to) {
          return { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) };
        }
        return { start: subDays(now, 7), end: now };
      default:
        return { start: subDays(now, 7), end: now };
    }
  };

  useEffect(() => {
    fetchStats();
  }, [periodFilter, planFilter, dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // MRR e Assinaturas (filtrado por período de criação)
      let subscriptionsQuery = supabase
        .from('workspace_subscriptions')
        .select('*, subscription_plans!inner(*), plan_offers(price)')
        .eq('status', 'active')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      if (planFilter !== 'all') {
        subscriptionsQuery = subscriptionsQuery.eq('subscription_plans.slug', planFilter);
      }
      
      const { data: subscriptions } = await subscriptionsQuery;
      
      const mrr = subscriptions?.reduce((sum, sub) => {
        const price = sub.plan_offers?.price || 0;
        return sum + (sub.billing_cycle === 'annual' ? price / 12 : price);
      }, 0) || 0;

      // Clientes (filtrado por período de criação)
      const { count: clientesCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Workspaces (filtrado por período de criação)
      const { count: workspacesCount } = await supabase
        .from('workspaces')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Projetos (filtrado por período de criação)
      const { count: projetosCount } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Copies (filtrado por período de criação)
      const { count: copiesCount } = await supabase
        .from('copies')
        .select('id', { count: 'exact', head: true })
        .eq('is_template', false)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Copies por tipo (filtrado por período de criação)
      const { data: copiesByTypeData } = await supabase
        .from('copies')
        .select('copy_type')
        .eq('is_template', false)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      const typeCounts = copiesByTypeData?.reduce((acc, copy) => {
        const type = copy.copy_type || 'outro';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const copiesTypeArray = Object.entries(typeCounts).map(([type, count]) => ({
        copy_type: type,
        count: count as number
      })).sort((a, b) => b.count - a.count);

      // Créditos consumidos e Custo IA
      const { data: transactionsData } = await supabase
        .from('credit_transactions')
        .select('amount, model_used, tokens_used, input_tokens, output_tokens')
        .eq('transaction_type', 'debit')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const creditosConsumidos = transactionsData?.reduce((sum, t) => sum + t.amount, 0) || 0;
      
      // Assumindo custo médio de R$ 0,01 por crédito
      const custoIA = creditosConsumidos * 0.01;

      // Consumo por modelo
      const modelStats = transactionsData?.reduce((acc, transaction) => {
        const model = transaction.model_used || 'unknown';
        if (!acc[model]) {
          acc[model] = {
            model_used: model,
            total_tokens: 0,
            total_input_tokens: 0,
            total_output_tokens: 0,
            total_credits_debited: 0,
            transaction_count: 0
          };
        }
        acc[model].total_tokens += transaction.tokens_used || 0;
        acc[model].total_input_tokens += transaction.input_tokens || 0;
        acc[model].total_output_tokens += transaction.output_tokens || 0;
        acc[model].total_credits_debited += transaction.amount || 0;
        acc[model].transaction_count += 1;
        return acc;
      }, {} as Record<string, ModelConsumption>) || {};

      const modelArray = Object.values(modelStats).sort((a, b) => 
        b.total_credits_debited - a.total_credits_debited
      );

      setStats({
        mrr,
        assinaturas: subscriptions?.length || 0,
        clientes: clientesCount || 0,
        workspaces: workspacesCount || 0,
        projetos: projetosCount || 0,
        copies: copiesCount || 0,
        creditos_consumidos: creditosConsumidos,
        custo_ia: custoIA,
      });

      setCopiesByType(copiesTypeArray);
      setModelConsumption(modelArray);

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const periodOptions = [
    { value: "today", label: "Hoje" },
    { value: "yesterday", label: "Ontem" },
    { value: "last-7-days", label: "Últimos 7 dias" },
    { value: "last-15-days", label: "Últimos 15 dias" },
    { value: "last-month", label: "Último mês" },
    { value: "previous-month", label: "Mês anterior" },
    { value: "custom", label: "Período personalizado" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header with Filters */}
        <div className="flex items-end justify-end gap-3">
          <Select value={periodFilter} onValueChange={(value) => {
            setPeriodFilter(value);
            if (value === "custom") {
              setCustomDateOpen(true);
            }
          }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range Dialog */}
        <Dialog open={customDateOpen} onOpenChange={setCustomDateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecionar Período</DialogTitle>
            </DialogHeader>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              locale={ptBR}
              className="rounded-md border"
            />
            <Button onClick={() => {
              setCustomDateOpen(false);
              fetchStats();
            }}>
              Aplicar
            </Button>
          </DialogContent>
        </Dialog>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* MRR */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                MRR
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(stats.mrr)}</div>
              )}
            </CardContent>
          </Card>

          {/* Assinaturas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assinaturas
              </CardTitle>
              <Wallet className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats.assinaturas}</div>
              )}
            </CardContent>
          </Card>

          {/* Clientes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats.clientes}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Workspaces
              </CardTitle>
              <FolderOpen className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-2xl font-bold">{stats.workspaces}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projetos
              </CardTitle>
              <FileText className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-2xl font-bold">{stats.projetos}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Copies
              </CardTitle>
              <FileText className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-2xl font-bold">{stats.copies}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Copies by Type - Large Card */}
        <Card>
          <CardHeader>
            <CardTitle>Copies por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : copiesByType.length > 0 ? (
              <div className="space-y-3">
                {copiesByType.map((item) => (
                  <div key={item.copy_type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium capitalize">{item.copy_type}</span>
                    <span className="text-2xl font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhuma copy criada no período</p>
            )}
          </CardContent>
        </Card>

        {/* Credits and AI Cost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Créditos Consumidos
              </CardTitle>
              <CreditCard className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold">{stats.creditos_consumidos.toFixed(2)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Custo IA
              </CardTitle>
              <Zap className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold">{formatCurrency(stats.custo_ia)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Model Consumption - Large Card */}
        <Card>
          <CardHeader>
            <CardTitle>Consumo por Modelo</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : modelConsumption.length > 0 ? (
              <div className="space-y-4">
                {modelConsumption.map((model) => (
                  <div key={model.model_used} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">{model.model_used}</span>
                      <span className="text-sm text-muted-foreground">{model.transaction_count} gerações</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tokens Total</p>
                        <p className="font-bold">{model.total_tokens.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Input</p>
                        <p className="font-bold">{model.total_input_tokens.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Output</p>
                        <p className="font-bold">{model.total_output_tokens.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Créditos</p>
                        <p className="font-bold text-orange-600">{model.total_credits_debited.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum consumo registrado no período</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
