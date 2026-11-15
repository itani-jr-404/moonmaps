import { ExternalIcon } from '@/components/ui/icons';
import { NASA_RESOURCES } from '../lib/resources';
import styles from './assistant.module.css';

/** The Resources tab: NASA tools for looking further, each opening in a new tab. */
export function ResourcesView() {
  return (
    <div className={styles.log}>
      <p className={styles.briefing}>
        NASA tools to look further into what Moon Maps shows. Each one opens in
        a new tab.
      </p>
      {NASA_RESOURCES.map((group, g) => (
        <section
          key={group.title}
          className={styles.resGroup}
          aria-labelledby={`assistant-res-${g}`}
        >
          <h3 id={`assistant-res-${g}`} className={styles.resHeading}>
            {group.title}
          </h3>
          <ul>
            {group.items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.resRow}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm text-ink">{item.title}</span>
                    <span className="text-xs text-muted">{item.note}</span>
                    <span className="mono truncate text-[11px] text-faint">
                      {new URL(item.href).hostname}
                    </span>
                  </span>
                  <ExternalIcon />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
