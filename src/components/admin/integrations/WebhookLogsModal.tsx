import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, RefreshCw } from "lucide-react";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WebhookLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationSlug: string;
}

interface LogDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: any;
}

function LogDetailsModal({ open, onOpenChange, log }: LogDetailsModalProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Detalhes do Webhook</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Informações Gerais</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Evento</p>
                  <p className="font-medium">{log.event_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={log.status === 'success' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                    {log.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Recebido em</p>
                  <p className="font-medium">{format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
                </div>
                {log.processed_at && (
                  <div>
                    <p className="text-muted-foreground">Processado em</p>
                    <p className="font-medium">{format(new Date(log.processed_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
                  </div>
                )}
              </div>
            </div>

            {log.error_message && (
              <div>
                <h3 className="font-semibold mb-2 text-destructive">Mensagem de Erro</h3>
                <pre className="bg-destructive/10 p-3 rounded text-sm overflow-x-auto">
                  {log.error_message}
                </pre>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Payload</h3>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(log.payload, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Headers</h3>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(log.headers, null, 2)}
              </pre>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function WebhookLogsModal({ open, onOpenChange, integrationSlug }: WebhookLogsModalProps) {
  const { logs, logsLoading } = usePaymentGateway(integrationSlug);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const filteredLogs = logs?.filter(log => 
    !statusFilter || log.status === statusFilter
  ) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      success: "default",
      failed: "destructive",
      processing: "secondary",
      received: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Logs de Webhooks - Ticto</DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 mb-4">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === "all" ? undefined : value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="failed">Falha</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="received">Recebido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[50vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Carregando logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{log.event_type}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <LogDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        log={selectedLog}
      />
    </>
  );
}
