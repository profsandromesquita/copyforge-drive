import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CurrencyDollar, ArrowClockwise } from "phosphor-react";

interface ExchangeRate {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
}

interface AIModel {
  name: string;
  id: string;
  inputCostUSD: number;
  outputCostUSD: number;
  category: string;
}

const AI_MODELS: AIModel[] = [
  {
    name: "Gemini 2.5 Flash",
    id: "google/gemini-2.5-flash",
    inputCostUSD: 0.075,
    outputCostUSD: 0.30,
    category: "text"
  },
  {
    name: "GPT-5",
    id: "openai/gpt-5",
    inputCostUSD: 2.50,
    outputCostUSD: 10.00,
    category: "text"
  },
  {
    name: "Claude Sonnet 4.5",
    id: "anthropic/claude-sonnet-4.5",
    inputCostUSD: 3.00,
    outputCostUSD: 15.00,
    category: "text"
  },
  {
    name: "Gemini Nano Banana (Imagem)",
    id: "google/gemini-2.5-flash-image-preview",
    inputCostUSD: 0.075,
    outputCostUSD: 0.30,
    category: "image"
  }
];

export const AISettings = () => {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchExchangeRate = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL");
      const data = await response.json();
      const usdBrl = data.USDBRL as ExchangeRate;
      
      setExchangeRate(parseFloat(usdBrl.bid));
      setLastUpdate(new Date(usdBrl.create_date).toLocaleString("pt-BR"));
      toast.success("Cotação atualizada!");
    } catch (error) {
      console.error("Erro ao buscar cotação:", error);
      toast.error("Erro ao buscar cotação do dólar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  const formatCurrency = (value: number, currency: "USD" | "BRL") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  };

  const convertToBRL = (usdValue: number): number => {
    if (!exchangeRate) return 0;
    return usdValue * exchangeRate;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configurações de IA</h2>
        <p className="text-muted-foreground">
          Informações sobre modelos de IA e custos
        </p>
      </div>

      {/* Exchange Rate Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CurrencyDollar size={24} className="text-primary" />
                Cotação do Dólar
              </CardTitle>
              <CardDescription>
                Taxa de câmbio USD/BRL em tempo real
              </CardDescription>
            </div>
            <button
              onClick={fetchExchangeRate}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              <ArrowClockwise
                size={20}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !exchangeRate ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Carregando cotação...</p>
            </div>
          ) : exchangeRate ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  {formatCurrency(exchangeRate, "BRL")}
                </span>
                <span className="text-muted-foreground">= USD 1,00</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Última atualização: {lastUpdate}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-destructive">Erro ao carregar cotação</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Models Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Modelos de IA e Custos</CardTitle>
          <CardDescription>
            Preços por 1 milhão de tokens (Input/Output)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {AI_MODELS.map((model, index) => (
              <div key={model.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{model.name}</h3>
                      <p className="text-sm text-muted-foreground">{model.id}</p>
                    </div>
                    <Badge variant={model.category === "image" ? "secondary" : "default"}>
                      {model.category === "image" ? "Imagem" : "Texto"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Input Cost */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Input (1M tokens)
                      </p>
                      <div className="space-y-0.5">
                        <p className="text-lg font-semibold">
                          {formatCurrency(model.inputCostUSD, "USD")}
                        </p>
                        {exchangeRate && (
                          <p className="text-sm text-primary">
                            {formatCurrency(convertToBRL(model.inputCostUSD), "BRL")}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Output Cost */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Output (1M tokens)
                      </p>
                      <div className="space-y-0.5">
                        <p className="text-lg font-semibold">
                          {formatCurrency(model.outputCostUSD, "USD")}
                        </p>
                        {exchangeRate && (
                          <p className="text-sm text-primary">
                            {formatCurrency(convertToBRL(model.outputCostUSD), "BRL")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {!exchangeRate && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Atualize a cotação do dólar para ver os valores em BRL
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
