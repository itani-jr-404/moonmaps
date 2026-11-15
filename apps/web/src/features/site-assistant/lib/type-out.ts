/**
 * The "typing" reveal of an answer. The API sends the whole answer at once (it does not stream),
 * so the browser types the received text out quickly: at least MIN_CPS characters a second, and
 * faster for a long answer so that no answer takes longer than MAX_MS. With reduced motion the
 * whole text shows at once. These are the team's own choices for the feel, not outside values.
 */
export const MIN_CPS = 140;
export const MAX_MS = 1600;

/** Characters per second for a text of `total` characters. */
export function typeSpeed(total: number): number {
  return Math.max(MIN_CPS, (total / MAX_MS) * 1000);
}

/** How many characters are shown `elapsedMs` after the reveal started. */
export function typedLength(
  total: number,
  elapsedMs: number,
  reduced = false,
): number {
  if (reduced || total <= 0) return Math.max(total, 0);
  if (elapsedMs <= 0) return 0;
  return Math.min(total, Math.floor((elapsedMs * typeSpeed(total)) / 1000));
}

/**
 * The part of the text to show for `length` characters, cut back to the end of the last whole
 * word, so a word (or a link) never appears half typed. The full text once it is all revealed.
 */
export function typedText(text: string, length: number): string {
  if (length >= text.length) return text;
  if (length <= 0) return '';
  const cut = text.slice(0, length);
  const space = cut.search(/\s\S*$/);
  return space > 0 ? cut.slice(0, space) : cut;
}
