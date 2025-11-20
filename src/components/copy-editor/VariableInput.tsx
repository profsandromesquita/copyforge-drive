import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onVariableSearch?: (search: string, show: boolean) => void;
}

interface VariablePosition {
  variable: string;
  start: number;
  end: number;
  top: number;
  left: number;
  width: number;
}

export const VariableInput = forwardRef<HTMLTextAreaElement, VariableInputProps>(
  ({ value, onChange, onKeyDown, placeholder, disabled, className, onVariableSearch }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [variablePositions, setVariablePositions] = useState<VariablePosition[]>([]);

    // Expor ref do textarea
    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    // Detectar variáveis no texto
    const detectVariables = () => {
      const variableRegex = /#[a-zA-Z_áéíóúàèìòùâêîôûãõç]+/g;
      const matches: VariablePosition[] = [];
      let match;

      while ((match = variableRegex.exec(value)) !== null) {
        matches.push({
          variable: match[0],
          start: match.index,
          end: match.index + match[0].length,
          top: 0,
          left: 0,
          width: 0,
        });
      }

      return matches;
    };

    // Calcular posições das variáveis
    const calculatePositions = () => {
      if (!textareaRef.current) return;

      const variables = detectVariables();
      const textarea = textareaRef.current;
      
      // Criar range helper para calcular posições
      const positions = variables.map((variable) => {
        // Criar um span temporário para medir a posição
        const beforeText = value.substring(0, variable.start);
        const lines = beforeText.split('\n');
        const lineNumber = lines.length - 1;
        const charInLine = lines[lines.length - 1].length;

        // Estimar posição (simplificado)
        const lineHeight = 20; // aproximado
        const charWidth = 8; // aproximado
        
        return {
          ...variable,
          top: lineNumber * lineHeight + 8,
          left: charInLine * charWidth + 12,
          width: variable.variable.length * charWidth,
        };
      });

      setVariablePositions(positions);
    };

    // Atualizar posições quando o valor mudar
    useEffect(() => {
      calculatePositions();
    }, [value]);

    // Remover variável
    const removeVariable = (variable: VariablePosition) => {
      const newValue = value.substring(0, variable.start) + value.substring(variable.end);
      onChange(newValue);
      
      // Focar no textarea
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(variable.start, variable.start);
      }, 0);
    };

    // Handle change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      // Detectar se está digitando após #
      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = newValue.substring(0, cursorPos);
      const lastHashIndex = textBeforeCursor.lastIndexOf('#');
      
      if (lastHashIndex !== -1) {
        const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
        if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n')) {
          onVariableSearch?.(textAfterHash, true);
          return;
        }
      }
      
      onVariableSearch?.('', false);
    };

    // Prevenir edição dentro de variáveis
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (disabled) return;

      const textarea = e.currentTarget;
      const cursorPos = textarea.selectionStart;

      // Verificar se cursor está dentro de uma variável
      const variableAtCursor = variablePositions.find(
        (v) => cursorPos > v.start && cursorPos <= v.end
      );

      if (variableAtCursor) {
        // Se tentar editar dentro da variável, mover cursor ou remover
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          removeVariable(variableAtCursor);
          return;
        }
        
        // Mover cursor para fora da variável
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          textarea.setSelectionRange(variableAtCursor.start, variableAtCursor.start);
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          textarea.setSelectionRange(variableAtCursor.end, variableAtCursor.end);
          return;
        }
      }

      onKeyDown?.(e);
    };

    return (
      <div className="relative">
        {/* Textarea principal */}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'min-h-[100px] resize-none',
            'relative z-10',
            className
          )}
          style={{
            backgroundColor: 'transparent',
          }}
        />

        {/* Overlay com variáveis destacadas */}
        <div
          ref={overlayRef}
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 5 }}
        >
          <div className="relative w-full h-full px-3 py-2">
            {variablePositions.map((variable, index) => (
              <div
                key={`${variable.variable}-${index}`}
                className="absolute pointer-events-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors select-none"
                style={{
                  top: variable.top,
                  left: variable.left,
                  minWidth: variable.width,
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeVariable(variable);
                }}
              >
                <code className="text-xs font-medium leading-none whitespace-nowrap">
                  {variable.variable}
                </code>
                <X className="h-3 w-3 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

VariableInput.displayName = 'VariableInput';
