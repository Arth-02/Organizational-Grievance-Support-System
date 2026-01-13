import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * FeatureCard - Reusable component for displaying individual features
 * 
 * Performance Optimizations (Requirements 10.4):
 * - Uses transform for hover effects (GPU-accelerated)
 * - Avoids layout-triggering properties
 * 
 * Requirements: 
 * - 3.3: Hover animation effects and expanded description
 * - 11.3: Proper ARIA labels and semantic HTML
 * 
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {string} props.title - Feature title
 * @param {string} props.description - Feature description
 * @param {string} [props.highlight] - Optional highlight badge text (e.g., "Popular")
 * @param {string} [props.className] - Additional CSS classes
 */
const FeatureCard = ({ icon: Icon, title, description, highlight, className }) => {
  return (
    <article
      className={cn(
        'group relative rounded-xl border border-border bg-card',
        // Responsive padding
        'p-4 sm:p-5 md:p-6',
        'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
        // GPU-accelerated transitions using transform
        'transition-[transform,box-shadow,border-color] duration-300 ease-out',
        'hover:-translate-y-1',
        // Force GPU layer for smooth animations
        'transform-gpu backface-hidden',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
        className
      )}
      role="listitem"
    >
      {/* Highlight badge */}
      {highlight && (
        <Badge 
          className="absolute -top-2.5 right-4 bg-primary text-primary-foreground"
          aria-label={`${highlight} feature`}
        >
          {highlight}
        </Badge>
      )}

      {/* Icon container with hover effect */}
      <div 
        className={cn(
          'mb-4 inline-flex items-center justify-center',
          'w-12 h-12 rounded-lg',
          'bg-primary/10 text-primary',
          'group-hover:bg-primary group-hover:text-primary-foreground',
          'transition-colors duration-300'
        )}
        aria-hidden="true"
      >
        {Icon && <Icon className="h-6 w-6" />}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-2 text-foreground">
        {title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>

      {/* Subtle gradient overlay on hover - decorative */}
      <div 
        className={cn(
          'absolute inset-0 rounded-xl opacity-0',
          'bg-gradient-to-br from-primary/5 to-transparent',
          'group-hover:opacity-100 transition-opacity duration-300',
          'pointer-events-none'
        )}
        aria-hidden="true"
      />
    </article>
  );
};

export default FeatureCard;
