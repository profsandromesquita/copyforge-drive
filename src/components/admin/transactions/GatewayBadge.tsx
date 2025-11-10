import { Badge } from "@/components/ui/badge";

interface GatewayBadgeProps {
  slug: string;
}

const gatewayConfig: Record<string, { name: string; className: string }> = {
  ticto: { name: 'Ticto', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  stripe: { name: 'Stripe', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  hotmart: { name: 'Hotmart', className: 'bg-orange-100 text-orange-800 border-orange-200' },
};

export const GatewayBadge = ({ slug }: GatewayBadgeProps) => {
  const config = gatewayConfig[slug] || { 
    name: slug.charAt(0).toUpperCase() + slug.slice(1), 
    className: 'bg-muted text-muted-foreground' 
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.name}
    </Badge>
  );
};
