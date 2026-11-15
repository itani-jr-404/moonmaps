import type { Metadata } from 'next';

import { AboutSection } from '@/features/about/components/about-section';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="pt-20">
      <AboutSection />
    </div>
  );
}
