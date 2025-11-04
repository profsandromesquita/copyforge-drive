import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash } from 'phosphor-react';
import { Offer } from '@/types/project-config';
import { OFFER_TYPES } from '@/types/project-config';

interface OfferCardProps {
  offer: Offer;
  onEdit: (offer: Offer) => void;
  onDelete: (offerId: string) => void;
}

export const OfferCard = ({ offer, onEdit, onDelete }: OfferCardProps) => {
  const typeLabel = OFFER_TYPES.find(t => t.value === offer.type)?.label || offer.type;

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-lg">{offer.name}</h3>
          <Badge variant="secondary" className="mt-2">{typeLabel}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(offer)}>
            <Pencil size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(offer.id)}>
            <Trash size={18} className="text-destructive" />
          </Button>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">{offer.short_description}</p>

        <div>
          <p className="font-medium">Benefício principal:</p>
          <p className="text-muted-foreground">{offer.main_benefit}</p>
        </div>

        <div>
          <p className="font-medium">Mecanismo único:</p>
          <p className="text-muted-foreground">{offer.unique_mechanism}</p>
        </div>

        {offer.differentials && offer.differentials.length > 0 && (
          <div>
            <p className="font-medium mb-2">Diferenciais:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {offer.differentials.map((diff, idx) => (
                <li key={idx}>{diff}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="font-medium">CTA:</p>
          <p className="text-muted-foreground">{offer.cta}</p>
        </div>
      </div>
    </div>
  );
};
