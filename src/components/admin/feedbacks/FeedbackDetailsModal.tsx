import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FeedbackStatusBadge } from "./FeedbackStatusBadge";
import { FeedbackCategoryBadge } from "./FeedbackCategoryBadge";
import { useUpdateFeedback, type FeedbackReport, type FeedbackStatus } from "@/hooks/useAdminFeedbacks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ExternalLink, User, Building2, Clock, Monitor, Globe, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackDetailsModalProps {
  feedback: FeedbackReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDetailsModal({ feedback, open, onOpenChange }: FeedbackDetailsModalProps) {
  const [status, setStatus] = useState<FeedbackStatus>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [techDetailsOpen, setTechDetailsOpen] = useState(false);
  
  const updateFeedback = useUpdateFeedback();

  useEffect(() => {
    if (feedback) {
      setStatus(feedback.status);
      setAdminNotes(feedback.admin_notes || '');
    }
  }, [feedback]);

  if (!feedback) return null;

  const hasChanges = status !== feedback.status || adminNotes !== (feedback.admin_notes || '');

  const handleSave = () => {
    updateFeedback.mutate({
      id: feedback.id,
      status,
      admin_notes: adminNotes,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Detalhes do Feedback
            <FeedbackStatusBadge status={feedback.status} />
            <FeedbackCategoryBadge category={feedback.category} />
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <div className="space-y-6">
            {/* User Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                Reportado por
              </h4>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">{feedback.user_name || 'Usuário desconhecido'}</p>
                <p className="text-sm text-muted-foreground">{feedback.user_email}</p>
              </div>
            </div>

            {/* Workspace Info */}
            {feedback.workspace_name && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Workspace
                </h4>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-medium">{feedback.workspace_name}</p>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Descrição</h4>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="whitespace-pre-wrap text-sm">{feedback.description}</p>
              </div>
            </div>

            {/* Technical Details */}
            <Collapsible open={techDetailsOpen} onOpenChange={setTechDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="text-sm font-medium">Dados Técnicos</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    techDetailsOpen && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div className="grid gap-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">URL</p>
                      <a 
                        href={feedback.page_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {feedback.page_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 text-sm">
                    <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Resolução</p>
                      <p>{feedback.screen_resolution || 'Não capturado'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">User Agent</p>
                      <p className="text-xs break-all">{feedback.user_agent || 'Não capturado'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground">Data do Report</p>
                      <p>{format(new Date(feedback.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Admin Controls */}
            <div className="border-t pt-6 space-y-4">
              <h4 className="text-sm font-medium">Controles do Admin</h4>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as FeedbackStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-notes">Notas Internas</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Adicione notas sobre a resolução..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || updateFeedback.isPending}
                className="w-full"
              >
                {updateFeedback.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
