import { useState } from 'react';
import { cn } from '@/lib/utils';
import AnimatedSection from '../components/AnimatedSection';
import PricingCard from '../components/PricingCard';

/**
 * Pricing tiers data
 * Requirements:
 * - 5.1: Display at least 3 pricing tiers (Starter, Professional, Enterprise)
 * - 5.2: Clearly list features included in each tier
 * - 5.7: Starter tier free for small teams (up to 10 users)
 * - 5.8: Professional tier with advanced features
 * - 5.9: Enterprise tier with custom pricing and "Contact Sales" CTA
 */
const pricingTiers = [
  {
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Up to 10 users',
      '3 active projects',
      'Basic grievance tracking',
      'Email support',
      '1GB storage',
    ],
    highlighted: false,
    ctaLabel: 'Get Started Free',
    ctaHref: '/register',
  },
  {
    name: 'Professional',
    description: 'For growing organizations',
    monthlyPrice: 29,
    annualPrice: 290, // ~17% discount
    features: [
      'Up to 50 users',
      'Unlimited projects',
      'Advanced permissions',
      'Priority support',
      '10GB storage',
      'Custom roles',
      'Audit logs',
      'API access',
    ],
    highlighted: true,
    ctaLabel: 'Start Free Trial',
    ctaHref: '/register?plan=professional',
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: null,
    annualPrice: null,
    features: [
      'Unlimited users',
      'Unlimited projects',
      'SSO integration',
      'Dedicated support',
      'Unlimited storage',
      'Custom integrations',
      'SLA guarantee',
      'On-premise option',
    ],
    highlighted: false,
    ctaLabel: 'Contact Sales',
    ctaHref: '/contact',
  },
];

/**
 * PricingSection - Displays pricing tiers with billing toggle
 *
 * Responsive Design (Requirement 10.1):
 * - Mobile (320px-767px): Single column, stacked cards
 * - Tablet (768px-1023px): 3-column grid with smaller gaps
 * - Desktop (1024px+): 3-column grid with full spacing
 *
 * Requirements:
 * - 5.1: Display at least 3 pricing tiers
 * - 5.2: Clearly list features included in each tier
 * - 5.3: Highlight the recommended/popular plan visually
 * - 5.6: Display monthly and annual pricing toggle option
 * - 11.1: WCAG 2.1 AA accessibility standards
 * - 11.2: Keyboard navigation support
 * - 11.3: Proper ARIA labels and semantic HTML
 */
const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section 
      id="pricing" 
      className="py-12 sm:py-16 md:py-20 bg-background"
      aria-labelledby="pricing-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <AnimatedSection animation="fade-up" className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 
            id="pricing-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
          >
            Simple, Transparent{' '}
            <span className="text-primary">Pricing</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your organization. Start free and scale as you grow.
          </p>
        </AnimatedSection>

        {/* Billing Toggle - Requirement 5.6 */}
        <AnimatedSection animation="fade-up" delay={100} className="flex justify-center mb-8 sm:mb-10 md:mb-12">
          <div 
            className="inline-flex items-center gap-2 sm:gap-3 p-1 rounded-full bg-muted"
            role="radiogroup"
            aria-label="Billing period selection"
          >
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                'px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                !isAnnual
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              role="radio"
              aria-checked={!isAnnual}
              aria-label="Monthly billing"
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(
                'px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isAnnual
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              role="radio"
              aria-checked={isAnnual}
              aria-label="Annual billing, save 17 percent"
            >
              Annual
              <span className="ml-1 sm:ml-1.5 text-[10px] sm:text-xs text-primary font-semibold" aria-hidden="true">
                Save 17%
              </span>
            </button>
          </div>
        </AnimatedSection>

        {/* Pricing Cards Grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto items-start"
          role="list"
          aria-label="Pricing plans"
        >
          {pricingTiers.map((tier, index) => {
            const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
            const period = isAnnual ? '/year' : '/month';

            return (
              <AnimatedSection
                key={tier.name}
                animation="fade-up"
                delay={150 + index * 100}
                threshold={0.1}
              >
                <PricingCard
                  name={tier.name}
                  description={tier.description}
                  price={price}
                  period={period}
                  features={tier.features}
                  highlighted={tier.highlighted}
                  ctaLabel={tier.ctaLabel}
                  ctaHref={tier.ctaHref}
                />
              </AnimatedSection>
            );
          })}
        </div>

        {/* Additional info */}
        <AnimatedSection animation="fade-up" delay={500} className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default PricingSection;
