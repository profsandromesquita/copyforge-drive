/**
 * Limites de caracteres por plataforma de rede social
 * 
 * Usado para injetar restrições no System Prompt quando o tipo de copy é "conteudo"
 */

export const PLATFORM_LIMITS: Record<string, { 
  maxChars: number; 
  label: string; 
  strictMode: boolean;
}> = {
  'x_twitter': { maxChars: 280, label: 'X (Twitter)', strictMode: true },
  'threads': { maxChars: 500, label: 'Threads', strictMode: true },
  'pinterest': { maxChars: 500, label: 'Pinterest', strictMode: true },
  'instagram': { maxChars: 2200, label: 'Instagram', strictMode: false },
  'linkedin': { maxChars: 3000, label: 'LinkedIn', strictMode: false },
  'tiktok': { maxChars: 4000, label: 'TikTok', strictMode: false },
  'youtube': { maxChars: 5000, label: 'YouTube', strictMode: false },
  'facebook': { maxChars: 63206, label: 'Facebook', strictMode: false },
};

/**
 * Constrói a instrução de restrição de plataforma para injeção no System Prompt
 * Esta instrução é uma "Negative Constraint" - adicionada ao FINAL do prompt
 * para ter prioridade sobre outras instruções
 */
export function buildPlatformConstraint(platform: string | undefined | null): string {
  if (!platform || !PLATFORM_LIMITS[platform]) return '';
  
  const { maxChars, label, strictMode } = PLATFORM_LIMITS[platform];
  
  let constraint = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ RESTRIÇÃO CRÍTICA DE PLATAFORMA: ${label}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIMITE MÁXIMO ABSOLUTO: ${maxChars.toLocaleString('pt-BR')} caracteres

REGRAS INVIOLÁVEIS:
- O texto final NÃO PODE exceder ${maxChars} caracteres (incluindo espaços e emojis)
- Conte caracteres mentalmente durante a geração
- Priorize IMPACTO sobre VOLUME
- Se o conteúdo naturalmente excederia o limite, seja mais conciso
`;

  // Modo estrito para plataformas com limite curto (X, Threads, Pinterest)
  if (strictMode) {
    constraint += `
⚠️ MODO ESTRITO ATIVADO (limite muito curto: ${maxChars} chars)
REGRAS ADICIONAIS:
- CADA PALAVRA deve ter propósito - elimine TODO "enchimento"
- Use frases de impacto, não parágrafos
- Verbos fortes e diretos (sem gerúndios ou construções passivas)
- ZERO redundância ou repetição de ideias
- Emojis contam como ~2 caracteres cada
- Se o conteúdo não couber, sugira dividir em múltiplos posts
`;
  }

  constraint += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  return constraint;
}
