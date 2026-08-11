/**
 * A deliberately small markdown subset for the free-text fields (omschrijving,
 * vereisten). Editors type plain text with a few markers; it is stored as-is in
 * the existing TEXT columns, so no database change is involved.
 *
 * Supported:
 *   - bullet          lines starting with "- " or "* "
 *   1. numbered       lines starting with "1. "
 *   **bold**  *italic*
 *   blank line        = new paragraph
 *
 * Safety: every character is HTML-escaped BEFORE any markup is added, so
 * whatever an editor types can only ever come out as text. The tags this
 * produces (p, br, ul, ol, li, strong, em) are all on Angular's sanitizer
 * allowlist, which sanitizes the result again on [innerHTML].
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyInlineMarkers(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
}

const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

/** Render the stored text as a safe HTML fragment. */
export function renderRichText(raw?: string | null): string {
  if (!raw || !raw.trim()) {
    return '';
  }

  const lines = escapeHtml(raw).replace(/\r\n?/g, '\n').split('\n');
  const html: string[] = [];

  let listTag: 'ul' | 'ol' | null = null;
  let paragraph: string[] = [];

  const closeParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${applyInlineMarkers(paragraph.join('<br>'))}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (listTag) {
      html.push(`</${listTag}>`);
      listTag = null;
    }
  };

  for (const line of lines) {
    const bullet = line.match(BULLET);
    const numbered = !bullet ? line.match(NUMBERED) : null;

    if (bullet || numbered) {
      closeParagraph();
      const wanted = bullet ? 'ul' : 'ol';
      if (listTag !== wanted) {
        closeList();
        html.push(`<${wanted}>`);
        listTag = wanted;
      }
      html.push(`<li>${applyInlineMarkers((bullet || numbered)![1])}</li>`);
      continue;
    }

    closeList();

    if (!line.trim()) {
      closeParagraph();
      continue;
    }

    paragraph.push(line.trim());
  }

  closeList();
  closeParagraph();

  return html.join('');
}

/** Strip the markers again, for places that need one compact line (tooltip). */
export function stripRichText(raw?: string | null): string {
  if (!raw) {
    return '';
  }

  return raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.replace(BULLET, '$1').replace(NUMBERED, '$1').trim())
    .filter(Boolean)
    .join(' · ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[*_]/g, '');
}
