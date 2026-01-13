import { Building2, CheckCircle2, MessageSquare, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedSection from '../components/AnimatedSection';
import StatCard from '../components/StatCard';

/**
 * Statistics data for the landing page
 * Requirements: 7.1, 7.2 - Key metrics display
 */
const stats = [
  {
    value: 500,
    suffix: '+',
    label: 'Organizations',
    icon: Building2,
  },
  {
    value: 50,
    suffix: 'K+',
    label: 'Tasks Completed',
    icon: CheckCircle2,
  },
  {
    value: 10,
    suffix: 'K+',
    label: 'Grievances Resolved',
    icon: MessageSquare,
  },
  {
    value: 98,
    suffix: '%',
    label: 'User Satisfaction',
    icon: ThumbsUp,
  },
];

/**
 * StatsSection - Displays platform statistics with animated counters
 * 
 * Responsive Design (Requirement 10.1):
 * - Mobile (320px-767px): 2-column grid with smaller padding
 * - Tablet (768px-1023px): 2-column grid with medium padding
 * - Desktop (1024px+): 4-column grid with full padding
 * 
 * Requirements: 
 * - 7.1, 7.2, 7.4 - Statistics section with key metrics in visually appealing layout
 * - 11.1: WCAG 2.1 AA accessibility standards
 * - 11.3: Proper ARIA labels and semantic HTML
 */
const StatsSection = () => {
  return (
    <section
      id="stats"
      className={cn(
        'py-12 sm:py-16 md:py-24',
        'bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5',
        'relative overflow-hidden'
      )}
      aria-labelledby="stats-heading"
    >
      {/* Background decorative elements - hidden from screen readers */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section header */}
        <AnimatedSection animation="fade-up" className="text-center mb-8 sm:mb-12">
          <h2 
            id="stats-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4"
          >
            Trusted by Organizations Worldwide
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of teams who have transformed their workflow with our platform
          </p>
        </AnimatedSection>

        {/* Stats grid */}
        <div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto"
          role="list"
          aria-label="Platform statistics"
        >
          {stats.map((stat, index) => (
            <AnimatedSection
              key={stat.label}
              animation="scale-up"
              delay={index * 100}
            >
              <StatCard
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
              />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
