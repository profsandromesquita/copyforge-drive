import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface CreditConfig {
  id: string;
  cost_limit_pct: number;
  base_tpc_gemini: number;
}

interface ModelMultiplier {
  id: string;
  model_name: string;
  display_name: string;
  multiplier: number;
  is_baseline: boolean;
}

interface ConfigHistory {
  id: string;
  cost_limit_pct_old: number;
  cost_limit_pct_new: number;
  changed_by: string;
  created_at: string;
}

export const CreditSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState<CreditConfig>({ id: '', cost_limit_pct: 25, base_tpc_gemini: 10000 });
  const [originalConfig, setOriginalConfig] = useState<CreditConfig>({ id: '', cost_limit_pct: 25, base_tpc_gemini: 10000 });
  const [models, setModels] = useState<ModelMultiplier[]>([]);
  const [history, setHistory] = useState<ConfigHistory[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar configuração
      const { data: configData, error: configError } = await supabase
        .from('credit_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (configError) throw configError;
      if (configData) {
        setConfig(configData);
        setOriginalConfig(configData);
      }

      // Buscar modelos
      const { data: modelsData, error: modelsError } = await supabase
        .from('model_multipliers')
        .select('*')
        .order('is_baseline', { ascending: false });

      if (modelsError) throw modelsError;
      setModels(modelsData || []);

      // Buscar histórico
      const { data: historyData, error: historyError } = await supabase
        .from('credit_config_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (historyError) throw historyError;
      setHistory(historyData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const calculateTpcGemini = (costLimit: number) => {
    return config.base_tpc_gemini * (costLimit / 25);
  };

  const calculateTpcModel = (multiplier: number, costLimit: number) => {
    return calculateTpcGemini(costLimit) / multiplier;
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('credit_config')
        .update({
          cost_limit_pct: config.cost_limit_pct,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', originalConfig.id);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
      setOriginalConfig(config);
      fetchData(); // Recarregar para pegar o histórico atualizado
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMultiplier = async (modelId: string, newMultiplier: number) => {
    try {
      const { error } = await supabase
        .from('model_multipliers')
        .update({ multiplier: newMultiplier, updated_at: new Date().toISOString() })
        .eq('id', modelId);

      if (error) throw error;

      toast.success('Multiplicador atualizado!');
      fetchData();
    } catch (error) {
      console.error('Error updating multiplier:', error);
      toast.error('Erro ao atualizar multiplicador');
    }
  };

  const hasChanges = config.cost_limit_pct !== originalConfig.cost_limit_pct;
  const tpcGemini = calculateTpcGemini(config.cost_limit_pct);
  const originalTpcGemini = calculateTpcGemini(originalConfig.cost_limit_pct);
  const tpcChange = ((tpcGemini - originalTpcGemini) / originalTpcGemini) * 100;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configurações de Créditos</h2>
        <p className="text-muted-foreground mt-1">
          Configure como os tokens são convertidos em créditos e gerencie os multiplicadores por modelo
        </p>
      </div>

      {/* Seção de Margem de Lucro */}
      <Card>
        <CardHeader>
          <CardTitle>Margem de Lucro (Limite de Custo)</CardTitle>
          <CardDescription>
            Ajuste o limite de custo para controlar quantos tokens cada crédito compra
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="cost-limit">Limite de Custo (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cost-limit"
                  type="number"
                  min={5}
                  max={100}
                  step={1}
                  value={config.cost_limit_pct}
                  onChange={(e) => setConfig({ ...config, cost_limit_pct: parseFloat(e.target.value) || 0 })}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            <Slider
              value={[config.cost_limit_pct]}
              onValueChange={([value]) => setConfig({ ...config, cost_limit_pct: value })}
              min={5}
              max={100}
              step={1}
              className="w-full"
            />

            <div className="flex items-center gap-2 text-sm">
              {config.cost_limit_pct < 20 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Margem de lucro muito baixa. Isso pode afetar a sustentabilidade do sistema.
                  </AlertDescription>
                </Alert>
              )}
              {config.cost_limit_pct >= 20 && config.cost_limit_pct <= 30 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Margem de lucro moderada. Monitore o uso e ajuste conforme necessário.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <Separator />

          {/* Indicadores em Tempo Real */}
          <div className="space-y-4">
            <h3 className="font-semibold">Indicadores em Tempo Real</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">TPC Gemini Atual</div>
                  <div className="text-2xl font-bold">{tpcGemini.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">tokens por crédito</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">10 Créditos Compram</div>
                  <div className="text-2xl font-bold">{(tpcGemini * 10).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">tokens (Gemini)</div>
                </CardContent>
              </Card>
            </div>

            {hasChanges && (
              <Card className="border-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Impacto da Mudança</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        De {originalTpcGemini.toLocaleString()} → {tpcGemini.toLocaleString()} tokens/crédito
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${tpcChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tpcChange > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      <span className="text-xl font-bold">{tpcChange.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveConfig} disabled={!hasChanges || saving}>
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Multiplicadores por Modelo */}
      <Card>
        <CardHeader>
          <CardTitle>Multiplicadores por Modelo</CardTitle>
          <CardDescription>
            Configure o custo relativo de cada modelo de IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>Família</TableHead>
                <TableHead>Multiplicador</TableHead>
                <TableHead>TPC Atual</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {model.display_name}
                      {model.is_baseline && <Badge variant="secondary">Baseline</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {model.model_name.split('/')[0]}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0.1}
                      max={10}
                      step={0.1}
                      value={model.multiplier}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value);
                        if (!model.is_baseline && newValue > 0) {
                          handleUpdateMultiplier(model.id, newValue);
                        }
                      }}
                      disabled={model.is_baseline}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {calculateTpcModel(model.multiplier, config.cost_limit_pct).toFixed(0)}
                  </TableCell>
                  <TableCell>
                    {!model.is_baseline && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateMultiplier(model.id, 2.0)}
                      >
                        Reset
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Histórico de Mudanças */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Parâmetros</CardTitle>
            <CardDescription>
              Últimas alterações nas configurações de créditos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Limite Anterior</TableHead>
                  <TableHead>Novo Limite</TableHead>
                  <TableHead>Diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{item.cost_limit_pct_old}%</TableCell>
                    <TableCell>{item.cost_limit_pct_new}%</TableCell>
                    <TableCell>
                      <Badge variant={item.cost_limit_pct_new > item.cost_limit_pct_old ? "default" : "destructive"}>
                        {item.cost_limit_pct_new > item.cost_limit_pct_old ? '+' : ''}
                        {(item.cost_limit_pct_new - item.cost_limit_pct_old).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
