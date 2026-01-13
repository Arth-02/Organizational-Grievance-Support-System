import { cn } from '@/lib/utils';
import useScrollAnimation from '../hooks/useScrollAnimation';

/**
 * Animation variants for different entrance effects
 * Using transform and opacity only for GPU-accelerated 60fps animations
 * Requirement 10.4: Maintain 60fps animation performance
 */
const animationVariants = {
  'fade-up': {
    hidden: 'opacity-0 translate-y-8',
    visible: 'opacity-100 translate-y-0',
  },
  'fade-down': {
    hidden: 'opacity-0 -translate-y-8',
    visible: 'opacity-100 translate-y-0',
  },
  'fade-left': {
    hidden: 'opacity-0 translate-x-8',
    visible: 'opacity-100 translate-x-0',
  },
  'fade-right': {
    hidden: 'opacity-0 -translate-x-8',
    visible: 'opacity-100 translate-x-0',
  },
  'fade-in': {
    hidden: 'opacity-0',
    visible: 'opacity-100',
  },
  'scale-up': {
    hidden: 'opacity-0 scale-95',
    visible: 'opacity-100 scale-100',
  },
  'scale-down': {
    hidden: 'opacity-0 scale-105',
    visible: 'opacity-100 scale-100',
  },
};

/**
 * Check if user prefers reduced motion
 * Requirement 11.5: Respect prefers-reduced-motion settings
 */
const getPrefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * AnimatedSection - A wrapper component for scroll-triggered animations
 * 
 * Performance Optimizations (Requirements 10.4, 10.6):
 * - Uses GPU-accelerated transforms (translateX, translateY, scale)
 * - Uses opacity for fade effects (composited on GPU)
 * - Applies will-change during animation, removes after completion
 * - Respects prefers-reduced-motion for accessibility
 * 
 * Accessibility Features (Requirement 11.5):
 * - Respects prefers-reduced-motion media query
 * - When reduced motion is preferred, content is shown immediately without animation
 * - Animations are purely decorative and don't affect content accessibility
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to animate
 * @param {string} props.animation - Animation variant (fade-up, fade-down, fade-left, fade-right, fade-in, scale-up, scale-down)
 * @param {number} props.delay - Animation delay in milliseconds
 * @param {number} props.duration - Animation duration in milliseconds
 * @param {number} props.threshold - Visibility threshold (0-1)
 * @param {boolean} props.triggerOnce - Whether to trigger only once
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.as - HTML element to render (default: 'div')
 */
const AnimatedSection = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 500,
  threshold = 0.1,
  triggerOnce = true,
  className = '',
  as: Component = 'div',
  ...props
}) => {
  const { ref, isVisible, hasAnimated } = useScrollAnimation({
    threshold,
    triggerOnce,
  });

  const variant = animationVariants[animation] || animationVariants['fade-up'];
  const prefersReducedMotion = getPrefersReducedMotion();

  // If user prefers reduced motion, show content immediately
  if (prefersReducedMotion) {
    return (
      <Component className={className} {...props}>
        {children}
      </Component>
    );
  }

  // GPU-accelerated animation styles
  const animationStyles = {
    transitionProperty: 'transform, opacity',
    transitionDuration: `${duration}ms`,
    transitionDelay: `${delay}ms`,
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Apply will-change only during animation for performance
    willChange: !hasAnimated ? 'transform, opacity' : 'auto',
    // Force GPU acceleration
    transform: isVisible ? 'translateZ(0)' : undefined,
  };

  return (
    <Component
      ref={ref}
      className={cn(
        // GPU acceleration hint
        'backface-hidden',
        isVisible ? variant.visible : variant.hidden,
        className
      )}
      style={animationStyles}
      {...props}
    >
      {children}
    </Component>
  );
};

export default AnimatedSection;
