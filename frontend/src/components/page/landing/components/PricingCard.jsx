import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

/**
 * PricingCard - Reusable component for displaying pricing tiers
 * 
 * Performance Optimizations (Requirements 10.4):
 * - Uses transform for hover effects (GPU-accelerated)
 * - Avoids layout-triggering properties
 * 
 * Requirements: 
 * - 5.3: Highlight the recommended/popular plan visually
 * - 5.4: Hover elevation effect on pricing cards
 * - 5.5: Include a CTA button for each tier
 * - 11.2: Keyboard navigation support
 * - 11.3: Proper ARIA labels and semantic HTML
 * 
 * @param {Object} props
 * @param {string} props.name - Tier name (e.g., "Starter", "Professional")
 * @param {string} props.description - Brief tier description
 * @param {number|null} props.price - Monthly price (null for "Contact Sales")
 * @param {string} props.period - Billing period label (e.g., "/month", "/year")
 * @param {string[]} props.features - List of features included in this tier
 * @param {boolean} [props.highlighted=false] - Whether this is the recommended plan
 * @param {string} props.ctaLabel - CTA button text
 * @param {string} props.ctaHref - CTA button link
 * @param {string} [props.className] - Additional CSS classes
 */
const PricingCard = ({
  name,
  description,
  price,
  period = '/month',
  features = [],
  highlighted = false,
  ctaLabel,
  ctaHref,
  className,
}) => {
  const isContactSales = price === null;

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-xl border bg-card',
        // Responsive padding
        'p-4 sm:p-5 md:p-6',
        // GPU-accelerated transitions using transform
        'transition-[transform,box-shadow,border-color] duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-xl',
        // Force GPU layer for smooth animations
        'transform-gpu backface-hidden',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
        highlighted
          ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]'
          : 'border-border hover:border-primary/50 hover:shadow-primary/5',
        className
      )}
      role="listitem"
      aria-labelledby={`pricing-${name.toLowerCase()}-title`}
    >
      {/* Popular badge for highlighted tier - Requirement 5.3 */}
      {highlighted && (
        <Badge 
          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3"
          aria-label="Most popular plan"
        >
          Most Popular
        </Badge>
      )}

      {/* Tier name and description */}
      <div className="mb-4">
        <h3 
          id={`pricing-${name.toLowerCase()}-title`}
          className="text-xl font-bold text-foreground"
        >
          {name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {/* Price display */}
      <div className="mb-6" aria-label={isContactSales ? 'Custom pricing' : `${price} dollars ${period.replace('/', 'per ')}`}>
        {isContactSales ? (
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-foreground">Custom</span>
          </div>
        ) : (
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-foreground" aria-hidden="true">
              ${price}
            </span>
            <span className="text-muted-foreground ml-1" aria-hidden="true">{period}</span>
          </div>
        )}
      </div>

      {/* CTA Button - Requirement 5.5 */}
      <Button
        asChild
        variant={highlighted ? 'default' : 'outline'}
        className={cn(
          'w-full mb-6',
          'focus:ring-2 focus:ring-primary focus:ring-offset-2',
          highlighted && 'shadow-md'
        )}
      >
        <Link
          to={ctaHref}
          aria-label={`${ctaLabel} for ${name} plan`}
        >
          {ctaLabel}
        </Link>
      </Button>

      {/* Features list */}
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground mb-3">
          {isContactSales ? 'Everything in Professional, plus:' : 'Includes:'}
        </p>
        <ul className="space-y-2.5" aria-label={`Features included in ${name} plan`}>
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check 
                className={cn(
                  'h-5 w-5 shrink-0 mt-0.5',
                  highlighted ? 'text-primary' : 'text-muted-foreground'
                )}
                aria-hidden="true"
              />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Gradient overlay for highlighted card - decorative */}
      {highlighted && (
        <div 
          className={cn(
            'absolute inset-0 rounded-xl opacity-50',
            'bg-gradient-to-br from-primary/5 via-transparent to-primary/5',
            'pointer-events-none'
          )}
          aria-hidden="true"
        />
      )}
    </article>
  );
};

export default PricingCard;
