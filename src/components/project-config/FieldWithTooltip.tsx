import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'phosphor-react';
import { UseFormRegister, FieldError } from 'react-hook-form';

interface FieldWithTooltipProps {
  label: string;
  name: string;
  placeholder?: string;
  tooltip: string;
  type: 'input' | 'textarea';
  register: UseFormRegister<any>;
  error?: FieldError;
}

export const FieldWithTooltip = ({
  label,
  name,
  placeholder,
  tooltip,
  type,
  register,
  error,
}: FieldWithTooltipProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info size={16} className="text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {type === 'input' ? (
        <Input
          id={name}
          placeholder={placeholder}
          {...register(name)}
          className={error ? 'border-destructive' : ''}
        />
      ) : (
        <Textarea
          id={name}
          placeholder={placeholder}
          {...register(name)}
          className={error ? 'border-destructive' : ''}
          rows={3}
        />
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  );
};
