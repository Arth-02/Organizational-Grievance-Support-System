import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import PricingCard from '../components/PricingCard';

/**
 * Pricing tiers data
 */
const pricingTiers = [
  {
    name: 'Starter',
    planKey: 'starter',
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
    ctaHref: '/register?plan=starter',
  },
  {
    name: 'Professional',
    planKey: 'professional',
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
    planKey: 'enterprise',
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
    ctaHref: '/contact?plan=enterprise',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/**
 * PricingSection - Displays pricing tiers with billing toggle
 */
const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section 
      id="pricing" 
      className="py-12 sm:py-16 md:py-24 bg-background relative overflow-hidden"
      aria-labelledby="pricing-heading"
    >
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
             y: [0, 50, 0],
             opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px]" 
        />
         <motion.div 
          animate={{ 
             y: [0, -50, 0],
             opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] -left-[10%] w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px]" 
        />
      </div>
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            id="pricing-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6"
          >
            Simple, Transparent{' '}
            <span className="text-primary">Pricing</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Choose the plan that fits your organization. Start free and scale as you grow.
          </motion.p>
        </div>

        {/* Billing Toggle */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-10 sm:mb-12 md:mb-16"
        >
          <div 
            className="inline-flex items-center gap-1 p-1.5 rounded-full bg-muted/50 border border-border/50"
            role="radiogroup"
            aria-label="Billing period selection"
          >
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative',
                !isAnnual ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              role="radio"
              aria-checked={!isAnnual}
            >
              {!isAnnual && (
                <motion.div
                  layoutId="billingToggle"
                  className="absolute inset-0 bg-background rounded-full shadow-sm border border-border/50"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Monthly</span>
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative',
                isAnnual ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              role="radio"
              aria-checked={isAnnual}
            >
              {isAnnual && (
                <motion.div
                  layoutId="billingToggle"
                  className="absolute inset-0 bg-background rounded-full shadow-sm border border-border/50"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                Annual
                <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-full font-bold">
                  -17%
                </span>
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-8 max-w-6xl mx-auto items-start"
          role="list"
          aria-label="Pricing plans"
        >
          {pricingTiers.map((tier) => {
            const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
            const period = isAnnual ? '/year' : '/month';
            // Add billing cycle to CTA href for non-contact-sales plans
            const ctaHref = tier.ctaHref.includes('/register') 
              ? `${tier.ctaHref}&billing=${isAnnual ? 'annual' : 'monthly'}`
              : tier.ctaHref;

            return (
              <motion.div
                key={tier.name}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="h-full"
              >
                <PricingCard
                  name={tier.name}
                  description={tier.description}
                  price={price}
                  period={period}
                  features={tier.features}
                  highlighted={tier.highlighted}
                  ctaLabel={tier.ctaLabel}
                  ctaHref={ctaHref}
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional info */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12 md:mt-16"
        >
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
