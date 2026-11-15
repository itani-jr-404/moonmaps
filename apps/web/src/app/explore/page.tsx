import type { Metadata } from 'next';

import { LandingSection } from '@/features/landing/components/landing-section';

export const metadata: Metadata = { title: 'Choose a landing' };

export default function ExplorePage() {
  return (
    <div className="pt-20">
      <LandingSection />
    </div>
  );
}
