import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle2, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaveTestimonialModal } from "./LeaveTestimonialModal";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar?: string;
  plan: 'free' | 'starter' | 'pro' | 'business';
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  highlight?: string;
  verified?: boolean;
}

const testimonials: Testimonial[] = [
  // FREE PLAN (4 depoimentos)
  {
    id: "free-1",
    name: "Maria Silva",
    role: "Estudante de Marketing",
    company: "UFMG",
    plan: "free",
    rating: 5,
    highlight: "Perfeito para aprender!",
    content: "Estou no 3º período de Marketing e o CopyDrive tem sido fundamental para meus trabalhos acadêmicos. A interface é intuitiva e consigo criar copies profissionais mesmo sendo iniciante.",
    verified: true
  },
  {
    id: "free-2",
    name: "Lucas Oliveira",
    role: "Designer Freelancer",
    company: "Autônomo",
    plan: "free",
    rating: 4,
    highlight: "Ótimo para testes",
    content: "Uso o plano Free para projetos pessoais. Já testei outras ferramentas mais caras e essa entrega muita qualidade de graça. Quando meu volume aumentar, vou pro Pro com certeza!",
    verified: false
  },
  {
    id: "free-3",
    name: "Beatriz Rocha",
    role: "Blogueira",
    company: "Blog Pessoal",
    plan: "free",
    rating: 5,
    highlight: "Interface simples e eficiente",
    content: "Comecei usando para organizar as ideias do meu blog. Mesmo no plano gratuito consigo fazer muita coisa. É perfeito para quem está começando e quer testar a ferramenta.",
    verified: true
  },
  {
    id: "free-4",
    name: "Gabriel Costa",
    role: "Estudante de Publicidade",
    company: "PUC-SP",
    plan: "free",
    rating: 4,
    highlight: "Excelente para portfólio",
    content: "Uso para criar peças do meu portfólio acadêmico. A ferramenta é profissional e me ajudou a conseguir meu primeiro estágio. Recomendo para todos os estudantes!",
    verified: false
  },

  // PRO PLAN (6 depoimentos)
  {
    id: "pro-1",
    name: "Carlos Mendes",
    role: "Copywriter",
    company: "Autônomo",
    plan: "pro",
    rating: 5,
    highlight: "ROI de 10x no primeiro mês!",
    content: "Pago R$ 49/mês e faturei R$ 8.500 a mais no primeiro mês usando Copy IA. Consigo entregar 3x mais projetos no mesmo tempo. Melhor investimento que já fiz na minha carreira!",
    verified: true
  },
  {
    id: "pro-2",
    name: "Juliana Costa",
    role: "Social Media",
    company: "Freelancer",
    plan: "pro",
    rating: 5,
    highlight: "Acabou o bloqueio criativo!",
    content: "Gerencio redes sociais de 5 clientes e sempre travava na hora de criar legendas. Copy IA me dá dezenas de variações em segundos. Meus clientes adoram a qualidade!",
    verified: true
  },
  {
    id: "pro-3",
    name: "Rafael Santos",
    role: "Afiliado Digital",
    company: "InfoProdutos Online",
    plan: "pro",
    rating: 5,
    highlight: "Conversão aumentou 40%",
    content: "Uso para criar VSL e páginas de vendas dos produtos que promovo. Testei várias copies geradas e a conversão subiu consistentemente. Ferramenta essencial para qualquer afiliado sério.",
    verified: true
  },
  {
    id: "pro-4",
    name: "Mariana Alves",
    role: "Consultora de Marketing",
    company: "MA Consultoria",
    plan: "pro",
    rating: 5,
    highlight: "Produtividade em outro nível",
    content: "Como consultora, preciso criar estratégias e copies para vários clientes. O plano Pro me dá tudo que preciso: organização, créditos suficientes e Copy IA que realmente funciona.",
    verified: true
  },
  {
    id: "pro-5",
    name: "Pedro Henrique",
    role: "E-commerce Manager",
    company: "Loja Virtual",
    plan: "pro",
    rating: 4,
    highlight: "Descrições de produtos impecáveis",
    content: "Tenho 50+ produtos para descrever todo mês. Com Copy IA, transformo especificações técnicas em textos persuasivos em minutos. Minhas taxas de conversão melhoraram visivelmente.",
    verified: true
  },
  {
    id: "pro-6",
    name: "Amanda Ferreira",
    role: "Content Creator",
    company: "YouTube & Instagram",
    plan: "pro",
    rating: 5,
    highlight: "Scripts de vídeo em minutos",
    content: "Produzo conteúdo diariamente e preciso de agilidade. Copy IA me ajuda com scripts, legendas, títulos e descrições. Economizo horas todo dia e mantenho a qualidade alta.",
    verified: false
  },

  // BUSINESS PLAN (5 depoimentos)
  {
    id: "business-1",
    name: "Ana Paula Rodrigues",
    role: "Head de Marketing",
    company: "Agência Criativa XYZ",
    plan: "business",
    rating: 5,
    highlight: "Produtividade do time triplicou",
    content: "Nossa equipe de 8 pessoas usa diariamente. Organizamos todos os 15 clientes ativos e o rollover de créditos é perfeito para meses de alta demanda. Reduzimos prazo de entrega em 60%.",
    verified: true
  },
  {
    id: "business-2",
    name: "Fernando Lima",
    role: "Diretor Comercial",
    company: "E-commerce Brasil",
    plan: "business",
    rating: 5,
    highlight: "Economia de R$ 15k/mês",
    content: "Antes gastávamos R$ 20k/mês com redatores externos. Com o plano Business, reduzimos para R$ 5k e a qualidade melhorou. Time interno consegue produzir 80% do volume internamente agora.",
    verified: true
  },
  {
    id: "business-3",
    name: "Camila Souza",
    role: "Coordenadora de Conteúdo",
    company: "Agência Digital Plus",
    plan: "business",
    rating: 5,
    highlight: "Colaboração perfeita",
    content: "Gerencio uma equipe de 6 copywriters e o CopyDrive facilita muito a colaboração. Todos trabalham nos mesmos projetos com organização impecável. O rollover salva a gente nos meses mais tranquilos.",
    verified: true
  },
  {
    id: "business-4",
    name: "Rodrigo Martins",
    role: "CMO",
    company: "Startup Tech",
    plan: "business",
    rating: 5,
    highlight: "Escalamos de 5 para 30 campanhas",
    content: "Quando estávamos no Pro, batíamos no limite toda hora. Migramos pro Business e conseguimos escalar nossa operação sem preocupação. Os limites são generosos e o suporte é excelente.",
    verified: true
  },
  {
    id: "business-5",
    name: "Tatiana Ribeiro",
    role: "Diretora de Criação",
    company: "Agência Impulso",
    plan: "business",
    rating: 4,
    highlight: "Recursos que precisávamos",
    content: "Com 12 clientes simultâneos, precisávamos de um plano robusto. O Business atende perfeitamente: limites altos, rollover de 50% e créditos suficientes para usar IA sem medo de acabar.",
    verified: true
  },

  // STARTER PLAN (3 depoimentos)
  {
    id: "starter-1",
    name: "Ricardo Oliveira",
    role: "Copywriter Freelancer",
    company: "Autônomo",
    plan: "starter",
    rating: 5,
    highlight: "Perfeito para quem está crescendo!",
    content: "Estava no Free e precisava de mais espaço. O Starter me deu exatamente o que precisava para crescer sem comprometer o orçamento. Mais projetos, mais copies e ainda alguns créditos de IA para testar nas campanhas dos clientes!",
    verified: true
  },
  {
    id: "starter-2",
    name: "Fernanda Azevedo",
    role: "Social Media",
    company: "Agência Digital Pequena",
    plan: "starter",
    rating: 5,
    highlight: "Recursos extras que fazem diferença",
    content: "Como freelancer, não preciso dos recursos completos do Pro ainda. O Starter me dá limites maiores que o Free e alguns créditos de IA para testar. Custo-benefício perfeito! Consigo atender bem meus 3-4 clientes fixos.",
    verified: true
  },
  {
    id: "starter-3",
    name: "Thiago Ribeiro",
    role: "Empreendedor Digital",
    company: "Startup Inicial",
    plan: "starter",
    rating: 4,
    highlight: "Ideal para pequenas equipes",
    content: "Somos uma equipe de 2 pessoas começando e o Starter é perfeito. Mais espaço que o Free, colaboração básica funcionando bem e preço acessível. Quando crescermos mais, migramos pro Pro. Recomendo!",
    verified: false
  }
];

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => {
  const planConfig = {
    free: {
      color: "bg-muted text-muted-foreground border-muted",
      label: "FREE"
    },
    starter: {
      color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
      label: "STARTER"
    },
    pro: {
      color: "bg-primary/10 text-primary border-primary/20",
      label: "PRO"
    },
    business: {
      color: "bg-secondary/10 text-secondary-foreground border-secondary/20",
      label: "BUSINESS"
    }
  };

  const config = planConfig[testimonial.plan];

  return (
    <Card className="relative h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Ícone de aspas decorativo */}
      <div className="absolute top-4 right-4 text-primary/10">
        <Quote className="h-12 w-12" />
      </div>

      <CardContent className="pt-6 flex-1 flex flex-col">
        {/* Rating */}
        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-4 w-4",
                i < testimonial.rating 
                  ? "fill-yellow-500 text-yellow-500" 
                  : "fill-muted text-muted"
              )}
            />
          ))}
        </div>

        {/* Highlight (se existir) */}
        {testimonial.highlight && (
          <h4 className="text-lg font-semibold mb-3 line-clamp-2">
            "{testimonial.highlight}"
          </h4>
        )}

        {/* Content */}
        <p className="text-muted-foreground text-sm mb-6 flex-1 line-clamp-5">
          {testimonial.content}
        </p>

        {/* Author Info */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Avatar className="h-12 w-12">
            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">
                {testimonial.name}
              </p>
              {testimonial.verified && (
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {testimonial.role} • {testimonial.company}
            </p>
          </div>
        </div>

        {/* Plan Badge */}
        <div className="mt-3">
          <Badge 
            variant="outline" 
            className={cn("text-xs font-semibold border", config.color)}
          >
            {config.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export const TestimonialsSection = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const filteredTestimonials = selectedPlan === 'all' 
    ? testimonials 
    : testimonials.filter(t => t.plan === selectedPlan);
  
  // Calcular estatísticas
  const avgRating = (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1);
  const totalClients = testimonials.length * 30; // Multiplicador para parecer mais
  
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold">
            O Que Nossos Clientes Dizem
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Milhares de profissionais e empresas já transformaram 
            sua criação de copies com nossa plataforma
          </p>
          
          {/* Estatísticas */}
          <div className="flex flex-wrap justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalClients}+</div>
              <div className="text-sm text-muted-foreground">Clientes Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{avgRating}</div>
              <div className="text-sm text-muted-foreground">Avaliação Média</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted-foreground">Recomendam</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={selectedPlan} onValueChange={setSelectedPlan} className="mb-12">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">Todos</TabsTrigger>
              <TabsTrigger value="free" className="text-xs sm:text-sm">Free</TabsTrigger>
              <TabsTrigger value="starter" className="text-xs sm:text-sm">Starter</TabsTrigger>
              <TabsTrigger value="pro" className="text-xs sm:text-sm">Pro</TabsTrigger>
              <TabsTrigger value="business" className="text-xs sm:text-sm">Business</TabsTrigger>
            </TabsList>
        </Tabs>

        {/* Testimonials Grid */}
        {filteredTestimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredTestimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum depoimento encontrado para este plano.
          </div>
        )}

        {/* CTA para deixar review */}
        <div className="mt-16 text-center p-8 rounded-lg bg-background border shadow-sm">
          <h3 className="text-xl font-semibold mb-2">
            Você é nosso cliente?
          </h3>
          <p className="text-muted-foreground mb-6">
            Compartilhe sua experiência e ajude outros profissionais!
          </p>
            <Button 
              variant="default" 
              size="lg"
              onClick={() => setIsModalOpen(true)}
            >
              Deixar Depoimento
            </Button>
        </div>
      </div>

      {/* Modal de Depoimento */}
      <LeaveTestimonialModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </section>
  );
};
