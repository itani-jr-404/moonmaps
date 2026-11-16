import Link from 'next/link';

import { ArrowIcon } from '@/components/ui/icons';

import { EmergencyDemo } from './emergency-demo';
import { BestSpotDemo, FlightCheckDemo } from './future-demos';

const ITEMS = [
  { title: 'Watching the site during the flight', Demo: FlightCheckDemo },
  { title: 'The best spot in an area', Demo: BestSpotDemo },
  { title: 'Emergency landing mode', Demo: EmergencyDemo },
] as const;

/** Home: a preview of the planned Future scope ideas, with the same illustrations as /about. */
export function FuturePreview() {
  return (
    <section className="section" aria-labelledby="next-h">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          Coming next
        </p>
        <h2 className="h2" id="next-h" data-lines>
          <span className="line">
            <span className="li">A preview of</span>
          </span>
          <span className="line">
            <span className="li">
              <em>what comes next.</em>
            </span>
          </span>
        </h2>
        <p className="lead" data-reveal>
          Planned, not built yet. Each picture uses made-up data to show how the
          idea could look.
        </p>
        {/* Two columns keep the pictures wide enough to read; the tall simulation takes the
            second column. Three columns only where each is at least about 370 px wide. */}
        <div className="mt-12 grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
          {ITEMS.map(({ title, Demo }, i) => (
            <div
              key={title}
              className={`panel p-6 ${i === 2 ? 'md:col-start-2 md:row-span-2 md:row-start-1 xl:col-start-auto xl:row-span-1 xl:row-start-auto' : ''}`}
              data-reveal
            >
              <h3 className="font-display text-xl font-light">{title}</h3>
              <Demo />
            </div>
          ))}
        </div>
        <Link
          href="/about#future-h"
          className="btn btn-ghost mt-10"
          data-reveal
        >
          <span className="btn-label">See the Future scope</span>
          <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}
