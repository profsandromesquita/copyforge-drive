import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { StarRatingInput } from "./StarRatingInput";
import { Loader2 } from "lucide-react";

const testimonialSchema = z.object({
  name: z.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome muito longo (máximo 100 caracteres)"),
  
  role: z.string()
    .min(3, "Cargo deve ter pelo menos 3 caracteres")
    .max(100, "Cargo muito longo (máximo 100 caracteres)"),
  
  company: z.string()
    .min(2, "Nome da empresa deve ter pelo menos 2 caracteres")
    .max(100, "Nome da empresa muito longo (máximo 100 caracteres)"),
  
  plan: z.enum(['free', 'starter', 'pro', 'business'], {
    errorMap: () => ({ message: "Selecione um plano válido" })
  }),
  
  rating: z.number()
    .min(1, "Selecione pelo menos 1 estrela")
    .max(5, "Máximo de 5 estrelas"),
  
  highlight: z.string()
    .min(10, "Frase de destaque deve ter pelo menos 10 caracteres")
    .max(100, "Frase de destaque muito longa (máximo 100 caracteres)")
    .optional()
    .or(z.literal('')),
  
  content: z.string()
    .min(50, "Depoimento deve ter pelo menos 50 caracteres")
    .max(500, "Depoimento muito longo (máximo 500 caracteres)")
});

type TestimonialFormData = z.infer<typeof testimonialSchema>;

interface LeaveTestimonialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LeaveTestimonialModal = ({ open, onOpenChange }: LeaveTestimonialModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      rating: 0,
      highlight: '',
      content: ''
    }
  });
  
  const highlightValue = watch('highlight') || '';
  const contentValue = watch('content') || '';
  const ratingValue = watch('rating');
  
  const onSubmit = async (data: TestimonialFormData) => {
    setIsSubmitting(true);
    
    try {
      // TODO: Integrar com Supabase futuramente
      console.log("Depoimento enviado:", data);
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Sucesso
      toast.success("Depoimento enviado com sucesso!", {
        description: "Obrigado! Seu depoimento será analisado e publicado em breve."
      });
      
      // Reset e fechar
      reset();
      onOpenChange(false);
      
    } catch (error) {
      toast.error("Erro ao enviar depoimento", {
        description: "Tente novamente mais tarde."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Deixe seu Depoimento</DialogTitle>
          <DialogDescription>
            Compartilhe sua experiência com o CopyDrive e ajude outros profissionais
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Nome Completo */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome Completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Seu nome completo"
              {...register('name')}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          
          {/* Cargo/Função */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Cargo/Função <span className="text-destructive">*</span>
            </Label>
            <Input
              id="role"
              placeholder="Ex: Copywriter, Social Media, CEO"
              {...register('role')}
              className={errors.role ? "border-destructive" : ""}
            />
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>
          
          {/* Empresa */}
          <div className="space-y-2">
            <Label htmlFor="company">
              Empresa <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company"
              placeholder="Nome da sua empresa ou 'Autônomo'"
              {...register('company')}
              className={errors.company ? "border-destructive" : ""}
            />
            {errors.company && (
              <p className="text-sm text-destructive">{errors.company.message}</p>
            )}
          </div>
          
          {/* Plano Atual */}
          <div className="space-y-2">
            <Label htmlFor="plan">
              Seu Plano Atual <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(value) => setValue('plan', value as any)}
            >
              <SelectTrigger className={errors.plan ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione seu plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
            {errors.plan && (
              <p className="text-sm text-destructive">{errors.plan.message}</p>
            )}
          </div>
          
          {/* Avaliação (Rating) */}
          <div className="space-y-2">
            <Label>
              Sua Avaliação <span className="text-destructive">*</span>
            </Label>
            <StarRatingInput
              value={ratingValue}
              onChange={(rating) => setValue('rating', rating)}
              error={errors.rating?.message}
            />
          </div>
          
          {/* Frase de Destaque */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="highlight">
                Frase de Destaque <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                {highlightValue.length}/100
              </span>
            </div>
            <Input
              id="highlight"
              placeholder='Ex: "Triplicou minha produtividade!"'
              {...register('highlight')}
              maxLength={100}
              className={errors.highlight ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Uma frase curta que resume sua experiência
            </p>
            {errors.highlight && (
              <p className="text-sm text-destructive">{errors.highlight.message}</p>
            )}
          </div>
          
          {/* Depoimento Completo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">
                Seu Depoimento <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                {contentValue.length}/500
              </span>
            </div>
            <Textarea
              id="content"
              placeholder="Conte como o CopyDrive ajudou você ou sua empresa. Seja específico sobre resultados, funcionalidades favoritas, impacto no seu trabalho..."
              {...register('content')}
              maxLength={500}
              rows={6}
              className={errors.content ? "border-destructive" : ""}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
          </div>
          
          {/* Aviso */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              ℹ️ Seu depoimento será analisado pela nossa equipe antes de ser publicado. 
              Geralmente aprovamos em até 2 dias úteis.
            </p>
          </div>
          
          {/* Botões */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Depoimento'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
