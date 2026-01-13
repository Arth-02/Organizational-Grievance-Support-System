import {
  Building2,
  Users,
  FolderKanban,
  Rocket,
} from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';

/**
 * Steps data for the "How It Works" workflow
 * Requirements: 4.1, 4.2 - Include 3-4 numbered steps covering the workflow
 */
const steps = [
  {
    number: 1,
    icon: Building2,
    title: 'Register Organization',
    description:
      'Sign up and create your organization profile in minutes. Set up your company details and get started immediately.',
  },
  {
    number: 2,
    icon: Users,
    title: 'Set Up Teams & Roles',
    description:
      'Create departments, invite team members, and assign roles with granular permissions tailored to your needs.',
  },
  {
    number: 3,
    icon: FolderKanban,
    title: 'Create Projects & Boards',
    description:
      'Set up projects with customizable Kanban boards, define workflows, and organize tasks your way.',
  },
  {
    number: 4,
    icon: Rocket,
    title: 'Track & Collaborate',
    description:
      'Monitor progress in real-time, handle grievances efficiently, and collaborate seamlessly with your team.',
  },
];

/**
 * StepCard - Individual step display component
 * Accessibility: Uses semantic HTML with proper ARIA attributes
 */
const StepCard = ({ step, isLast }) => {
  const Icon = step.icon;

  return (
    <article 
      className="relative flex flex-col items-center text-center group"
      role="listitem"
      aria-labelledby={`step-${step.number}-title`}
    >
      {/* Step Number Badge */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <span 
          className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-primary-foreground bg-primary rounded-full shadow-lg"
          aria-label={`Step ${step.number}`}
        >
          {step.number}
        </span>
      </div>

      {/* Icon Container */}
      <div 
        className="w-20 h-20 mb-4 mt-4 rounded-2xl bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-105"
        aria-hidden="true"
      >
        <Icon className="w-10 h-10 text-primary" />
      </div>

      {/* Content */}
      <h3 
        id={`step-${step.number}-title`}
        className="text-xl font-semibold mb-2"
      >
        {step.title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
        {step.description}
      </p>

      {/* Connector Line - Requirement 4.3: Visual flow connectors - decorative */}
      {!isLast && (
        <div 
          className="hidden lg:block absolute top-16 left-[calc(50%+60px)] w-[calc(100%-60px)] h-0.5"
          aria-hidden="true"
        >
          <div className="w-full h-full bg-gradient-to-r from-primary/40 to-primary/10 relative">
            {/* Arrow indicator */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-primary/40 rotate-45" />
          </div>
        </div>
      )}
    </article>
  );
};

/**
 * HowItWorksSection - Step-by-step workflow guide
 *
 * Responsive Design (Requirement 10.1):
 * - Mobile (320px-767px): Single column, vertical flow
 * - Tablet (768px-1023px): 2-column grid
 * - Desktop (1024px+): 4-column grid with horizontal connectors
 *
 * Requirements:
 * - 4.1: Include a "How It Works" section with 3-4 numbered steps
 * - 4.2: Cover steps: Register Organization, Set Up Teams & Roles, Create Projects & Boards, Track & Collaborate
 * - 4.3: Steps connected with visual flow indicators (lines or arrows)
 * - 4.4: Include relevant icons or illustrations for each step
 * - 11.1: WCAG 2.1 AA accessibility standards
 * - 11.3: Proper ARIA labels and semantic HTML
 */
const HowItWorksSection = () => {
  return (
    <section 
      id="how-it-works" 
      className="py-12 sm:py-16 md:py-20 bg-background"
      aria-labelledby="how-it-works-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <AnimatedSection animation="fade-up" className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 
            id="how-it-works-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
          >
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Get your organization up and running in four simple steps. 
            Our intuitive platform makes onboarding a breeze.
          </p>
        </AnimatedSection>

        {/* Steps Grid */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-6 relative"
          role="list"
          aria-label="Getting started steps"
        >
          {steps.map((step, index) => (
            <AnimatedSection
              key={step.number}
              animation="fade-up"
              delay={index * 150}
              threshold={0.1}
            >
              <StepCard step={step} isLast={index === steps.length - 1} />
            </AnimatedSection>
          ))}
        </div>

        {/* Mobile Flow Indicator - decorative */}
        <div className="lg:hidden flex justify-center mt-8" aria-hidden="true">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>Scroll through steps</span>
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-primary/40"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
