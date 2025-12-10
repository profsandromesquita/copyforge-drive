/**
 * Utility functions for clipboard operations
 */

/**
 * Extracts clean text from block content, removing HTML and formatting appropriately
 */
export function extractCleanText(
  content: string | string[],
  blockType: string
): string {
  // For lists (array of items)
  if (Array.isArray(content)) {
    return content
      .filter(item => item.trim())
      .map(item => `• ${item.trim()}`)
      .join('\n');
  }

  // For HTML content (text, headline, subheadline)
  if (typeof content === 'string') {
    const temp = document.createElement('div');
    temp.innerHTML = content;
    
    // Preserve line breaks from <br> and block elements
    temp.querySelectorAll('br').forEach(br => {
      br.replaceWith('\n');
    });
    temp.querySelectorAll('p, div').forEach(el => {
      el.append('\n');
    });
    
    return (temp.textContent || temp.innerText || '').trim();
  }

  return '';
}

/**
 * Copies text to clipboard using the native API
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text.trim()) {
    return false;
  }
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
