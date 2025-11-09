import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

const faqItems: FAQItem[] = [
  {
    id: "diff-plans",
    question: "Qual a diferença entre os planos Free, Pro, Business e Enterprise?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>Cada plano oferece diferentes limites e recursos:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Free:</strong> 3 projetos, 10 copies, 100 créditos/mês (sem Copy IA)</li>
          <li><strong>Pro:</strong> 10 projetos, 100 copies, 1.000 créditos/mês, Copy IA habilitada</li>
          <li><strong>Business:</strong> 50 projetos, 500 copies, 5.000 créditos/mês, rollover de 50%</li>
          <li><strong>Enterprise:</strong> Recursos ilimitados, 15.000 créditos/mês, suporte prioritário</li>
        </ul>
        <p className="pt-2">
          <a href="#comparison" className="text-primary underline hover:no-underline">
            Ver comparação completa →
          </a>
        </p>
      </div>
    )
  },
  {
    id: "best-plan",
    question: "Qual plano é ideal para mim?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>Recomendamos baseado no seu perfil:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Free:</strong> Teste ou uso pessoal ocasional</li>
          <li><strong>Pro:</strong> Freelancers, copywriters individuais e pequenas empresas</li>
          <li><strong>Business:</strong> Agências, times de marketing e empresas médias</li>
          <li><strong>Enterprise:</strong> Grandes corporações com alto volume de produção</li>
        </ul>
      </div>
    )
  },
  {
    id: "what-are-credits",
    question: "O que são créditos e como funcionam?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          Créditos são a moeda usada para consumir recursos de IA na plataforma.
          Cada ação de Copy IA (geração, otimização, análise de audiência) consome
          uma quantidade específica de créditos baseada no modelo de IA usado.
        </p>
        <p>
          Seus créditos são renovados automaticamente todo mês no dia de renovação
          do seu plano. Se você tem rollover habilitado, créditos não utilizados
          são transferidos parcialmente para o próximo mês.
        </p>
      </div>
    )
  },
  {
    id: "rollover",
    question: "O que é rollover de créditos?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          Rollover permite que você transfira créditos não utilizados para o próximo mês,
          evitando desperdício. O percentual de rollover varia por plano:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>Free:</strong> Sem rollover</li>
          <li><strong>Pro:</strong> 30% dos créditos não usados (válidos por 30 dias)</li>
          <li><strong>Business:</strong> 50% dos créditos não usados (válidos por 60 dias)</li>
          <li><strong>Enterprise:</strong> 100% dos créditos não usados (válidos por 90 dias)</li>
        </ul>
      </div>
    )
  },
  {
    id: "limit-reached",
    question: "O que acontece se eu atingir o limite de projetos ou copies?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          Quando você atingir o limite do seu plano, não poderá criar novos projetos
          ou copies até que:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Faça upgrade para um plano com limites maiores, ou</li>
          <li>Exclua projetos/copies existentes para liberar espaço</li>
        </ul>
        <p className="pt-2">
          Você receberá um aviso quando estiver próximo do limite (80% de uso)
          e um modal de upgrade será exibido quando o limite for atingido.
        </p>
      </div>
    )
  },
  {
    id: "delete-items",
    question: "Posso excluir projetos/copies para liberar espaço?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          Sim! Ao excluir permanentemente um projeto ou copy, o espaço é liberado
          imediatamente e você pode criar novos itens.
        </p>
        <p className="text-amber-600 dark:text-amber-500">
          <strong>Atenção:</strong> A exclusão é permanente e não pode ser desfeita.
          Certifique-se de fazer backup se necessário antes de excluir.
        </p>
      </div>
    )
  },
  {
    id: "limits-per-workspace",
    question: "Os limites são por workspace ou por usuário?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          Todos os limites (projetos, copies, créditos) são <strong>por workspace</strong>,
          não por usuário. Isso significa que todos os membros do workspace compartilham
          os mesmos limites.
        </p>
        <p>
          Por exemplo: se seu plano Pro permite 10 projetos, todos os membros do workspace
          juntos podem criar até 10 projetos no total.
        </p>
      </div>
    )
  },
  {
    id: "copy-ai",
    question: "O que é Copy IA e como funciona?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          Copy IA é nossa ferramenta de inteligência artificial para criar, otimizar e
          analisar copies de marketing. Com ela você pode:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Gerar copies do zero baseadas em prompts e contexto de marca</li>
          <li>Otimizar copies existentes para melhorar conversão e clareza</li>
          <li>Analisar segmentos de audiência e criar personas detalhadas</li>
          <li>Gerar múltiplas variações para testes A/B</li>
        </ul>
        <p className="pt-2">
          <strong>Nota:</strong> Copy IA está disponível apenas nos planos Pro, Business e Enterprise.
        </p>
      </div>
    )
  },
  {
    id: "payment-methods",
    question: "Quais formas de pagamento são aceitas?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>Aceitamos as seguintes formas de pagamento:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Cartão de crédito (Visa, Mastercard, American Express)</li>
          <li>PIX (pagamento instantâneo)</li>
          <li>Boleto bancário (aprovação em até 3 dias úteis)</li>
        </ul>
        <p className="pt-2">
          Para o plano Enterprise, oferecemos também faturamento personalizado
          e pagamento via transferência bancária.
        </p>
      </div>
    )
  },
  {
    id: "upgrade-downgrade",
    question: "Como faço upgrade ou downgrade do meu plano?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          Você pode alterar seu plano a qualquer momento através da página de Planos
          ou nas Configurações do Workspace.
        </p>
        <p><strong>Upgrade:</strong> Ao fazer upgrade, a cobrança é proporcional (pro-rata)
        e você tem acesso imediato aos novos recursos e limites.</p>
        <p><strong>Downgrade:</strong> Ao fazer downgrade, a mudança entra em vigor
        no próximo ciclo de cobrança para evitar perda de acesso.</p>
      </div>
    )
  },
  {
    id: "immediate-charge",
    question: "A cobrança é feita imediatamente ao fazer upgrade?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          Sim, ao fazer upgrade você é cobrado imediatamente de forma <strong>proporcional</strong>
          (pro-rata). Calculamos o valor considerando:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Dias restantes no seu ciclo atual</li>
          <li>Diferença de preço entre os planos</li>
          <li>Crédito de valores já pagos</li>
        </ul>
        <p className="pt-2">
          Você recebe acesso imediato aos novos recursos e limites após a confirmação do pagamento.
        </p>
      </div>
    )
  },
  {
    id: "cancel-anytime",
    question: "Posso cancelar a qualquer momento?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          <strong>Sim, sem multa ou burocracia.</strong> Você pode cancelar sua assinatura
          a qualquer momento através das Configurações do Workspace.
        </p>
        <p>
          Ao cancelar, você mantém acesso a todos os recursos até o final do período
          já pago. Após isso, seu workspace será convertido automaticamente para o plano Free.
        </p>
        <p className="pt-2 text-amber-600 dark:text-amber-500">
          Lembre-se: no plano Free, você terá limites reduzidos. Certifique-se de que
          seus projetos e copies estejam dentro dos limites do Free antes do cancelamento.
        </p>
      </div>
    )
  },
  {
    id: "data-after-cancel",
    question: "O que acontece com meus dados se eu cancelar?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          Seus dados (projetos, copies, configurações) permanecem salvos por
          <strong> 30 dias</strong> após o cancelamento, caso você decida reativar.
        </p>
        <p>
          Se você se adaptar aos limites do plano Free, seus dados permanecerão
          disponíveis indefinidamente. Se exceder os limites, você terá 30 dias
          para fazer upgrade ou remover itens excedentes.
        </p>
        <p className="pt-2 text-red-600 dark:text-red-500">
          <strong>Importante:</strong> Após 30 dias de inatividade com limites excedidos,
          os dados excedentes são excluídos permanentemente.
        </p>
      </div>
    )
  },
  {
    id: "annual-discount",
    question: "Há desconto para pagamento anual?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          <strong>Sim!</strong> Pagando anualmente você economiza entre <strong>15% e 20%</strong>
          em relação ao pagamento mensal, dependendo do plano.
        </p>
        <p>
          Use o toggle "Mensal/Anual" no topo da página para ver os preços
          e o valor exato de economia para cada plano.
        </p>
        <p className="pt-2 text-emerald-600 dark:text-emerald-500">
          💡 <strong>Dica:</strong> Planos anuais também recebem prioridade no suporte!
        </p>
      </div>
    )
  },
  {
    id: "enterprise-contract",
    question: "Preciso de contrato para o plano Enterprise?",
    answer: (
      <div className="space-y-2 text-muted-foreground">
        <p>
          Sim, o plano Enterprise requer um contrato customizado com nossa equipe comercial.
          Isso permite que personalizemos:
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Limites e recursos específicos para sua necessidade</li>
          <li>SLA (Service Level Agreement) garantido</li>
          <li>Condições de pagamento flexíveis</li>
          <li>Integrações e desenvolvimentos customizados</li>
          <li>Treinamento e onboarding dedicado</li>
        </ul>
        <p className="pt-2">
          Entre em contato com nosso time comercial para discutir sua necessidade:
          <a href="mailto:vendas@copydrive.com.br" className="text-primary underline ml-1">
            vendas@copydrive.com.br
          </a>
        </p>
      </div>
    )
  }
];

export const FAQSection = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">Perguntas Frequentes</h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre planos, créditos e funcionalidades
          </p>
        </div>

        {/* Accordion com perguntas */}
        <Accordion type="single" collapsible className="space-y-2">
          {faqItems.map((item) => (
            <AccordionItem 
              key={item.id} 
              value={item.id}
              className="border rounded-lg px-6 bg-card"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold">{item.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* CTA de suporte */}
        <div className="mt-12 text-center p-8 rounded-lg bg-muted/50 border">
          <h3 className="text-xl font-semibold mb-2">Ainda tem dúvidas?</h3>
          <p className="text-muted-foreground mb-6">
            Nossa equipe está pronta para ajudar você
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" asChild>
              <a href="mailto:suporte@copydrive.com.br">
                Falar com Suporte
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
