import { HeroSection } from '@/features/hero/components/hero-section';
import { HomeCards } from '@/features/home/components/home-cards';
import { WhySection } from '@/features/why/components/why-section';

/** Home: the hero with the opening intro, a card for each page, then why the south pole. */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HomeCards />
      <WhySection />
    </>
  );
}
