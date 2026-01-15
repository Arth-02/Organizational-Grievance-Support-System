import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  FolderKanban,
  MessageSquareWarning,
  Shield,
  Users,
  Building,
  Paperclip,
} from 'lucide-react';
import FeatureCard from '../components/FeatureCard';

/**
 * Feature data for the 6 core platform capabilities
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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/**
 * FeaturesSection - Showcase of platform capabilities with staggered animations
 */
const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section 
      id="features" 
      className="py-12 sm:py-16 md:py-24 bg-muted/30 relative overflow-hidden"
      aria-labelledby="features-heading"
    >
       {/* Background Decoration */}
       <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 20, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] transform translate-x-1/2" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.4, 0.3],
            x: [0, 30, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[10%] left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[80px] transform -translate-x-1/2" 
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16 max-w-3xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            id="features-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 tracking-tight"
          >
            Everything You Need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              Succeed
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg sm:text-xl text-muted-foreground"
          >
            Powerful features designed to streamline your organization&apos;s
            workflow and boost team productivity.
          </motion.p>
        </div>

        {/* Features Grid */}
        <motion.div 
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          role="list"
          aria-label="Platform features"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="h-full"
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                highlight={feature.highlight}
                className="h-full bg-background/50 backdrop-blur-sm border-border/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
