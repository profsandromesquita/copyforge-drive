import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlanOffer, PlanOfferFormData } from "@/hooks/usePlanOffers";

interface PlanOfferModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PlanOfferFormData) => void;
  planId: string;
  activeGatewayId: string;
  offer?: PlanOffer;
  isSubmitting?: boolean;
}

const BILLING_UNITS = [
  { value: 'days', label: 'Dias' },
  { value: 'months', label: 'Meses' },
  { value: 'years', label: 'Anos' },
  { value: 'lifetime', label: 'Vitalício' },
];

export function PlanOfferModal({
  open,
  onClose,
  onSubmit,
  planId,
  activeGatewayId,
  offer,
  isSubmitting,
}: PlanOfferModalProps) {
  const [formData, setFormData] = useState<PlanOfferFormData>({
    plan_id: planId,
    payment_gateway_id: activeGatewayId,
    name: '',
    price: 0,
    billing_period_value: 1,
    billing_period_unit: 'months',
    gateway_offer_id: '',
    checkout_url: '',
    display_order: 0,
  });

  useEffect(() => {
    if (offer) {
      setFormData({
        plan_id: offer.plan_id,
        payment_gateway_id: offer.payment_gateway_id,
        name: offer.name,
        price: offer.price,
        billing_period_value: offer.billing_period_value,
        billing_period_unit: offer.billing_period_unit,
        gateway_offer_id: offer.gateway_offer_id,
        checkout_url: offer.checkout_url,
        display_order: offer.display_order,
      });
    } else {
      setFormData({
        plan_id: planId,
        payment_gateway_id: activeGatewayId,
        name: '',
        price: 0,
        billing_period_value: 1,
        billing_period_unit: 'months',
        gateway_offer_id: '',
        checkout_url: '',
        display_order: 0,
      });
    }
  }, [offer, planId, activeGatewayId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {offer ? 'Editar Oferta' : 'Nova Oferta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Oferta *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Mensal, Trimestral, Anual"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billing_period_value">Período (Valor) *</Label>
              <Input
                id="billing_period_value"
                type="number"
                min="1"
                value={formData.billing_period_value}
                onChange={(e) => setFormData({ ...formData, billing_period_value: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_period_unit">Período (Unidade) *</Label>
              <Select
                value={formData.billing_period_unit}
                onValueChange={(value: any) => setFormData({ ...formData, billing_period_unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gateway_offer_id">ID da Oferta no Gateway *</Label>
            <Input
              id="gateway_offer_id"
              value={formData.gateway_offer_id}
              onChange={(e) => setFormData({ ...formData, gateway_offer_id: e.target.value })}
              placeholder="ID da oferta no gateway de pagamento"
              required
            />
            <p className="text-xs text-muted-foreground">
              Insira o ID da oferta/produto criado no gateway de pagamento (ex: Ticto)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkout_url">URL de Checkout *</Label>
            <Input
              id="checkout_url"
              type="url"
              value={formData.checkout_url}
              onChange={(e) => setFormData({ ...formData, checkout_url: e.target.value })}
              placeholder="https://..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Ordem de Exibição</Label>
            <Input
              id="display_order"
              type="number"
              min="0"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Define a ordem em que as ofertas aparecem (menor = primeiro)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : offer ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
