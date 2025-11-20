import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onVariableSearch?: (search: string, show: boolean) => void;
}

interface VariablePart {
  type: 'text' | 'variable';
  content: string;
  start: number;
  end: number;
}

export const VariableInput = forwardRef<HTMLTextAreaElement, VariableInputProps>(
  ({ value, onChange, onKeyDown, placeholder, disabled, className, onVariableSearch }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);

    // Expor métodos do textarea para o componente pai
    useImperativeHandle(ref, () => ({
      focus: () => {
        containerRef.current?.focus();
      },
      selectionStart: cursorPosition,
      selectionEnd: cursorPosition,
    } as any));

    // Parse o texto em partes (texto normal e variáveis)
    const parseContent = (text: string): VariablePart[] => {
      const parts: VariablePart[] = [];
      const variableRegex = /#[a-zA-Z_áéíóúàèìòùâêîôûãõç]+/g;
      let lastIndex = 0;
      let match;

      while ((match = variableRegex.exec(text)) !== null) {
        // Adicionar texto antes da variável
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            content: text.substring(lastIndex, match.index),
            start: lastIndex,
            end: match.index,
          });
        }

        // Adicionar variável
        parts.push({
          type: 'variable',
          content: match[0],
          start: match.index,
          end: match.index + match[0].length,
        });

        lastIndex = match.index + match[0].length;
      }

      // Adicionar texto restante
      if (lastIndex < text.length) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex),
          start: lastIndex,
          end: text.length,
        });
      }

      return parts;
    };

    const parts = parseContent(value);

    // Remover variável ao clicar
    const removeVariable = (variablePart: VariablePart) => {
      const newValue = value.substring(0, variablePart.start) + value.substring(variablePart.end);
      onChange(newValue);
      
      // Focar no container após remover
      setTimeout(() => {
        containerRef.current?.focus();
        setCursorPosition(variablePart.start);
      }, 0);
    };

    // Handle click para posicionar cursor
    const handleClick = (e: React.MouseEvent) => {
      if (disabled) return;
      
      const target = e.target as HTMLElement;
      
      // Se clicou em uma variável, não fazer nada (a variável já tem seu próprio handler)
      if (target.closest('.variable-chip')) {
        return;
      }

      // Focar no container
      containerRef.current?.focus();
    };

    // Handle keyboard input
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      // Passar evento para o componente pai
      onKeyDown?.(e);

      // Prevenir edição de variáveis com Backspace/Delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const partAtCursor = parts.find(
          (p) => cursorPosition >= p.start && cursorPosition <= p.end
        );

        if (partAtCursor?.type === 'variable') {
          e.preventDefault();
          removeVariable(partAtCursor);
          return;
        }
      }

      // Detectar se está digitando #
      if (e.key === '#' || (e.key && value.slice(-1) === '#')) {
        onVariableSearch?.('', true);
      }
    };

    // Handle input de texto
    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      if (disabled) return;

      const text = e.currentTarget.textContent || '';
      
      // Detectar se está digitando após #
      const lastHashIndex = text.lastIndexOf('#');
      if (lastHashIndex !== -1 && lastHashIndex === text.length - 1) {
        onVariableSearch?.('', true);
      } else if (lastHashIndex !== -1) {
        const textAfterHash = text.substring(lastHashIndex + 1);
        if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n')) {
          onVariableSearch?.(textAfterHash, true);
        } else {
          onVariableSearch?.('', false);
        }
      } else {
        onVariableSearch?.('', false);
      }

      onChange(text);
    };

    // Sincronizar altura com textarea oculto
    useEffect(() => {
      if (hiddenTextareaRef.current) {
        hiddenTextareaRef.current.style.height = 'auto';
        const newHeight = Math.max(100, hiddenTextareaRef.current.scrollHeight);
        if (containerRef.current) {
          containerRef.current.style.height = `${newHeight}px`;
        }
      }
    }, [value]);

    return (
      <div className="relative">
        {/* Textarea oculto para cálculo de altura */}
        <textarea
          ref={hiddenTextareaRef}
          value={value}
          readOnly
          className="absolute opacity-0 pointer-events-none"
          style={{ height: 'auto', minHeight: '100px' }}
        />

        {/* Container editável */}
        <div
          ref={containerRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'overflow-y-auto resize-none',
            'flex flex-wrap items-center gap-1',
            isFocused && 'ring-1 ring-ring',
            className
          )}
          style={{ minHeight: '100px' }}
          suppressContentEditableWarning
        >
          {parts.length === 0 && !isFocused && (
            <span className="text-muted-foreground/60 pointer-events-none">
              {placeholder}
            </span>
          )}
          
          {parts.map((part, index) =>
            part.type === 'variable' ? (
              <span
                key={`${part.content}-${index}`}
                className="variable-chip inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors select-none"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeVariable(part);
                }}
                contentEditable={false}
              >
                <code className="text-xs font-medium">{part.content}</code>
                <X className="h-3 w-3" />
              </span>
            ) : (
              <span key={`text-${index}`} className="whitespace-pre-wrap">
                {part.content}
              </span>
            )
          )}
        </div>
      </div>
    );
  }
);

VariableInput.displayName = 'VariableInput';
