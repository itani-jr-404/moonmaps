import type { Metadata } from 'next';
import { AccuracyView } from '@/features/accuracy/components/accuracy-view';

export const metadata: Metadata = {
  title: 'Accuracy',
  description:
    'How close Moon Maps is to NASA JPL Horizons, NASA long-term maps and Apollo moonwalk times.',
};

/** Error rates and learning from past landings. The nav, footer and assistant come from the layout. */
export default function AccuracyPage() {
  return <AccuracyView />;
}
