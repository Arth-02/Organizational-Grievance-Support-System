import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  FolderKanban,
  Rocket,
} from 'lucide-react';

/**
 * Steps data for the "How It Works" workflow
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
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

const lineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { 
    scaleX: 1, 
    opacity: 1, 
    transition: { duration: 1, delay: 0.5, ease: "easeInOut" } 
  },
};

/**
 * StepCard - Individual step display component
 */
const StepCard = ({ step, isLast }) => {
  const Icon = step.icon;

  return (
    <motion.article 
      variants={itemVariants}
      className="relative flex flex-col items-center text-center group"
      role="listitem"
      aria-labelledby={`step-${step.number}-title`}
    >
      {/* Step Number Badge */}
      <motion.div 
        whileHover={{ scale: 1.1 }}
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
      >
        <span 
          className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-primary-foreground bg-primary rounded-full shadow-lg ring-4 ring-background"
          aria-label={`Step ${step.number}`}
        >
          {step.number}
        </span>
      </motion.div>

      {/* Icon Container */}
      <div 
        className="w-20 h-20 mb-4 mt-4 rounded-2xl bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-105 group-hover:shadow-lg"
        aria-hidden="true"
      >
        <Icon className="w-10 h-10 text-primary transition-transform duration-300 group-hover:-rotate-6" />
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

      {/* Connector Line */}
      {!isLast && (
        <div 
          className="hidden lg:block absolute top-14 left-[60%] w-[80%] h-0.5 pointer-events-none z-0"
          aria-hidden="true"
        >
           <motion.div 
             className="w-full h-full bg-gradient-to-r from-primary/30 to-primary/10 origin-left"
             variants={lineVariants}
           />
           <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-primary/30 rotate-45" 
           />
        </div>
      )}
    </motion.article>
  );
};

/**
 * HowItWorksSection - Step-by-step workflow guide
 */
const HowItWorksSection = () => {
  return (
    <section 
      id="how-it-works" 
      className="py-12 sm:py-16 md:py-20 bg-background overflow-hidden relative"
      aria-labelledby="how-it-works-heading"
    >
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 45, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-[20%] right-[20%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[80px]" 
        />
      </div>
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            id="how-it-works-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
          >
            How It <span className="text-primary">Works</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Get your organization up and running in four simple steps. 
            Our intuitive platform makes onboarding a breeze.
          </motion.p>
        </div>

        {/* Steps Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 relative"
          role="list"
          aria-label="Getting started steps"
        >
          {steps.map((step, index) => (
             <StepCard 
               key={step.number} 
               step={step} 
               isLast={index === steps.length - 1} 
             />
          ))}
        </motion.div>

        {/* Mobile Flow Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
          className="lg:hidden flex justify-center mt-8" 
          aria-hidden="true"
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>Scroll through steps</span>
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className="w-1.5 h-1.5 rounded-full bg-primary/40"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
