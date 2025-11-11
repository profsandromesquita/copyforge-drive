import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { usePaymentTransactions, usePaymentTransactionsSummary, PaymentTransaction } from "@/hooks/usePaymentTransactions";
import { GatewayBadge } from "@/components/admin/transactions/GatewayBadge";
import { StatusBadge } from "@/components/admin/transactions/StatusBadge";
import { TransactionDetailsModal } from "@/components/admin/transactions/TransactionDetailsModal";
import { formatCurrency } from "@/lib/utils";
import { format, formatDistanceToNow, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Eye, CurrencyDollar, CheckCircle, XCircle, Clock } from "phosphor-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const AdminTransactions = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [gatewayFilter, setGatewayFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState("last-7-days");
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const navigate = useNavigate();

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

  const { start, end } = getDateRange();

  console.log('Date range:', { start, end, startISO: start.toISOString(), endISO: end.toISOString() });

  const { data: transactions, isLoading } = usePaymentTransactions({
    gateway: gatewayFilter !== "all" ? gatewayFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  });

  const { data: summary } = usePaymentTransactionsSummary({
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  });

  console.log('Transactions query:', { isLoading, transactionsCount: transactions?.length });

  const handleViewDetails = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
  };

  const handleViewWorkspace = (workspaceId: string) => {
    navigate(`/painel/admin/workspaces/${workspaceId}`);
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Transações</p>
                <p className="text-2xl font-bold">
                  {summary?.total || 0}
                </p>
              </div>
              <CurrencyDollar size={32} className="text-primary" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary?.totalAmount || 0)}
                </p>
              </div>
              <CurrencyDollar size={32} className="text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">
                  {summary?.successRate.toFixed(1) || 0}%
                </p>
              </div>
              <CheckCircle size={32} className="text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Falhas</p>
                <p className="text-2xl font-bold">
                  {summary?.failedCount || 0}
                </p>
              </div>
              <XCircle size={32} className="text-destructive" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4">
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

            <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os gateways" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ticto">Ticto</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Aprovada</SelectItem>
                <SelectItem value="failed">Falha</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="received">Recebida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

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
            <Button onClick={() => setCustomDateOpen(false)}>
              Aplicar
            </Button>
          </DialogContent>
        </Dialog>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plataforma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Oferta</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Atualização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : transactions && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <GatewayBadge slug={transaction.integration_slug} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={transaction.status} />
                    </TableCell>
                    <TableCell>
                      {transaction.workspace_id ? (
                        <div>
                          <button
                            onClick={() => handleViewWorkspace(transaction.workspace_id!)}
                            className="font-medium hover:underline"
                          >
                            {transaction.workspace_name || 'N/A'}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {transaction.workspace_id.slice(0, 8)}...
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.owner_name ? (
                        <div>
                          <p className="font-medium">{transaction.owner_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.owner_email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold">
                        {formatCurrency(transaction.paid_amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.offer_name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.offer_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(transaction.created_at), "dd/MM/yy HH:mm")}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(transaction.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.processed_at ? (
                        <div className="text-sm">
                          {format(new Date(transaction.processed_at), "dd/MM/yy HH:mm")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(transaction)}
                      >
                        <Eye size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <TransactionDetailsModal
        transaction={selectedTransaction}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </AdminLayout>
  );
};

export default AdminTransactions;
