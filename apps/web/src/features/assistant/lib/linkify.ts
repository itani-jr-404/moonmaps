/**
 * Splits assistant text into plain text and safe links. Only http(s) links to hosts on the
 * allow list become links; anything else stays as plain text. The API already removes links to
 * other hosts (apps/api/app/services/assistant.py, `_check_reply`); this is a second check in the
 * browser, so a reply can never put an unexpected link on the page.
 */

/** Hosts allowed with every subdomain. The same pair as ALWAYS_ALLOWED in the API's assistant service. */
const ALLOWED_DOMAINS = ['nasa.gov', 'spaceappschallenge.org'] as const;

/**
 * Exact hosts that the API also allows because the assistant's documents name them: every
 * non-*.nasa.gov host in apps/api/app/data/knowledge/*.md, read 2026-11-15. The server builds
 * its list from those files (apps/api/app/services/knowledge.py, `allowed_hosts`). If a document
 * adds a host, add it here too, or its links show as plain text.
 */
const ALLOWED_HOSTS = [
  'arxiv.org',
  'github.com',
  'imbrium.mit.edu',
  'lroc.im-ldi.com',
  'quickmap.lroc.asu.edu',
  'quickmap.lroc.im-ldi.com',
  'www.apollojournals.org',
  'www.asc-csa.gc.ca',
  'www.facebook.com',
  'www.instagram.com',
  'www.isro.gov.in',
  'www.linkedin.com',
] as const;

export type TextPart =
  { kind: 'text'; text: string } | { kind: 'link'; text: string; href: string };

const URL_RE = /https?:\/\/[^\s<>"'`]+/gi;
const TRAILING = /[.,;:!?'"]+$/;

export function isAllowedHost(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, '');
  if ((ALLOWED_HOSTS as readonly string[]).includes(h)) return true;
  return ALLOWED_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`));
}

/** Drops punctuation that ends a sentence, and a closing bracket the URL did not open. */
function trimUrl(raw: string): string {
  let url = raw.replace(TRAILING, '');
  while (url.endsWith(')') || url.endsWith(']')) {
    const close = url.endsWith(')') ? ')' : ']';
    const open = close === ')' ? '(' : '[';
    if (url.split(open).length >= url.split(close).length) break;
    url = url.slice(0, -1).replace(TRAILING, '');
  }
  return url;
}

/** The URL to link to, or null when it must stay plain text. */
export function safeHref(candidate: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  if (parsed.username || parsed.password) return null;
  if (!isAllowedHost(parsed.hostname)) return null;
  return parsed.href;
}

export function linkify(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  const push = (t: string) => {
    if (!t) return;
    const prev = parts[parts.length - 1];
    if (prev?.kind === 'text') prev.text += t;
    else parts.push({ kind: 'text', text: t });
  };
  for (const match of text.matchAll(URL_RE)) {
    const start = match.index;
    const url = trimUrl(match[0]);
    const href = safeHref(url);
    push(text.slice(last, start));
    if (href) parts.push({ kind: 'link', text: url, href });
    else push(url);
    last = start + url.length;
  }
  push(text.slice(last));
  return parts;
}
