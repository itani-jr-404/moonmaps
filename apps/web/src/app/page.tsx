import { FuturePreview } from '@/features/about/components/future-demos';
import { HeroSection } from '@/features/hero/components/hero-section';
import { HomeCards } from '@/features/home/components/home-cards';
import { WhySection } from '@/features/why/components/why-section';

/** Home: the hero with the opening intro, a card for each page, a preview of what comes next,
 * then why the south pole. */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HomeCards />
      <FuturePreview />
      <WhySection />
    </>
  );
}
