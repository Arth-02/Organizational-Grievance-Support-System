import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import AnimatedSection from '@/components/page/landing/components/AnimatedSection';

/**
 * AuthLayout - Shared layout wrapper for Login and Register pages
 * 
 * Features:
 * - Gradient background with decorative blur elements (matching landing page hero)
 * - Two-column responsive layout (form + illustration)
 * - Back to home navigation link
 * - AnimatedSection wrappers for entrance animations
 * 
 * Requirements: 1.1, 1.4, 3.1, 3.4, 5.1, 5.2, 5.3, 8.4
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Form content to render
 * @param {string} props.illustration - Path to illustration image
 * @param {string} props.illustrationAlt - Alt text for illustration
 * @param {boolean} props.showBackLink - Whether to show back to home link (default: true)
 * @param {string} props.className - Additional CSS classes for the form card
 */
const AuthLayout = ({
  children,
  illustration,
  illustrationAlt = 'Illustration',
  showBackLink = true,
  className,
}) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background gradient decoration - matches landing page hero section */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl" />
      </div>

      {/* Main container */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to home link */}
        {showBackLink && (
          <AnimatedSection animation="fade-down" delay={0} className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to Home</span>
            </Link>
          </AnimatedSection>
        )}

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Form Card */}
          <AnimatedSection animation="fade-up" delay={100}>
            <Card
              className={cn(
                'w-full max-w-md mx-auto lg:mx-0',
                'p-6 sm:p-8',
                'shadow-2xl',
                'border border-border',
                className
              )}
            >
              {children}
            </Card>
          </AnimatedSection>

          {/* Right Column - Illustration (hidden on mobile) */}
          {illustration && (
            <AnimatedSection
              animation="fade-left"
              delay={200}
              className="hidden lg:flex items-center justify-center"
            >
              <div className="relative">
                {/* Glow effect behind illustration */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-2xl transform scale-105"
                  aria-hidden="true"
                />
                <img
                  src={illustration}
                  alt={illustrationAlt}
                  className="relative w-full max-w-lg h-auto object-contain"
                />
              </div>
            </AnimatedSection>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
