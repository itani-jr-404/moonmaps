import Link from 'next/link';

import { ArrowIcon } from '@/components/ui/icons';

const CARDS = [
  {
    href: '/explore',
    title: 'Choose a landing',
    text: 'Turn the 3D Moon, point at any spot and see if it is a good landing site right now. Then land and look around.',
  },
  {
    href: '/planner',
    title: 'Plan a landing',
    text: 'Pick a site and a date. Get a plain answer, a 30-day calendar and the best windows.',
  },
  {
    href: '/sites',
    title: 'Browse the sites',
    text: 'Past landings and candidate sites. Each has its sky right now, a day-by-day forecast and the trip time.',
  },
  {
    href: '/accuracy',
    title: 'How sure are we',
    text: 'How our Sun and Earth positions compare with NASA JPL Horizons and with past landings.',
  },
  {
    href: '/about',
    title: 'About',
    text: 'What the app does, how it works and its limits.',
  },
] as const;

/** "What you can do": one card per page of the site. */
export function HomeCards() {
  return (
    <section className="section bg-bg" aria-labelledby="do-h">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          What you can do
        </p>
        <h2 className="h2" id="do-h" data-lines>
          <span className="line">
            <span className="li">Start where</span>
          </span>
          <span className="line">
            <span className="li">
              <em>you like.</em>
            </span>
          </span>
        </h2>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <li key={c.href} data-reveal>
              <Link
                href={c.href}
                className="panel group flex h-full flex-col p-6 transition-colors hover:border-line-2 focus-visible:border-accent-2"
              >
                <b className="font-display text-2xl font-light">{c.title}</b>
                <span className="mt-3 flex-1 text-[15px] text-muted">
                  {c.text}
                </span>
                <span className="mt-5 inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.16em] text-accent-2 uppercase">
                  Open
                  <ArrowIcon />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
