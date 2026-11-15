import { HeroSection } from '@/features/hero/components/hero-section';
import { HomeCards } from '@/features/home/components/home-cards';
import { WhySection } from '@/features/why/components/why-section';

/** Home: the hero with the opening intro, why the south pole, and a card for each page. */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WhySection />
      <HomeCards />
    </>
  );
}
