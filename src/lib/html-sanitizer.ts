/**
 * Utility functions for sanitizing HTML content for safe display
 * Used primarily for cleaning preview text in cards
 */

/**
 * Removes all HTML tags from a string
 */
export function stripHtmlTags(text: string): string {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Decodes common HTML entities to their character equivalents
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&mdash;': '\u2014',
    '&ndash;': '\u2013',
    '&hellip;': '\u2026',
    '&copy;': '\u00A9',
    '&reg;': '\u00AE',
    '&trade;': '\u2122',
    '&bull;': '\u2022',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
  };
  
  let result = text;
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'gi'), char);
  }
  
  // Handle numeric entities (&#123; or &#x1F;)
  result = result.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  return result;
}

/**
 * Sanitizes preview text by removing HTML tags and decoding entities
 * Returns clean, plain text safe for display
 */
export function sanitizePreviewText(text: string | null | undefined, maxLength?: number): string {
  if (!text) return '';
  
  // Strip HTML tags first
  let clean = stripHtmlTags(text);
  
  // Decode HTML entities
  clean = decodeHtmlEntities(clean);
  
  // Normalize whitespace (collapse multiple spaces/newlines)
  clean = clean.replace(/\s+/g, ' ').trim();
  
  // Truncate if maxLength specified
  if (maxLength && clean.length > maxLength) {
    clean = clean.substring(0, maxLength).trim() + '\u2026';
  }
  
  return clean;
}
