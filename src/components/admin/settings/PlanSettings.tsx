import { useState } from "react";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, PencilSimple, Package } from "phosphor-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface PlanFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  monthly_price: number;
  annual_price: number;
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
  monthly_price: 0,
  annual_price: 0,
  max_projects: null,
  max_copies: null,
  copy_ai_enabled: false,
  credits_per_month: 0,
  rollover_enabled: false,
  rollover_percentage: 0,
  rollover_days: 0,
  display_order: 0
};

export const PlanSettings = () => {
  const { plans, isLoading, createPlan, updatePlan, togglePlanStatus } = useSubscriptionPlans();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);

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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monthly_price">Preço Mensal (R$)</Label>
                  <Input
                    id="monthly_price"
                    type="number"
                    step="0.01"
                    value={formData.monthly_price}
                    onChange={(e) => handleInputChange('monthly_price', parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annual_price">Preço Anual (R$)</Label>
                  <Input
                    id="annual_price"
                    type="number"
                    step="0.01"
                    value={formData.annual_price}
                    onChange={(e) => handleInputChange('annual_price', parseFloat(e.target.value))}
                    required
                  />
                </div>
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
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Mensal:</span>
                  <span className="ml-2 font-semibold">
                    {formatCurrency(plan.monthly_price)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Anual:</span>
                  <span className="ml-2 font-semibold">
                    {formatCurrency(plan.annual_price)}
                  </span>
                </div>
              </div>

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

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => togglePlanStatus.mutate({ 
                  id: plan.id, 
                  is_active: !plan.is_active 
                })}
              >
                {plan.is_active ? 'Desativar' : 'Ativar'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
