import { motion } from 'framer-motion';
import { Building2, CheckCircle2, MessageSquare, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
};

/**
 * StatsSection - Displays platform statistics with animated counters
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
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" 
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            id="stats-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4"
          >
            Trusted by Organizations Worldwide
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Join thousands of teams who have transformed their workflow with our platform
          </motion.p>
        </div>

        {/* Stats grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto"
          role="list"
          aria-label="Platform statistics"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
            >
              <StatCard
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
