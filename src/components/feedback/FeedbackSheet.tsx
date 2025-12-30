import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFeedback, FeedbackCategory } from '@/hooks/useFeedback';
import { Loader2, Bug, Lightbulb, HelpCircle, MessageSquare } from 'lucide-react';

interface FeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryOptions: { value: FeedbackCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'bug', label: 'Reportar Bug', icon: <Bug className="h-4 w-4" /> },
  { value: 'suggestion', label: 'Sugestão', icon: <Lightbulb className="h-4 w-4" /> },
  { value: 'question', label: 'Dúvida', icon: <HelpCircle className="h-4 w-4" /> },
  { value: 'other', label: 'Outro', icon: <MessageSquare className="h-4 w-4" /> },
];

export function FeedbackSheet({ open, onOpenChange }: FeedbackSheetProps) {
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [description, setDescription] = useState('');
  const { submitFeedback, isLoading } = useFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await submitFeedback(category, description);
    
    if (success) {
      setCategory('bug');
      setDescription('');
      onOpenChange(false);
    }
  };

  const isValid = description.trim().length >= 10;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Enviar Feedback</SheetTitle>
          <SheetDescription>
            Ajude-nos a melhorar o CopyDrive. Seu feedback é muito importante!
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category">Tipo de Feedback</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as FeedbackCategory)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder={
                category === 'bug'
                  ? 'Descreva o problema encontrado, incluindo os passos para reproduzi-lo...'
                  : category === 'suggestion'
                  ? 'Compartilhe sua ideia para melhorar o CopyDrive...'
                  : category === 'question'
                  ? 'Qual é a sua dúvida?'
                  : 'O que você gostaria de nos dizer?'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {description.length < 10
                ? `Mínimo de 10 caracteres (${description.length}/10)`
                : `${description.length} caracteres`}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!isValid || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Feedback'
              )}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          Informações técnicas (URL, navegador) são coletadas automaticamente para ajudar na análise.
        </p>
      </SheetContent>
    </Sheet>
  );
}
