import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, X } from 'phosphor-react';
import { Offer } from '@/types/project-config';
import { OfferCard } from './OfferCard';
import { OfferForm } from './OfferForm';
import { useProject } from '@/hooks/useProject';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const OffersTab = () => {
  const { activeProject, refreshProjects } = useProject();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);

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
    setOfferToDelete(offerId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteOffer = async () => {
    if (!offerToDelete || !activeProject) return;

    try {
      const updatedOffers = offers.filter(o => o.id !== offerToDelete);
      
      await supabase
        .from('projects')
        .update({ offers: updatedOffers as any })
        .eq('id', activeProject.id);

      await refreshProjects();
      setOffers(updatedOffers);
      toast.success('Oferta excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir oferta:', error);
      toast.error('Erro ao excluir oferta');
    } finally {
      setDeleteDialogOpen(false);
      setOfferToDelete(null);
    }
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingOffer(null);
  };

  return (
    <div className="space-y-6">
      {!isFormOpen && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Ofertas</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure suas ofertas, produtos ou serviços
              </p>
            </div>
            {offers.length > 0 && (
              <Button onClick={handleAddOffer}>
                <Plus size={20} className="mr-2" />
                Adicionar Oferta
              </Button>
            )}
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
        </>
      )}

      {isFormOpen && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {editingOffer ? 'Editar' : 'Nova'} Oferta
            </h2>
            <Button variant="ghost" size="icon" onClick={handleCancelForm}>
              <X size={20} />
            </Button>
          </div>
          
          <OfferForm
            offer={editingOffer}
            allOffers={offers}
            onSave={(newOffers) => {
              setOffers(newOffers);
              setIsFormOpen(false);
              setEditingOffer(null);
            }}
            onCancel={handleCancelForm}
            onAutoSavingChange={setIsAutoSaving}
          />
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Oferta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta oferta? 
              Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteOffer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
