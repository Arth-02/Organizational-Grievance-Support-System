import {
  FolderKanban,
  MessageSquareWarning,
  Shield,
  Users,
  Building,
  Paperclip,
} from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import FeatureCard from '../components/FeatureCard';

/**
 * Feature data for the 6 core platform capabilities
 * Requirements: 3.1, 3.2 - Showcase at least 6 core features with icons and descriptions
 */
const features = [
  {
    icon: FolderKanban,
    title: 'Project Management',
    description:
      'Kanban boards with drag-and-drop, custom columns, and real-time updates to keep your projects on track.',
    highlight: 'Popular',
  },
  {
    icon: MessageSquareWarning,
    title: 'Grievance Tracking',
    description:
      'Report, track, and resolve workplace issues with full transparency and accountability.',
  },
  {
    icon: Shield,
    title: 'Role-Based Permissions',
    description:
      'Granular access control with special permissions for flexibility and security across your organization.',
  },
  {
    icon: Users,
    title: 'Real-Time Collaboration',
    description:
      'Live updates via WebSocket for instant team synchronization and seamless communication.',
  },
  {
    icon: Building,
    title: 'Department Management',
    description:
      'Organize your workforce with departments and hierarchies for better structure and oversight.',
  },
  {
    icon: Paperclip,
    title: 'Task Attachments',
    description:
      'Attach files, images, and videos to tasks and grievances for comprehensive documentation.',
  },
];

/**
 * FeaturesSection - Showcase of platform capabilities
 *
 * Responsive Design (Requirement 10.1):
 * - Mobile (320px-767px): Single column, smaller padding
 * - Tablet (768px-1023px): 2-column grid
 * - Desktop (1024px+): 3-column grid
 *
 * Requirements:
 * - 3.1: Showcase at least 6 core features with icons and descriptions
 * - 3.2: Highlight specific features (Project Management, Grievance Tracking, etc.)
 * - 3.4: Include visual mockups or illustrations for each major feature
 * - 3.5: Scroll-triggered sequential animation
 * - 3.6: Responsive grid layout
 * - 11.1: WCAG 2.1 AA accessibility standards
 * - 11.3: Proper ARIA labels and semantic HTML
 */
const FeaturesSection = () => {
  return (
    <section 
      id="features" 
      className="py-12 sm:py-16 md:py-20 bg-muted/30"
      aria-labelledby="features-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <AnimatedSection animation="fade-up" className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 
            id="features-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
          >
            Everything You Need to{' '}
            <span className="text-primary">Succeed</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to streamline your organization&apos;s
            workflow and boost team productivity.
          </p>
        </AnimatedSection>

        {/* Features Grid - Requirement 3.6: Responsive grid layout */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
          role="list"
          aria-label="Platform features"
        >
          {features.map((feature, index) => (
            /* Requirement 3.5: Sequential animation on scroll */
            <AnimatedSection
              key={feature.title}
              animation="fade-up"
              delay={index * 100}
              threshold={0.1}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                highlight={feature.highlight}
              />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
