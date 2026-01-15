import { motion } from 'framer-motion';
import TestimonialCard from '../components/TestimonialCard';

/**
 * Testimonial data highlighting different use cases
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

/**
 * TestimonialsSection - Customer testimonials showcase
 */
const TestimonialsSection = () => {
  return (
    <section 
      id="testimonials" 
      className="py-12 sm:py-16 md:py-24 bg-background relative overflow-hidden"
      aria-labelledby="testimonials-heading"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/2" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3" 
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            id="testimonials-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6"
          >
            Trusted by{' '}
            <span className="text-primary">Industry Leaders</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            See how organizations like yours are transforming their workflows
            and improving team satisfaction.
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-8"
          role="list"
          aria-label="Customer testimonials"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="h-full"
            >
              <TestimonialCard
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                company={testimonial.company}
                avatar={testimonial.avatar}
                rating={testimonial.rating}
                className="h-full bg-muted/20 border-border/50 hover:bg-muted/40 transition-colors"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
