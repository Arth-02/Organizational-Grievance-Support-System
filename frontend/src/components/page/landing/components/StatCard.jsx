import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import useScrollAnimation from '../hooks/useScrollAnimation';

/**
 * StatCard - Component for displaying animated statistics
 * 
 * Performance Optimizations (Requirements 10.4, 10.6):
 * - Uses requestAnimationFrame for smooth 60fps counter animation
 * - Uses tabular-nums for stable number width (prevents layout shifts)
 * - Cleans up animation frame on unmount
 * - Respects prefers-reduced-motion
 * 
 * Requirements: 
 * - 7.3 - Counting-up animation when visible, suffix formatting
 * - 11.3: Proper ARIA labels and semantic HTML
 * - 11.5: Respect prefers-reduced-motion settings
 * 
 * @param {Object} props
 * @param {number} props.value - Target number value
 * @param {string} [props.suffix] - Suffix to display (e.g., "+", "%", "K+")
 * @param {string} props.label - Description label for the stat
 * @param {number} [props.duration] - Animation duration in ms (default: 2000)
 * @param {string} [props.className] - Additional CSS classes
 */
const StatCard = ({ value, suffix = '', label, duration = 2000, className }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3, triggerOnce: true });
  const hasAnimated = useRef(false);
  const animationFrameRef = useRef(null);

  // Format the full value for screen readers
  const getAccessibleValue = useCallback(() => {
    let formattedValue = value.toLocaleString();
    if (suffix === 'K+') {
      formattedValue = `${value} thousand plus`;
    } else if (suffix === '%') {
      formattedValue = `${value} percent`;
    } else if (suffix === '+') {
      formattedValue = `${value} plus`;
    }
    return `${formattedValue} ${label}`;
  }, [value, suffix, label]);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    
    // Check for reduced motion preference - Requirement 11.5
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      hasAnimated.current = true;
      return;
    }

    hasAnimated.current = true;
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth deceleration (easeOutQuart)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(startValue + (value - startValue) * easeOutQuart);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup animation frame on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible, value, duration]);

  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        // Responsive padding - smaller on mobile
        'p-4 sm:p-5 md:p-6',
        'bg-card/50 backdrop-blur-sm rounded-xl border border-border/50',
        'hover:border-primary/30 hover:bg-card/80',
        'transition-all duration-300',
        // GPU acceleration for hover effects
        'transform-gpu',
        className
      )}
      role="listitem"
      aria-label={getAccessibleValue()}
    >
      <div 
        className={cn(
          // Responsive text sizing
          'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-1 sm:mb-2',
          // Use tabular-nums to prevent layout shifts during counting
          'tabular-nums'
        )}
        aria-hidden="true"
      >
        {displayValue.toLocaleString()}
        <span className="text-primary/80">{suffix}</span>
      </div>
      <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium" aria-hidden="true">{label}</p>
    </div>
  );
};

export default StatCard;
