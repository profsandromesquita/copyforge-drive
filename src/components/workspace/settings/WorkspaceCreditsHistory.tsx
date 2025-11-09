import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceTransactions, CreditTransaction } from "@/hooks/useWorkspaceTransactions";
import { Download, ArrowDown, ArrowUp, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatCredits } from "@/lib/utils";

export const WorkspaceCreditsHistory = () => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const { data: transactions, isLoading } = useWorkspaceTransactions({
    type: typeFilter,
  });

  const summary = useMemo(() => {
    if (!transactions) return null;

    const totalDebited = transactions
      .filter(tx => tx.transaction_type === 'debit')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const totalAdded = transactions
      .filter(tx => tx.transaction_type === 'credit')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const generations = transactions.filter(tx => tx.transaction_type === 'debit');
    const avgPerGeneration = generations.length > 0 
      ? totalDebited / generations.length 
      : 0;

    const modelCounts = generations.reduce((acc, tx) => {
      if (tx.model_used) {
        acc[tx.model_used] = (acc[tx.model_used] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostUsedModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalDebited,
      totalAdded,
      avgPerGeneration,
      mostUsedModel
    };
  }, [transactions]);

  const exportToCSV = () => {
    if (!transactions || transactions.length === 0) return;

    const headers = [
      'Data',
      'Tipo',
      'Usuário',
      'Email',
      'Valor',
      'Saldo Anterior',
      'Saldo Após',
      'Modelo',
      'Tokens',
      'Descrição'
    ];

    const rows = transactions.map(tx => [
      format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      tx.transaction_type === 'debit' ? 'Débito' : 'Crédito',
      tx.user?.name || 'N/A',
      tx.user?.email || 'N/A',
      tx.amount.toFixed(4),
      formatCredits(tx.balance_before),
      formatCredits(tx.balance_after),
      tx.model_used || '-',
      tx.tokens_used || '-',
      tx.description || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes-creditos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const toggleExpanded = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 min-w-0">
          <Card className="min-w-0">
            <CardContent className="pt-3 pb-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Debitado</p>
                <p className="text-xl font-bold text-destructive flex items-center gap-1">
                  <ArrowDown className="h-3 w-3" />
                  {formatCredits(summary.totalDebited)}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="min-w-0">
            <CardContent className="pt-3 pb-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Adicionado</p>
                <p className="text-xl font-bold text-green-600 flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  {formatCredits(summary.totalAdded)}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="min-w-0">
            <CardContent className="pt-3 pb-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Média por Geração</p>
                <p className="text-xl font-bold">{summary.avgPerGeneration.toFixed(4)}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="min-w-0">
            <CardContent className="pt-3 pb-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Modelo + Usado</p>
                <p className="text-base font-bold truncate" title={summary.mostUsedModel}>
                  {summary.mostUsedModel}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Export */}
      <Card>
        <CardHeader className="pb-2 px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-base">Histórico de Transações</CardTitle>
              <CardDescription className="text-xs">
                Visualize todas as operações de crédito e débito
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="debit">Débitos</SelectItem>
                  <SelectItem value="credit">Créditos</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToCSV}
                disabled={!transactions || transactions.length === 0}
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2 px-4">
          {!transactions || transactions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-xs">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden max-h-[280px] overflow-y-auto min-w-0">
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] px-2"></TableHead>
                      <TableHead className="text-xs px-2">Data</TableHead>
                      <TableHead className="text-xs px-2">Usuário</TableHead>
                      <TableHead className="text-xs px-2">Tipo</TableHead>
                      <TableHead className="text-xs px-2 hidden md:table-cell">Modelo</TableHead>
                      <TableHead className="text-xs px-2 text-right">Tokens</TableHead>
                      <TableHead className="text-xs px-2 text-right">Valor</TableHead>
                      <TableHead className="text-xs px-2 text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <>
                        <TableRow 
                          key={tx.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleExpanded(tx.id)}
                        >
                          <TableCell className="px-2">
                            {expandedRow === tx.id ? (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-xs px-2 whitespace-nowrap">
                            {format(new Date(tx.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Avatar className="h-5 w-5 flex-shrink-0">
                                <AvatarImage src={tx.user?.avatar_url} />
                                <AvatarFallback className="text-[10px]">
                                  {tx.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs truncate max-w-[80px]" title={tx.user?.name}>
                                {tx.user?.name || 'Usuário'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <Badge variant={tx.transaction_type === 'debit' ? 'destructive' : 'default'} className="text-[10px] px-1.5 py-0">
                              {tx.transaction_type === 'debit' ? (
                                <><ArrowDown className="h-2.5 w-2.5 mr-0.5" /><span className="hidden sm:inline">Débito</span></>
                              ) : (
                                <><ArrowUp className="h-2.5 w-2.5 mr-0.5" /><span className="hidden sm:inline">Crédito</span></>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs px-2 hidden md:table-cell">
                            <span className="truncate max-w-[100px] inline-block" title={tx.model_used || '-'}>
                              {tx.model_used || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs px-2 whitespace-nowrap">
                            {tx.tokens_used?.toLocaleString() || '-'}
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-medium text-xs px-2 whitespace-nowrap",
                            tx.transaction_type === 'debit' ? 'text-destructive' : 'text-green-600'
                          )}>
                            {tx.transaction_type === 'debit' ? '-' : '+'}{Math.abs(tx.amount).toFixed(4)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-xs px-2 whitespace-nowrap">
                            {formatCredits(tx.balance_after)}
                          </TableCell>
                        </TableRow>
                        
                        {expandedRow === tx.id && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-muted/30 px-2">
                              <div className="p-3 space-y-2">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                  {tx.model_used && (
                                    <div className="md:hidden">
                                      <p className="text-muted-foreground">Modelo</p>
                                      <p className="font-medium">{tx.model_used}</p>
                                    </div>
                                  )}
                                  {tx.input_tokens && (
                                    <div>
                                      <p className="text-muted-foreground">Tokens Entrada</p>
                                      <p className="font-medium">{tx.input_tokens.toLocaleString()}</p>
                                    </div>
                                  )}
                                  {tx.output_tokens && (
                                    <div>
                                      <p className="text-muted-foreground">Tokens Saída</p>
                                      <p className="font-medium">{tx.output_tokens.toLocaleString()}</p>
                                    </div>
                                  )}
                                  {tx.tpc_snapshot && (
                                    <div>
                                      <p className="text-muted-foreground">TPC Snapshot</p>
                                      <p className="font-medium">{tx.tpc_snapshot}</p>
                                    </div>
                                  )}
                                  {tx.multiplier_snapshot && (
                                    <div>
                                      <p className="text-muted-foreground">Multiplicador</p>
                                      <p className="font-medium">{tx.multiplier_snapshot}x</p>
                                    </div>
                                  )}
                                  {tx.cost_limit_snapshot && (
                                    <div>
                                      <p className="text-muted-foreground">Limite de Custo</p>
                                      <p className="font-medium">{tx.cost_limit_snapshot}%</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-muted-foreground">Saldo Anterior</p>
                                    <p className="font-medium">{formatCredits(tx.balance_before)}</p>
                                  </div>
                                </div>
                                
                                {tx.description && (
                                  <div>
                                    <p className="text-muted-foreground text-xs">Descrição</p>
                                    <p className="text-xs">{tx.description}</p>
                                  </div>
                                )}
                                
                                {tx.generation_id && (
                                  <div>
                                    <p className="text-muted-foreground text-xs">ID da Geração</p>
                                    <p className="text-[10px] font-mono break-all">{tx.generation_id}</p>
                                  </div>
                                )}
                                
                                <div>
                                  <p className="text-muted-foreground text-xs">Email do Usuário</p>
                                  <p className="text-xs break-all">{tx.user?.email || 'N/A'}</p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
