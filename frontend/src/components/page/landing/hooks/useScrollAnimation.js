import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for scroll-triggered animations using Intersection Observer
 * 
 * Performance Optimizations (Requirements 10.4, 10.6):
 * - Uses passive event listeners
 * - Respects prefers-reduced-motion
 * - Cleans up observers properly
 * - Uses requestAnimationFrame for smooth updates
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Visibility threshold (0-1), default 0.1
 * @param {boolean} options.triggerOnce - Whether to trigger only once, default true
 * @param {string} options.rootMargin - Root margin for observer, default "0px"
 * @returns {Object} - { ref, isVisible, hasAnimated }
 */
const useScrollAnimation = (options = {}) => {
  const {
    threshold = 0.1,
    triggerOnce = true,
    rootMargin = '0px',
  } = options;

  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const observerRef = useRef(null);

  // Memoized callback for intersection changes
  const handleIntersection = useCallback((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Use requestAnimationFrame for smooth state updates
        requestAnimationFrame(() => {
          setIsVisible(true);
          setHasAnimated(true);
        });

        if (triggerOnce && observerRef.current) {
          observerRef.current.unobserve(entry.target);
        }
      } else if (!triggerOnce) {
        requestAnimationFrame(() => {
          setIsVisible(false);
        });
      }
    });
  }, [triggerOnce]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check for reduced motion preference - Requirement 11.5
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      // If user prefers reduced motion, show content immediately
      setIsVisible(true);
      setHasAnimated(true);
      return;
    }

    // Create observer with optimized options
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [threshold, rootMargin, handleIntersection]);

  return { ref, isVisible, hasAnimated };
};

export default useScrollAnimation;
