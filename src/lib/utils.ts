import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata valor numérico para moeda brasileira (BRL)
 * @param value - Valor a ser formatado
 * @returns String formatada no padrão R$1.000 ou R$1.234,56 (centavos só aparecem se diferentes de zero)
 */
export function formatCurrency(value: number): string {
  const hasDecimals = value % 1 !== 0;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata créditos (números decimais) no padrão brasileiro
 * @param value - Valor a ser formatado
 * @returns String formatada no padrão 1.000 ou 1.234,56 (centavos só aparecem se diferentes de zero)
 */
export function formatCredits(value: number): string {
  const hasDecimals = value % 1 !== 0;
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata números inteiros no padrão brasileiro
 * @param value - Valor a ser formatado
 * @returns String formatada no padrão 1.000
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}
