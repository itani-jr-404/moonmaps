import type { Metadata } from 'next';

import { PlannerSection } from '@/features/planner/components/planner-section';
import { PlannerUrlSync } from '@/features/planner/components/planner-url-sync';

export const metadata: Metadata = { title: 'Planner' };

export default function PlannerPage() {
  return (
    <div className="pt-20">
      {/* Only the planner keeps ?site=, ?lat=&lon= and ?t= in the address. */}
      <PlannerUrlSync />
      <PlannerSection />
    </div>
  );
}
