import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * CTA content configuration
 */
const ctaContent = {
  headline: 'Ready to Transform Your Workflow?',
  subtext:
    'Join thousands of organizations already using our platform to streamline projects, resolve grievances, and boost team collaboration.',
  primaryCTA: { label: 'Start Free Trial', href: '/register' },
  secondaryCTA: { label: 'Contact Sales', href: '/contact' },
};

/**
 * CTASection - Final call-to-action section before the footer
 */
const CTASection = () => {
  return (
    <section
      id="cta"
      className={cn(
        'py-12 sm:py-16 md:py-20 lg:py-28',
        'relative overflow-hidden'
      )}
      aria-labelledby="cta-heading"
    >
      {/* Visually distinct gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" aria-hidden="true" />
      
      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Decorative blur elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Sparkle icon - decorative */}
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4 sm:mb-6"
            aria-hidden="true"
          >
            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
          </motion.div>

          {/* Headline */}
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            id="cta-heading"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6"
          >
            {ctaContent.headline}
          </motion.h2>

          {/* Subtext */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base sm:text-lg md:text-xl text-white/80 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto"
          >
            {ctaContent.subtext}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.4 }}
             className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
             role="group"
             aria-label="Call to action buttons"
          >
            {/* Primary registration button */}
            <Link to={ctaContent.primaryCTA.href}>
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base bg-white text-primary hover:bg-white/90 shadow-lg focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary w-full sm:w-auto hover:scale-105 transition-transform"
                aria-label="Start your free trial today"
              >
                {ctaContent.primaryCTA.label}
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </Button>
            </Link>

            {/* Secondary contact button */}
            <Link to={ctaContent.secondaryCTA.href}>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base border-white/30 text-white hover:bg-white/10 hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary w-full sm:w-auto"
                aria-label="Contact our sales team"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                {ctaContent.secondaryCTA.label}
              </Button>
            </Link>
          </motion.div>

          {/* Additional trust text */}
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 text-sm text-white/60"
          >
            No credit card required • 14-day free trial • Cancel anytime
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
