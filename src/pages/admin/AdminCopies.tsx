import { useState } from "react";
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
import { Eye } from "phosphor-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAdminCopies } from "@/hooks/useAdminCopies";
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

export default function AdminCopies() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [selectedGeneration, setSelectedGeneration] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data, isLoading } = useAdminCopies(filters, page, 20);

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

  const handleViewDetails = (generation: any) => {
    setSelectedGeneration(generation);
    setDetailsOpen(true);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Copy IA</h1>
            <p className="text-muted-foreground mt-1">
              Histórico completo de gerações de IA
            </p>
          </div>
          {data && (
            <Badge variant="outline" className="text-lg px-4 py-2">
              {data.totalCount} gerações
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <CopyGenerationFilters filters={filters} onFiltersChange={setFilters} />
          </CardContent>
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
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.generations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                        <Badge 
                          variant="outline" 
                          className={`font-mono text-xs ${getModelBadgeColor(generation.model_used)}`}
                        >
                          {generation.model_used?.split("/")[1] || generation.model_used}
                        </Badge>
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
        generation={selectedGeneration}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </AdminLayout>
  );
}
