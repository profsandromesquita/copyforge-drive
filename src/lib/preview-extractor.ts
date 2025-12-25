/**
 * Utility to extract preview text from sessions JSON
 * Used as frontend fallback when preview_text is null in database
 */

interface Block {
  type: string;
  content?: string;
  config?: {
    quote?: string;
    items?: string[];
    imageUrl?: string;
    [key: string]: unknown;
  };
}

interface Session {
  blocks?: Block[];
  [key: string]: unknown;
}

type Sessions = Session[] | null | undefined;

/**
 * Extracts the first meaningful text from sessions blocks
 * Priority: headline > subheadline > text > button > testimonial > list
 */
export function extractPreviewFromSessions(sessions: Sessions, maxLength = 200): string | null {
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
    return null;
  }

  const firstSession = sessions[0];
  if (!firstSession || !Array.isArray(firstSession.blocks) || firstSession.blocks.length === 0) {
    return null;
  }

  const blocks = firstSession.blocks;

  // Priority order for text extraction
  const textBlockTypes = ['headline', 'subheadline', 'text', 'button'];

  // 1. Try standard text blocks in priority order
  for (const blockType of textBlockTypes) {
    const block = blocks.find(
      (b) => b.type === blockType && b.content && b.content.trim() !== ''
    );
    if (block?.content) {
      return truncateText(block.content, maxLength);
    }
  }

  // 2. Try testimonial (quote field)
  const testimonialBlock = blocks.find(
    (b) => b.type === 'testimonial' && b.config?.quote && b.config.quote.trim() !== ''
  );
  if (testimonialBlock?.config?.quote) {
    return truncateText(testimonialBlock.config.quote, maxLength);
  }

  // 3. Try list (first item)
  const listBlock = blocks.find(
    (b) => b.type === 'list' && b.config?.items && b.config.items.length > 0
  );
  if (listBlock?.config?.items?.[0]) {
    return truncateText(listBlock.config.items[0], maxLength);
  }

  return null;
}

function truncateText(text: string, maxLength: number): string {
  const cleaned = text.trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return cleaned.substring(0, maxLength - 3) + '...';
}
