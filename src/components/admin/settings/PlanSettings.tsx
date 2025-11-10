import { useState } from "react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useActivePaymentGateways } from "@/hooks/useActivePaymentGateways";
import { usePlanOffers } from "@/hooks/usePlanOffers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, PencilSimple, Package, Trash, CurrencyDollar } from "phosphor-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { PlanOfferModal } from "./PlanOfferModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlanFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  max_projects: number | null;
  max_copies: number | null;
  copy_ai_enabled: boolean;
  credits_per_month: number;
  rollover_enabled: boolean;
  rollover_percentage: number;
  rollover_days: number;
  display_order: number;
}

const emptyForm: PlanFormData = {
  name: '',
  slug: '',
  description: '',
  max_projects: null,
  max_copies: null,
  copy_ai_enabled: false,
  credits_per_month: 0,
  rollover_enabled: false,
  rollover_percentage: 0,
  rollover_days: 0,
  display_order: 0,
};

export const PlanSettings = () => {
  const { plans, isLoading, createPlan, updatePlan, togglePlanStatus } = useSubscriptionPlans();
  const { data: gateways = [] } = useActivePaymentGateways();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlanForOffers, setSelectedPlanForOffers] = useState<string | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  
  const { offers, createOffer, updateOffer, deleteOffer, toggleOfferStatus, isCreating, isUpdating } = usePlanOffers(selectedPlanForOffers || undefined);
  
  // Filtrar ofertas pelo gateway selecionado
  const filteredOffers = selectedGateway 
    ? offers.filter(offer => offer.payment_gateway_id === selectedGateway)
    : offers;

  const handleOpenDialog = (plan?: any) => {
    if (plan) {
      setFormData(plan);
      setIsEditing(true);
    } else {
      setFormData(emptyForm);
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && formData.id) {
      await updatePlan.mutateAsync(formData as any);
    } else {
      const { id, ...planData } = formData;
      await createPlan.mutateAsync(planData as any);
    }
    
    setIsDialogOpen(false);
    setFormData(emptyForm);
  };

  const handleInputChange = (field: keyof PlanFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-gerar slug a partir do nome
    if (field === 'name' && !isEditing) {
      const slug = value.toLowerCase().replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleManageOffers = (planId: string) => {
    setSelectedPlanForOffers(planId);
    // Auto-selecionar primeiro gateway ativo
    const firstGateway = gateways.find(g => g.is_active);
    if (firstGateway) {
      setSelectedGateway(firstGateway.id);
    }
  };

  const handleCreateOffer = () => {
    setEditingOffer(null);
    setIsOfferModalOpen(true);
  };

  const handleEditOffer = (offer: any) => {
    setEditingOffer(offer);
    setIsOfferModalOpen(true);
  };

  const handleOfferSubmit = (offerData: any) => {
    if (editingOffer) {
      updateOffer({ id: editingOffer.id, ...offerData });
    } else {
      createOffer(offerData);
    }
    setIsOfferModalOpen(false);
    setEditingOffer(null);
  };

  const handleDeleteOffer = (offerId: string) => {
    setOfferToDelete(offerId);
  };

  const confirmDeleteOffer = () => {
    if (offerToDelete) {
      deleteOffer(offerToDelete);
      setOfferToDelete(null);
    }
  };

  const getBillingPeriodLabel = (value: number, unit: string) => {
    if (unit === 'lifetime') return 'Vitalício';
    const unitLabel = unit === 'days' ? 'dia' : unit === 'months' ? 'mês' : 'ano';
    return `${value} ${unitLabel}${value > 1 ? (unit === 'months' ? 'es' : 's') : ''}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planos de Assinatura</h2>
          <p className="text-muted-foreground">Gerencie os planos e seus recursos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    disabled={isEditing}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>


              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="max_projects">Máx. Projetos</Label>
                  <Input
                    id="max_projects"
                    type="number"
                    placeholder="Ilimitado"
                    value={formData.max_projects || ''}
                    onChange={(e) => handleInputChange('max_projects', e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_copies">Máx. Copies</Label>
                  <Input
                    id="max_copies"
                    type="number"
                    placeholder="Ilimitado"
                    value={formData.max_copies || ''}
                    onChange={(e) => handleInputChange('max_copies', e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits_per_month">Créditos/Mês</Label>
                  <Input
                    id="credits_per_month"
                    type="number"
                    step="0.01"
                    value={formData.credits_per_month}
                    onChange={(e) => handleInputChange('credits_per_month', parseFloat(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="copy_ai_enabled"
                  checked={formData.copy_ai_enabled}
                  onCheckedChange={(checked) => handleInputChange('copy_ai_enabled', checked)}
                />
                <Label htmlFor="copy_ai_enabled">Copy IA Ativada</Label>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="rollover_enabled"
                    checked={formData.rollover_enabled}
                    onCheckedChange={(checked) => handleInputChange('rollover_enabled', checked)}
                  />
                  <Label htmlFor="rollover_enabled">Rollover de Créditos Ativado</Label>
                </div>

                {formData.rollover_enabled && (
                  <div className="grid gap-4 md:grid-cols-2 pl-6">
                    <div className="space-y-2">
                      <Label htmlFor="rollover_percentage">% de Rollover</Label>
                      <Input
                        id="rollover_percentage"
                        type="number"
                        step="0.01"
                        max="100"
                        value={formData.rollover_percentage}
                        onChange={(e) => handleInputChange('rollover_percentage', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rollover_days">Dias de Validade</Label>
                      <Input
                        id="rollover_days"
                        type="number"
                        value={formData.rollover_days}
                        onChange={(e) => handleInputChange('rollover_days', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Ordem de Exibição</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange('display_order', parseInt(e.target.value))}
                />
              </div>


              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {isEditing ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {plans?.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package size={24} className="text-primary" />
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.slug}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(plan)}
                  >
                    <PencilSimple size={16} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projetos:</span>
                  <span>{plan.max_projects ?? 'Ilimitado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Copies:</span>
                  <span>{plan.max_copies ?? 'Ilimitado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Copy IA:</span>
                  <span>{plan.copy_ai_enabled ? '✅' : '❌'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créditos/Mês:</span>
                  <span>{plan.credits_per_month}</span>
                </div>
              </div>

              {plan.rollover_enabled && (
                <div className="border-t pt-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rollover:</span>
                    <span>{plan.rollover_percentage}% por {plan.rollover_days} dias</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => togglePlanStatus.mutate({ 
                    id: plan.id, 
                    is_active: !plan.is_active 
                  })}
                >
                  {plan.is_active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleManageOffers(plan.id)}
                >
                  <CurrencyDollar size={16} className="mr-1" />
                  Ofertas
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Gerenciamento de Ofertas */}
      {selectedPlanForOffers && (
        <Dialog open={!!selectedPlanForOffers} onOpenChange={() => setSelectedPlanForOffers(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Ofertas - {plans?.find(p => p.id === selectedPlanForOffers)?.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {gateways.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                  <p className="font-semibold text-yellow-800">⚠️ Nenhum gateway de pagamento ativo</p>
                  <p className="text-yellow-700 mt-1">Configure um gateway de pagamento em Configurações → Integrações</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Gateway de Pagamento</Label>
                    <Select value={selectedGateway} onValueChange={setSelectedGateway}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o gateway" />
                      </SelectTrigger>
                      <SelectContent>
                        {gateways.map((gateway) => (
                          <SelectItem key={gateway.id} value={gateway.id}>
                            {gateway.integrations.name} {gateway.is_active ? '(Ativo)' : '(Inativo)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      As ofertas e seus checkouts são específicos por gateway de pagamento
                    </p>
                  </div>

                  {selectedGateway && (
                    <>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          {filteredOffers.length} {filteredOffers.length === 1 ? 'oferta configurada' : 'ofertas configuradas'} para este gateway
                        </p>
                        <Button onClick={handleCreateOffer}>
                          <Plus className="mr-2 h-4 w-4" />
                          Nova Oferta
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {filteredOffers.map((offer) => (
                          <Card key={offer.id} className={!offer.is_active ? 'opacity-60' : ''}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">{offer.name}</h4>
                                    <Badge variant={offer.is_active ? "default" : "secondary"}>
                                      {offer.is_active ? 'Ativa' : 'Inativa'}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Preço:</span>
                                      <span className="ml-2 font-semibold">{formatCurrency(offer.price)}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Período:</span>
                                      <span className="ml-2">{getBillingPeriodLabel(offer.billing_period_value, offer.billing_period_unit)}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">ID Gateway:</span>
                                      <span className="ml-2 font-mono text-xs">{offer.gateway_offer_id}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleOfferStatus({ id: offer.id, is_active: !offer.is_active })}
                                  >
                                    <Switch checked={offer.is_active} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditOffer(offer)}
                                  >
                                    <PencilSimple size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteOffer(offer.id)}
                                  >
                                    <Trash size={16} />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {filteredOffers.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>Nenhuma oferta configurada para este gateway</p>
                            <p className="text-sm mt-1">Clique em "Nova Oferta" para criar</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Criar/Editar Oferta */}
      <PlanOfferModal
        open={isOfferModalOpen}
        onClose={() => {
          setIsOfferModalOpen(false);
          setEditingOffer(null);
        }}
        onSubmit={handleOfferSubmit}
        planId={selectedPlanForOffers || ''}
        activeGatewayId={selectedGateway}
        offer={editingOffer}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!offerToDelete} onOpenChange={() => setOfferToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta oferta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteOffer}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
