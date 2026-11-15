/**
 * Turns the assistant's plain-text reply into paragraphs and lists, without any HTML or markdown
 * parser: lines starting with "- " (or "* ") become a bulleted list, lines starting with "1. "
 * a numbered list. Everything else is a paragraph that keeps its line breaks; a paragraph line
 * between list items ends the list.
 */

export type ReplyBlock =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[]; start: number };

const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*(\d{1,3})[.)]\s+(.*)$/;

export function replyBlocks(text: string): ReplyBlock[] {
  const blocks: ReplyBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: 'p', text: para.join('\n') });
    para = [];
  };

  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    if (bullet || numbered) flush();
    const last = blocks[blocks.length - 1];
    if (bullet) {
      if (last?.kind === 'ul') last.items.push(bullet[1]!);
      else blocks.push({ kind: 'ul', items: [bullet[1]!] });
    } else if (numbered) {
      if (last?.kind === 'ol') last.items.push(numbered[2]!);
      else
        blocks.push({
          kind: 'ol',
          items: [numbered[2]!],
          start: Number(numbered[1]),
        });
    } else if (line.trim() === '') {
      // A blank line ends a paragraph. It does not end a list, so a list with blank lines
      // between its items stays one list (and a numbered list keeps counting).
      flush();
    } else {
      para.push(line);
    }
  }
  flush();
  return blocks;
}
