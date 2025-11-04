import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'phosphor-react';
import { Offer } from '@/types/project-config';
import { OfferCard } from './OfferCard';
import { OfferForm } from './OfferForm';
import { useProject } from '@/hooks/useProject';

export const OffersTab = () => {
  const { activeProject } = useProject();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  useEffect(() => {
    if (activeProject?.offers) {
      setOffers(activeProject.offers);
    }
  }, [activeProject]);

  const handleAddOffer = () => {
    setEditingOffer(null);
    setIsFormOpen(true);
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setIsFormOpen(true);
  };

  const handleDeleteOffer = (offerId: string) => {
    setOffers(offers.filter(o => o.id !== offerId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Ofertas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure suas ofertas, produtos ou serviços
          </p>
        </div>
        <Button onClick={handleAddOffer}>
          <Plus size={20} className="mr-2" />
          Adicionar Oferta
        </Button>
      </div>

      {offers.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Nenhuma oferta criada ainda
          </p>
          <Button onClick={handleAddOffer}>
            <Plus size={20} className="mr-2" />
            Criar Primeira Oferta
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onEdit={handleEditOffer}
              onDelete={handleDeleteOffer}
            />
          ))}
        </div>
      )}

      <OfferForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        offer={editingOffer}
        allOffers={offers}
        onSave={setOffers}
      />
    </div>
  );
};
