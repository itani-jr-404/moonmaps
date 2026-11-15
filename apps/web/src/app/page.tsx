import { Assistant } from '@/features/assistant/components/assistant';
import { AboutSection } from '@/features/about/components/about-section';
import { HeroSection } from '@/features/hero/components/hero-section';
import { LandingSection } from '@/features/landing/components/landing-section';
import { PlannerSection } from '@/features/planner/components/planner-section';
import { CustomCursor } from '@/features/site-chrome/components/custom-cursor';
import { Reveals } from '@/features/site-chrome/components/reveals';
import { SiteFooter } from '@/features/site-chrome/components/site-footer';
import { SiteNav } from '@/features/site-chrome/components/site-nav';
import { WhySection } from '@/features/why/components/why-section';
import { Toast } from '@/components/ui/toast';

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#navigator">
        Skip to the planner
      </a>
      <SiteNav />
      <main id="main">
        <HeroSection />
        <LandingSection />
        <WhySection />
        <PlannerSection />
        <AboutSection />
      </main>
      <SiteFooter />
      <Assistant />
      <Toast />
      <CustomCursor />
      <Reveals />
    </>
  );
}
