import type { Metadata, Viewport } from 'next';
import { Exo_2, JetBrains_Mono, Jost } from 'next/font/google';
import type { ReactNode } from 'react';
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
  title: 'Moon Maps: pick the site, pick the hour',
  description:
    'Moon Maps tells you whether a place and a date on the Moon are good for landing: sunlight for power, and the Earth in sight to call home.',
};

export const viewport: Viewport = {
  themeColor: '#070B14',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${exo2.variable} ${jost.variable} ${jetbrains.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
