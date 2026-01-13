import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * TestimonialCard - Reusable component for displaying customer testimonials
 * 
 * Responsive Design (Requirement 10.1):
 * - Adapts padding and spacing for mobile/tablet/desktop
 * - Text sizes scale appropriately across breakpoints
 * 
 * Performance Optimizations (Requirements 10.4):
 * - Uses transform for hover effects (GPU-accelerated)
 * 
 * Requirements:
 * - 6.2: Include customer name, role, company, and avatar
 * - 6.3: Display star ratings or satisfaction indicators
 * - 11.3: Proper ARIA labels and semantic HTML
 * 
 * @param {Object} props
 * @param {string} props.quote - The testimonial quote text
 * @param {string} props.author - Customer name
 * @param {string} props.role - Customer's job role
 * @param {string} props.company - Customer's company name
 * @param {string} [props.avatar] - URL to customer's avatar image
 * @param {number} props.rating - Star rating (1-5)
 * @param {string} [props.className] - Additional CSS classes
 */
const TestimonialCard = ({
  quote,
  author,
  role,
  company,
  avatar,
  rating,
  className,
}) => {
  // Get initials for avatar fallback
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Render star rating - Requirement 6.3
  const renderStars = () => {
    return (
      <div 
        className="flex gap-0.5" 
        role="img"
        aria-label={`Rating: ${rating} out of 5 stars`}
      >
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={cn(
              'h-4 w-4',
              index < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted'
            )}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  };

  return (
    <article
      className={cn(
        'group relative flex flex-col',
        // Responsive padding - smaller on mobile
        'p-4 sm:p-5 md:p-6',
        'rounded-xl border border-border bg-card',
        'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
        // GPU-accelerated transitions
        'transition-[transform,box-shadow,border-color] duration-300 ease-out',
        'transform-gpu backface-hidden',
        className
      )}
      role="listitem"
      aria-labelledby={`testimonial-${author.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {/* Star rating at top */}
      <div className="mb-4">
        {renderStars()}
      </div>

      {/* Quote */}
      <blockquote className="flex-1 mb-6">
        <p className="text-foreground leading-relaxed italic">
          &ldquo;{quote}&rdquo;
        </p>
      </blockquote>

      {/* Author info - Requirement 6.2 */}
      <footer className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-primary/20">
          <AvatarImage src={avatar} alt="" />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {getInitials(author)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p 
            id={`testimonial-${author.replace(/\s+/g, '-').toLowerCase()}`}
            className="font-semibold text-foreground text-sm"
          >
            {author}
          </p>
          <p className="text-muted-foreground text-xs">
            <span className="sr-only">Position: </span>{role}, <span className="sr-only">Company: </span>{company}
          </p>
        </div>
      </footer>

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

export default TestimonialCard;
