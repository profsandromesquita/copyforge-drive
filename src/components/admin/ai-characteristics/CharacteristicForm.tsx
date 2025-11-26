import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AICharacteristic } from "@/hooks/useAICharacteristics";

const formSchema = z.object({
  label: z.string().min(1, "Label é obrigatório"),
  description: z.string().optional(),
  ai_instruction: z.string().optional(),
  is_active: z.boolean().default(true),
});

interface CharacteristicFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  characteristic: AICharacteristic | null;
  category: string;
}

export const CharacteristicForm = ({
  open,
  onClose,
  onSave,
  characteristic,
  category,
}: CharacteristicFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: characteristic
      ? {
          label: characteristic.label,
          description: characteristic.description || "",
          ai_instruction: characteristic.ai_instruction || "",
          is_active: characteristic.is_active,
        }
      : {
          label: "",
          description: "",
          ai_instruction: "",
          is_active: true,
        },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (characteristic) {
      // Atualizar existente
      onSave({
        id: characteristic.id,
        ...values,
      });
    } else {
      // Criar novo
      onSave({
        category,
        value: values.label.toLowerCase().replace(/\s+/g, '_'),
        ...values,
      });
    }
    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {characteristic ? "Editar Característica" : "Nova Característica"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Venda" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome que aparecerá para os usuários
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!characteristic && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                <strong>Valor técnico:</strong> {form.watch("label") ? form.watch("label").toLowerCase().replace(/\s+/g, '_') : '(será gerado automaticamente)'}
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (UI)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Breve descrição para exibir na interface"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Texto curto exibido no painel (max. 1-2 linhas)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ai_instruction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instruções para IA (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Instruções detalhadas sobre como a IA deve usar esta característica no prompt"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Texto detalhado usado internamente pela IA para gerar copies. Deixe vazio para usar descrição padrão.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Ativo</FormLabel>
                    <FormDescription>
                      Característica visível para usuários
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {characteristic ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
