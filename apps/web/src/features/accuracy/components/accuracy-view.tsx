'use client';

import type { Schemas } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/client';
import { useAccuracy } from '@/lib/api/hooks';
import { RichText } from '@/features/assistant/components/log-entry';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import {
  barPercent,
  bodyName,
  featureWords,
  fmtDiff,
  fmtElevation,
  fmtMae,
  fmtShare,
  fmtSmallDeg,
  fmtUtc,
  VALIDATION_URL,
} from '../lib/format';
import styles from './accuracy.module.css';

type Report = Schemas['AccuracyReport'];

/**
 * How accurate Moon Maps is: the error rates, what the app learned from NASA's long-term maps,
 * Apollo moonwalk times and the JPL Horizons position checks. Every number is from GET /accuracy,
 * which reads the saved comparison files (docs/VALIDATION.md).
 */
export function AccuracyView() {
  const query = useAccuracy();

  return (
    <div className="wrap">
      <header className={styles.hero}>
        <p className="eyebrow">Accuracy</p>
        <h1 className={styles.h1}>How accurate is Moon Maps?</h1>
        {query.data ? (
          <p className={styles.lead}>{query.data.error_rate.headline}</p>
        ) : null}
      </header>

      {query.isPending ? (
        <LoadingState label="Loading the accuracy report…" />
      ) : query.isError ? (
        <ErrorState
          message={errorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <Report report={query.data} />
      )}
    </div>
  );
}

function Report({ report }: { report: Report }) {
  const { error_rate, calibration, past_landings, positions } = report;
  const empty =
    error_rate.items.length === 0 &&
    calibration.bodies.length === 0 &&
    past_landings.rows.length === 0 &&
    positions.cases === 0;
  if (empty)
    return (
      <EmptyState>
        The accuracy report has no results yet. The comparison files have not
        been made.
      </EmptyState>
    );

  return (
    <>
      <section aria-labelledby="acc-rates" className={styles.block}>
        <h2 id="acc-rates" className={styles.h2}>
          Error rates
        </h2>
        {error_rate.items.length === 0 ? (
          <EmptyState>No error rates yet.</EmptyState>
        ) : (
          <ul className={styles.tiles}>
            {error_rate.items.map((item) => (
              <li key={item.label} className={styles.tile}>
                <p className={styles.tileLabel}>{item.label}</p>
                <p className={styles.tileValue}>{item.value}</p>
                <p className={styles.tileDetail}>{item.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Learning calibration={calibration} />
      <PastLandings data={past_landings} />
      <Positions data={positions} />

      <section className={styles.block} aria-labelledby="acc-more">
        <h2 id="acc-more" className={styles.h2}>
          The full report
        </h2>
        <p className={styles.text}>
          Every check, the files it reads and how to run it again are in the
          validation report.{' '}
          <a
            href={VALIDATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Read docs/VALIDATION.md on GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
        <p className={styles.small}>
          Report made {fmtUtc(report.generated_at)}.
        </p>
      </section>
    </>
  );
}

function Learning({
  calibration,
}: {
  calibration: Schemas['CalibrationSummary'];
}) {
  const max = Math.max(
    0,
    ...calibration.bodies.flatMap((b) => [b.raw_mae, b.calibrated_mae]),
  );
  return (
    <section aria-labelledby="acc-learning" className={styles.block}>
      <h2 id="acc-learning" className={styles.h2}>
        Learning from past data
      </h2>
      <p className={styles.text}>
        Moon Maps compared how often the Sun and the Earth are visible over many
        years with NASA&apos;s long-term maps at {calibration.points} points. It
        then learned a correction ({calibration.method}) and tested it on points
        it had not seen ({calibration.folds}-fold cross-validation). Lower is
        better.
      </p>

      {calibration.bodies.length === 0 ? (
        <EmptyState>No learning results yet.</EmptyState>
      ) : (
        <div className={styles.bars}>
          {calibration.bodies.map((b) => (
            <figure key={b.body} className={styles.barGroup}>
              <figcaption className={styles.barTitle}>
                <span>{bodyName(b.body)}</span>
                <span className={styles.badge}>
                  {b.improvement_pct.toFixed(1)} % lower error
                </span>
              </figcaption>
              <dl className={styles.barList}>
                <Bar
                  label="Before learning"
                  value={b.raw_mae}
                  max={max}
                  kind="raw"
                />
                <Bar
                  label="After learning"
                  value={b.calibrated_mae}
                  max={max}
                  kind="calibrated"
                />
              </dl>
              <p className={styles.small}>
                Points within 0.05: {fmtShare(b.raw_within_0_05)} before,{' '}
                {fmtShare(b.calibrated_within_0_05)} after.
              </p>
            </figure>
          ))}
        </div>
      )}

      {calibration.features.length > 0 ? (
        <div className={styles.features}>
          <p className={styles.small}>What the model looks at:</p>
          <ul>
            {calibration.features.map((f) => (
              <li key={f} className={styles.feature}>
                {featureWords(f)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.note}>
        <p className={styles.noteTitle}>Limits</p>
        <p>
          The model learned from {calibration.points} points near the south
          pole, so it is only tested there. It corrects long-term shares of
          time, not the Sun and Earth positions at one moment, which come
          straight from the ephemeris. The error rates above say where a simpler
          rule does as well.
        </p>
      </div>
    </section>
  );
}

function Bar({
  label,
  value,
  max,
  kind,
}: {
  label: string;
  value: number;
  max: number;
  kind: 'raw' | 'calibrated';
}) {
  return (
    <div className={styles.barRow}>
      <dt className={styles.barLabel}>{label}</dt>
      <dd className={styles.barCell}>
        <span className={styles.barTrack} aria-hidden="true">
          <span
            className={styles.barFill}
            data-kind={kind}
            style={{ width: `${barPercent(value, max)}%` }}
          />
        </span>
        <span className={styles.barValue}>
          <span className="sr-only">mean error </span>
          {fmtMae(value)}
        </span>
      </dd>
    </div>
  );
}

function PastLandings({ data }: { data: Schemas['PastLandingsAccuracy'] }) {
  return (
    <section aria-labelledby="acc-past" className={styles.block}>
      <h2 id="acc-past" className={styles.h2}>
        Past landings
      </h2>
      <p className={styles.text}>
        The Sun&apos;s height above a smooth horizon at the start and end of
        Apollo moonwalks, from Moon Maps, from NASA JPL Horizons and from the
        Apollo Lunar Surface Journal. Over {data.cases} times, Moon Maps and JPL
        Horizons differ by at most {fmtSmallDeg(data.max_diff_vs_horizons_deg)}.
      </p>
      {/*
        The Journal table ("Sun Angles", Brian W. Lawrence, 1999,
        https://www.apollojournals.org/alsj/sunangles.html) rises 0.508 degrees an hour at both
        sites, the rate at the lunar equator; see docs/VALIDATION.md section 3.
      */}
      <p className={styles.text}>
        The Journal column is a table compiled by hand in 1999, not JPL
        Horizons. Its Sun climbs at the rate of the Moon&apos;s equator (0.508
        degrees an hour), so for the later Apollo 15 and 17 moonwalks, at 26 and
        20 degrees north, it drifts away from both Moon Maps and JPL Horizons,
        by up to 4.3 degrees. The 0.05 degree pass rule below is for the
        comparison with JPL Horizons.
      </p>
      {data.rows.length === 0 ? (
        <EmptyState>No past landings yet.</EmptyState>
      ) : (
        <div
          className={styles.tableWrap}
          tabIndex={0}
          role="region"
          aria-label="Past landings table"
        >
          <table className={styles.table}>
            <caption className="sr-only">
              Sun elevation at Apollo moonwalk times, in degrees
            </caption>
            <thead>
              <tr>
                <th scope="col">Mission</th>
                <th scope="col">Time (UTC)</th>
                <th scope="col">Moon Maps</th>
                <th scope="col">JPL Horizons</th>
                <th scope="col">Journal</th>
                <th scope="col">Moon Maps − Journal</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={`${r.mission}-${r.t}`}>
                  <th scope="row">{r.mission}</th>
                  <td className={styles.mono}>{fmtUtc(r.t)}</td>
                  <td className={styles.mono}>{fmtElevation(r.ours_el_deg)}</td>
                  <td className={styles.mono}>
                    {fmtElevation(r.horizons_el_deg)}
                  </td>
                  <td className={styles.mono}>
                    {r.journal_el_deg === null
                      ? 'No value'
                      : fmtElevation(r.journal_el_deg)}
                  </td>
                  <td className={styles.mono}>
                    {fmtDiff(r.ours_el_deg, r.journal_el_deg)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Positions({ data }: { data: Schemas['PositionsAccuracy'] }) {
  const pass = data.max_diff_deg <= data.tolerance_deg;
  return (
    <section aria-labelledby="acc-positions" className={styles.block}>
      <h2 id="acc-positions" className={styles.h2}>
        Positions vs JPL Horizons
      </h2>
      <p className={styles.text}>
        The direction and height of the Sun and the Earth, from Moon Maps,
        against NASA JPL Horizons for the same place and time.
      </p>
      <ul className={styles.stats}>
        <li className={styles.stat}>
          <p className={styles.tileLabel}>Cases</p>
          <p className={styles.statValue}>{data.cases}</p>
        </li>
        <li className={styles.stat}>
          <p className={styles.tileLabel}>Largest difference</p>
          <p className={styles.statValue}>{fmtSmallDeg(data.max_diff_deg)}</p>
        </li>
        <li className={styles.stat}>
          <p className={styles.tileLabel}>Pass rule</p>
          <p className={styles.statValue}>{fmtSmallDeg(data.tolerance_deg)}</p>
          <p className={styles.small}>
            {pass ? 'Every case is within it.' : 'Some cases are outside it.'}
          </p>
        </li>
      </ul>
      <p className={styles.small}>
        Reference: <RichText text={data.reference} />
      </p>
    </section>
  );
}
