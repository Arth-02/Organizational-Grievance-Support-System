import AnimatedSection from '../components/AnimatedSection';
import TestimonialCard from '../components/TestimonialCard';

/**
 * Testimonial data highlighting different use cases
 * Requirements: 6.1, 6.5 - Display at least 3 testimonials highlighting different use cases
 */
const testimonials = [
  {
    id: '1',
    quote:
      'This platform transformed how we handle employee grievances. Resolution time dropped by 60% and our team feels more heard than ever.',
    author: 'Sarah Johnson',
    role: 'HR Director',
    company: 'TechCorp Inc.',
    rating: 5,
  },
  {
    id: '2',
    quote:
      'The Kanban boards are incredibly intuitive. Our project delivery improved significantly and the real-time collaboration keeps everyone aligned.',
    author: 'Michael Chen',
    role: 'Project Manager',
    company: 'InnovateLabs',
    rating: 5,
  },
  {
    id: '3',
    quote:
      'Role-based permissions gave us the flexibility we needed without compromising security. Setup was a breeze and support has been excellent.',
    author: 'Emily Rodriguez',
    role: 'IT Manager',
    company: 'GlobalServices Ltd.',
    rating: 5,
  },
];

/**
 * TestimonialsSection - Customer testimonials showcase
 *
 * Responsive Design (Requirement 10.1):
 * - Mobile (320px-767px): Single column
 * - Tablet (768px-1023px): 2-column grid
 * - Desktop (1024px+): 3-column grid
 *
 * Requirements:
 * - 6.1: Display at least 3 customer testimonials
 * - 6.4: Implement a carousel or grid layout
 * - 6.5: Highlight different use cases (project management, grievance resolution, team collaboration)
 * - 11.1: WCAG 2.1 AA accessibility standards
 * - 11.3: Proper ARIA labels and semantic HTML
 */
const TestimonialsSection = () => {
  return (
    <section 
      id="testimonials" 
      className="py-12 sm:py-16 md:py-20 bg-background"
      aria-labelledby="testimonials-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <AnimatedSection animation="fade-up" className="text-center mb-10 sm:mb-12 md:mb-16">
          <h2 
            id="testimonials-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
          >
            Trusted by{' '}
            <span className="text-primary">Industry Leaders</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            See how organizations like yours are transforming their workflows
            and improving team satisfaction.
          </p>
        </AnimatedSection>

        {/* Testimonials Grid - Requirement 6.4: Grid layout */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
          role="list"
          aria-label="Customer testimonials"
        >
          {testimonials.map((testimonial, index) => (
            <AnimatedSection
              key={testimonial.id}
              animation="fade-up"
              delay={index * 100}
              threshold={0.1}
            >
              <TestimonialCard
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                company={testimonial.company}
                avatar={testimonial.avatar}
                rating={testimonial.rating}
              />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
