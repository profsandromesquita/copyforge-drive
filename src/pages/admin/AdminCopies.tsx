import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, ArrowsClockwise } from "phosphor-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAdminCopies, useAdminCopyDetails } from "@/hooks/useAdminCopies";
import { CopyGenerationFilters } from "@/components/admin/CopyGenerationFilters";
import { CopyGenerationDetailsModal } from "@/components/admin/CopyGenerationDetailsModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useQueryClient } from "@tanstack/react-query";
import { calculateGenerationCost, formatCost } from "@/lib/ai-pricing";
import { toast } from "sonner";

export default function AdminCopies() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [selectedGeneration, setSelectedGeneration] = useState<any>(null);
  const [selectedGenerationId, setSelectedGenerationId] = useState<string>("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useAdminCopies(filters, page, 20);
  const { data: generationDetails, isLoading: isDetailsLoading } = useAdminCopyDetails(selectedGenerationId);

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL");
      const data = await response.json();
      const usdBrl = data.USDBRL;
      setExchangeRate(parseFloat(usdBrl.bid));
    } catch (error) {
      console.error("Erro ao buscar cotação:", error);
      toast.error("Erro ao buscar cotação do dólar");
    }
  };

  const formatCurrency = (value: number, currency: "USD" | "BRL") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  };

  const convertToBRL = (usdValue: number): number => {
    if (!exchangeRate) return 0;
    return usdValue * exchangeRate;
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-copies"] });
    refetch();
    fetchExchangeRate();
  };

  const getCategoryColor = (category: string) => {
    return category === "text" 
      ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
      : "bg-purple-500/10 text-purple-500 border-purple-500/20";
  };

  const getModelBadgeColor = (model: string) => {
    if (model?.includes("gemini")) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (model?.includes("gpt")) return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  const formatTokens = (tokens: number) => {
    if (!tokens) return "0";
    return new Intl.NumberFormat("pt-BR").format(tokens);
  };

  const calculateTotals = () => {
    if (!data?.generations) return { totalCostUSD: 0, totalCostBRL: 0, totalTokens: 0 };
    
    let totalCostUSD = 0;
    let totalTokens = 0;
    
    data.generations.forEach(generation => {
      const cost = calculateGenerationCost(
        generation.model_used || 'google/gemini-2.5-flash',
        generation.input_tokens || 0,
        generation.output_tokens || 0
      );
      totalCostUSD += cost;
      totalTokens += (generation.total_tokens || 0);
    });
    
    const totalCostBRL = convertToBRL(totalCostUSD);
    
    return { totalCostUSD, totalCostBRL, totalTokens };
  };

  const totals = calculateTotals();

  const handleViewDetails = (generation: any) => {
    setSelectedGeneration(generation);
    setSelectedGenerationId(generation.id);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedGenerationId("");
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-end gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <ArrowsClockwise size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {data && (
            <Badge variant="outline" className="text-lg px-4 py-2">
              {data.totalCount} gerações
            </Badge>
          )}
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Custo Total (USD)</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                {formatCost(totals.totalCostUSD)}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Custo Total (BRL)</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : exchangeRate ? (
              <>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {formatCurrency(totals.totalCostBRL, "BRL")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cotação: {formatCurrency(exchangeRate, "BRL")}/USD
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground mt-2">Carregando...</div>
            )}
          </Card>

          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total de Tokens</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <div className="text-2xl font-bold mt-2">
                {formatTokens(totals.totalTokens)}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-4">
          <CopyGenerationFilters filters={filters} onFiltersChange={setFilters} />
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Tokens IN</TableHead>
                  <TableHead className="text-right">Tokens OUT</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.generations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Nenhuma geração encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.generations.map((generation) => (
                    <TableRow key={generation.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(generation.created_at), "dd/MM/yy HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={generation.profiles?.avatar_url || ""} />
                            <AvatarFallback className="text-xs">
                              {generation.profiles?.name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {generation.profiles?.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={generation.workspaces?.avatar_url || ""} />
                            <AvatarFallback className="text-xs">
                              {generation.workspaces?.name?.[0] || "W"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate max-w-[120px]">
                            {generation.workspaces?.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant="outline" 
                            className={`font-mono text-xs ${getModelBadgeColor(generation.model_used)}`}
                          >
                            {generation.model_used?.split("/")[1] || generation.model_used}
                          </Badge>
                          <Badge 
                            variant={generation.was_auto_routed ? "secondary" : "outline"}
                            className="text-xs w-fit"
                          >
                            {generation.was_auto_routed ? "Auto" : "Manual"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={getCategoryColor(generation.generation_category)}
                        >
                          {generation.generation_category === "text" ? "Texto" : "Imagem"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatTokens(generation.input_tokens)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatTokens(generation.output_tokens)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">
                        {formatTokens(generation.total_tokens)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm font-semibold text-orange-600 dark:text-orange-400">
                          {generation.credits_debited ? generation.credits_debited.toFixed(2) : '0.00'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-sm text-green-600 dark:text-green-400 font-semibold">
                            {formatCost(
                              calculateGenerationCost(
                                generation.model_used || 'google/gemini-2.5-flash',
                                generation.input_tokens || 0,
                                generation.output_tokens || 0
                              )
                            )}
                          </span>
                          {exchangeRate && (
                            <span className="font-mono text-xs text-muted-foreground mt-0.5">
                              {formatCurrency(
                                convertToBRL(
                                  calculateGenerationCost(
                                    generation.model_used || 'google/gemini-2.5-flash',
                                    generation.input_tokens || 0,
                                    generation.output_tokens || 0
                                  )
                                ),
                                "BRL"
                              )}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(generation)}
                        >
                          <Eye size={16} className="mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(Math.max(1, page - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={page === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                    className={page === data.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <CopyGenerationDetailsModal
        generation={generationDetails || selectedGeneration}
        open={detailsOpen}
        onOpenChange={handleCloseDetails}
        isLoading={isDetailsLoading}
      />
    </AdminLayout>
  );
}
