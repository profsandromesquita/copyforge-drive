import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Info } from "lucide-react";
import { useModelRouting } from "@/hooks/useModelRouting";
import { useModelMultipliers } from "@/hooks/useModelMultipliers";
import { MODEL_CONFIG } from "@/lib/ai-models";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export const ModelRoutingSettings = () => {
  const { routingConfigs, isLoading, updateRouting, isUpdating } = useModelRouting();
  const { data: multipliersData, isLoading: isLoadingMultipliers } = useModelMultipliers();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Roteamento de Modelos IA
        </h2>
        <p className="text-muted-foreground">
          Configure qual modelo de IA será usado automaticamente para cada tipo de copy
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Essas configurações definem o modelo padrão usado quando o 
          usuário não seleciona manualmente um modelo. Usuários ainda podem escolher manualmente 
          um modelo diferente ao criar a copy.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {routingConfigs?.map((config) => {
          const currentModel = MODEL_CONFIG[config.default_model as keyof typeof MODEL_CONFIG];
          
          return (
            <Card key={config.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{config.copy_type_label}</span>
                  <Badge variant={currentModel?.badgeColor === 'green' ? 'default' : 'secondary'}>
                    {currentModel?.badge || 'Modelo'}
                  </Badge>
                </CardTitle>
                {config.description && (
                  <CardDescription>{config.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Modelo Padrão
                    </label>
                    <Select
                      value={config.default_model}
                      onValueChange={(value) => updateRouting({ 
                        copyType: config.copy_type, 
                        newModel: value 
                      })}
                      disabled={isUpdating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.available_models.map((modelId) => {
                          const modelConfig = MODEL_CONFIG[modelId as keyof typeof MODEL_CONFIG];
                          return (
                            <SelectItem key={modelId} value={modelId}>
                              <div className="flex items-center gap-2">
                                <span>{modelConfig?.displayName || modelId}</span>
                                <Badge 
                                  variant={modelConfig?.badgeColor === 'green' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {modelConfig?.badge}
                                </Badge>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {currentModel && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <p className="font-medium mb-1">Características:</p>
                      <p>{currentModel.description}</p>
                      <p className="mt-1">{currentModel.recommended}</p>
                      <p className="mt-2 text-amber-600 dark:text-amber-400">
                        Custo relativo: {
                          isLoadingMultipliers 
                            ? 'Carregando...' 
                            : `${multipliersData?.multipliers[config.default_model] || currentModel.estimatedCostMultiplier}x`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
