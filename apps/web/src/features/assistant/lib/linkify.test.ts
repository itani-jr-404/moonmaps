import { describe, expect, it } from 'vitest';
import { isAllowedHost, linkify, safeHref } from './linkify';

describe('isAllowedHost', () => {
  it('allows nasa.gov, spaceappschallenge.org and their subdomains', () => {
    expect(isAllowedHost('nasa.gov')).toBe(true);
    expect(isAllowedHost('science.nasa.gov')).toBe(true);
    expect(isAllowedHost('SSD.JPL.NASA.GOV')).toBe(true);
    expect(isAllowedHost('www.spaceappschallenge.org')).toBe(true);
  });

  it('allows the exact hosts named in the documents', () => {
    expect(isAllowedHost('arxiv.org')).toBe(true);
    expect(isAllowedHost('www.apollojournals.org')).toBe(true);
    expect(isAllowedHost('evil.arxiv.org')).toBe(false);
  });

  it('refuses look-alike hosts', () => {
    expect(isAllowedHost('nasa.gov.evil.com')).toBe(false);
    expect(isAllowedHost('fakenasa.gov')).toBe(false);
    expect(isAllowedHost('example.com')).toBe(false);
  });
});

describe('safeHref', () => {
  it('refuses other schemes and credentials', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('ftp://nasa.gov/file')).toBeNull();
    expect(safeHref('https://user:pw@nasa.gov/')).toBeNull();
    expect(safeHref('https://evil.com@nasa.gov/')).toBeNull();
    expect(safeHref('not a url')).toBeNull();
  });

  it('keeps an allowed http(s) URL', () => {
    expect(safeHref('https://science.nasa.gov/moon/')).toBe(
      'https://science.nasa.gov/moon/',
    );
  });
});

describe('linkify', () => {
  it('returns plain text unchanged', () => {
    expect(linkify('No links here.')).toEqual([
      { kind: 'text', text: 'No links here.' },
    ]);
  });

  it('links an allowed URL and leaves the sentence end outside', () => {
    expect(linkify('See https://science.nasa.gov/moon/.')).toEqual([
      { kind: 'text', text: 'See ' },
      {
        kind: 'link',
        text: 'https://science.nasa.gov/moon/',
        href: 'https://science.nasa.gov/moon/',
      },
      { kind: 'text', text: '.' },
    ]);
  });

  it('keeps other hosts as plain text', () => {
    expect(linkify('Go to https://example.com/x now')).toEqual([
      { kind: 'text', text: 'Go to https://example.com/x now' },
    ]);
  });

  it('drops a closing bracket the URL did not open', () => {
    const parts = linkify('(source: https://www.nasa.gov/moon)');
    expect(parts[1]).toEqual({
      kind: 'link',
      text: 'https://www.nasa.gov/moon',
      href: 'https://www.nasa.gov/moon',
    });
    expect(parts[2]).toEqual({ kind: 'text', text: ')' });
  });

  it('keeps brackets that belong to the URL', () => {
    const url = 'https://en.nasa.gov/wiki/Moon_(disambiguation)';
    expect(linkify(url)).toEqual([{ kind: 'link', text: url, href: url }]);
  });

  it('handles several links and the "(link removed)" marker', () => {
    const parts = linkify(
      'A https://nasa.gov and B (link removed) and C https://spaceappschallenge.org/2026',
    );
    expect(parts.filter((p) => p.kind === 'link')).toHaveLength(2);
    expect(parts.map((p) => p.text).join('')).toBe(
      'A https://nasa.gov and B (link removed) and C https://spaceappschallenge.org/2026',
    );
  });
});
