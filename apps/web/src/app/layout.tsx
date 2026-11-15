import type { Metadata, Viewport } from 'next';
import { Exo_2, JetBrains_Mono, Jost } from 'next/font/google';
import type { ReactNode } from 'react';
import { Toast } from '@/components/ui/toast';
import { Assistant } from '@/features/assistant/components/assistant';
import { CustomCursor } from '@/features/site-chrome/components/custom-cursor';
import { Reveals } from '@/features/site-chrome/components/reveals';
import { RouteEffects } from '@/features/site-chrome/components/route-effects';
import { SiteFooter } from '@/features/site-chrome/components/site-footer';
import { SiteNav } from '@/features/site-chrome/components/site-nav';
import { Providers } from './providers';
import './globals.css';

const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-exo2',
});
const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-jost',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: {
    default: 'Moon Maps: pick the site, pick the hour',
    template: '%s | Moon Maps',
  },
  description:
    'Moon Maps tells you whether a place and a date on the Moon are good for landing: sunlight for power, and the Earth in sight to call home.',
};

export const viewport: Viewport = {
  themeColor: '#0C1630',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${exo2.variable} ${jost.variable} ${jetbrains.variable}`}
    >
      <body>
        <Providers>
          <a className="skip-link" href="#main">
            Skip to main content
          </a>
          <SiteNav />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
          {/* The assistant is on every page. */}
          <Assistant />
          <Toast />
          <CustomCursor />
          <Reveals />
          <RouteEffects />
        </Providers>
      </body>
    </html>
  );
}
