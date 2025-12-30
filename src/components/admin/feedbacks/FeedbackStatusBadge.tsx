import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FeedbackStatus } from "@/hooks/useAdminFeedbacks";

const statusConfig: Record<FeedbackStatus, { label: string; className: string }> = {
  pending: {
    label: "Pendente",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  in_progress: {
    label: "Em Progresso",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  resolved: {
    label: "Resolvido",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  closed: {
    label: "Fechado",
    className: "bg-muted text-muted-foreground",
  },
};

interface FeedbackStatusBadgeProps {
  status: FeedbackStatus;
  className?: string;
}

export function FeedbackStatusBadge({ status, className }: FeedbackStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
