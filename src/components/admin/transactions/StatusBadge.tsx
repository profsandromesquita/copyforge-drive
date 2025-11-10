import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Eye } from "phosphor-react";

interface StatusBadgeProps {
  status: 'success' | 'failed' | 'processing' | 'received';
}

const statusConfig = {
  success: { 
    label: 'Aprovada', 
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle 
  },
  failed: { 
    label: 'Falha', 
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle 
  },
  processing: { 
    label: 'Processando', 
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock 
  },
  received: { 
    label: 'Recebida', 
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Eye 
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} gap-1`}>
      <Icon size={14} />
      {config.label}
    </Badge>
  );
};
