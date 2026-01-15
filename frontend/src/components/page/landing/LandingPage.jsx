import { lazy, Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from './sections/HeroSection';

// Lazy load sections that are below the fold for faster initial load
// Requirement 10.6: Loading time under 3 seconds
const FeaturesSection = lazy(() => import('./sections/FeaturesSection'));
const ShowcaseSection = lazy(() => import('./sections/ShowcaseSection'));
const HowItWorksSection = lazy(() => import('./sections/HowItWorksSection'));
const PricingSection = lazy(() => import('./sections/PricingSection'));
const TestimonialsSection = lazy(() => import('./sections/TestimonialsSection'));
const StatsSection = lazy(() => import('./sections/StatsSection'));
const CTASection = lazy(() => import('./sections/CTASection'));

/**
 * Section loading fallback - minimal placeholder to prevent layout shift
 */
const SectionFallback = ({ minHeight = '400px' }) => (
  <div 
    className="w-full animate-pulse bg-muted/20" 
    style={{ minHeight }}
    aria-hidden="true"
  />
);

/**
 * LandingPage - Main container component that composes all landing page sections
 * 
 * Performance Optimizations (Requirements 10.4, 10.6):
 * - Lazy loads below-the-fold sections for faster initial paint
 * - Uses content-visibility for off-screen sections
 * - Hero section loads immediately for fast LCP
 * - Suspense boundaries prevent blocking renders
 * 
 * This component orchestrates all sections in the correct order and manages
 * the overall page structure. Each section has its own ID for smooth scroll
 * navigation from the Navbar.
 * 
 * Section Order:
 * 1. Navbar (fixed at top)
 * 2. Hero Section
 * 3. Features Section
 * 4. Showcase Section
 * 5. How It Works Section
 * 6. Pricing Section
 * 7. Testimonials Section
 * 8. Stats Section
 * 9. CTA Section
 * 10. Footer
 * 
 * Accessibility Features (Requirements 11.1-11.5):
 * - Semantic HTML structure with proper landmarks
 * - Skip to main content link for keyboard users
 * - All sections have proper ARIA labels
 * - Respects prefers-reduced-motion for animations
 * - Keyboard navigation support throughout
 * 
 * Requirements: All - Integrates all landing page requirements
 */
const LandingPage = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Small delay to ensure content is rendered/suspense resolved
      const timer = setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          const navbarHeight = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 300); // 300ms delay to allow for page transitions/mounting
      
      return () => clearTimeout(timer);
    }
  }, [hash]);

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link for keyboard accessibility - Requirement 11.2 */}
      <a 
        href="#hero"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Main Content - All sections rendered in order */}
      <main id="main-content">
        {/* Hero Section - Primary conversion area with headline and CTAs */}
        {/* Loaded immediately for fast LCP (Largest Contentful Paint) */}
        <HeroSection />

        {/* Below-the-fold sections are lazy loaded for performance */}
        <Suspense fallback={<SectionFallback minHeight="600px" />}>
          {/* Features Section - Showcase of platform capabilities */}
          <FeaturesSection />
        </Suspense>

        <Suspense fallback={<SectionFallback minHeight="800px" />}>
          {/* Showcase Section - Interactive tabbed preview */}
          <ShowcaseSection />
        </Suspense>

        <Suspense fallback={<SectionFallback minHeight="500px" />}>
          {/* How It Works Section - Step-by-step workflow explanation */}
          <HowItWorksSection />
        </Suspense>

        <Suspense fallback={<SectionFallback minHeight="700px" />}>
          {/* Pricing Section - Subscription tiers with billing toggle */}
          <PricingSection />
        </Suspense>

        <Suspense fallback={<SectionFallback minHeight="500px" />}>
          {/* Testimonials Section - Customer reviews and social proof */}
          <TestimonialsSection />
        </Suspense>

        <Suspense fallback={<SectionFallback minHeight="300px" />}>
          {/* Stats Section - Platform statistics with animated counters */}
          <StatsSection />
        </Suspense>

        <Suspense fallback={<SectionFallback minHeight="400px" />}>
          {/* CTA Section - Final call-to-action before footer */}
          <CTASection />
        </Suspense>
      </main>
    </div>
  );
};

export default LandingPage;
