import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidVariable } from '@/lib/context-variables';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onVariableSearch?: (search: string, show: boolean) => void;
}

export const VariableInput = forwardRef<HTMLTextAreaElement, VariableInputProps>(
  ({ value, onChange, onKeyDown, placeholder, disabled, className, onVariableSearch }, ref) => {
    const divRef = useRef<HTMLDivElement>(null);
    const isUpdatingRef = useRef(false);

    // Expor métodos compatíveis com textarea
    useImperativeHandle(ref, () => ({
      focus: () => {
        divRef.current?.focus();
      },
      selectionStart: 0,
      selectionEnd: 0,
    } as any));

    // Converter texto em HTML com chips de variáveis
    const textToHTML = (text: string): string => {
      if (!text) return '';
      
      const variableRegex = /#[a-zA-Z_áéíóúàèìòùâêîôûãõç]+/g;
      let html = text;
      
      // Substituir apenas variáveis VÁLIDAS por spans com data-variable
      html = html.replace(variableRegex, (match) => {
        const varName = match.substring(1); // Remove o #
        
        // Só transforma em chip se for uma variável válida
        if (isValidVariable(varName)) {
          return `<span class="variable-chip" contenteditable="false" data-variable="${match}">${match}<span class="remove-btn">×</span></span>`;
        }
        
        // Se não for válida, mantém como texto normal
        return match;
      });
      
      // Preservar quebras de linha
      html = html.replace(/\n/g, '<br>');
      
      return html;
    };

    // Converter HTML de volta para texto
    const htmlToText = (element: HTMLDivElement): string => {
      let text = '';
      
      element.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent || '';
        } else if (node.nodeName === 'BR') {
          text += '\n';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.classList.contains('variable-chip')) {
            text += el.dataset.variable || '';
          } else {
            text += htmlToText(el as HTMLDivElement);
          }
        }
      });
      
      return text;
    };

    // Atualizar conteúdo quando value mudar externamente
    useEffect(() => {
      if (!divRef.current || isUpdatingRef.current) return;
      
      const currentText = htmlToText(divRef.current);
      if (currentText !== value) {
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const startOffset = range?.startOffset || 0;
        
        divRef.current.innerHTML = textToHTML(value);
        
        // Tentar restaurar cursor
        try {
          if (range && divRef.current.firstChild) {
            const newRange = document.createRange();
            const textNode = divRef.current.firstChild;
            newRange.setStart(textNode, Math.min(startOffset, textNode.textContent?.length || 0));
            newRange.collapse(true);
            selection?.removeAllRanges();
            selection?.addRange(newRange);
          }
        } catch (e) {
          // Ignorar erros de restauração de cursor
        }
      }
    }, [value]);

    // Calcular posição do cursor no texto completo
    const getCaretPosition = (): number => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !divRef.current) return 0;
      
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(divRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      
      return htmlToText(preCaretRange.cloneContents() as any as HTMLDivElement).length;
    };

    // Handler de input
    const handleInput = () => {
      if (!divRef.current || disabled) return;
      
      isUpdatingRef.current = true;
      const newText = htmlToText(divRef.current);
      onChange(newText);
      
      // Detectar se está digitando após #
      const caretPos = getCaretPosition();
      const textBeforeCursor = newText.substring(0, caretPos);
      const lastHashIndex = textBeforeCursor.lastIndexOf('#');
      
      if (lastHashIndex !== -1) {
        const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);
        if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n')) {
          onVariableSearch?.(textAfterHash, true);
        } else {
          onVariableSearch?.('', false);
        }
      } else {
        onVariableSearch?.('', false);
      }
      
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    };

    // Handler de clique (para remover variáveis)
    const handleClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Se clicou no botão de remover
      if (target.classList.contains('remove-btn')) {
        e.preventDefault();
        e.stopPropagation();
        
        const chip = target.closest('.variable-chip') as HTMLElement;
        if (chip && divRef.current) {
          const variable = chip.dataset.variable || '';
          const currentText = htmlToText(divRef.current);
          const newText = currentText.replace(variable, '');
          onChange(newText);
          
          // Focar novamente
          setTimeout(() => {
            divRef.current?.focus();
          }, 0);
        }
      }
    };

    // Handler de teclas
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      // Prevenir edição dentro de chips de variável
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let node = range.startContainer;
        
        // Verificar se está dentro de um chip
        while (node && node !== divRef.current) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.classList?.contains('variable-chip')) {
              // Se tentar deletar, remover toda a variável
              if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                const variable = el.dataset.variable || '';
                const currentText = htmlToText(divRef.current!);
                const newText = currentText.replace(variable, '');
                onChange(newText);
                return;
              }
              // Mover cursor para fora do chip
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const newRange = document.createRange();
                if (e.key === 'ArrowLeft' && el.previousSibling) {
                  newRange.setStartAfter(el.previousSibling);
                } else if (e.key === 'ArrowRight' && el.nextSibling) {
                  newRange.setStartBefore(el.nextSibling);
                }
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
                return;
              }
            }
          }
          node = node.parentNode!;
        }
      }

      onKeyDown?.(e);
    };

    return (
      <div
        ref={divRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={cn(
          'min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'overflow-y-auto resize-none',
          'whitespace-pre-wrap break-words',
          '[&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-muted-foreground/60',
          className
        )}
        style={{
          minHeight: '100px',
        }}
      />
    );
  }
);

VariableInput.displayName = 'VariableInput';
