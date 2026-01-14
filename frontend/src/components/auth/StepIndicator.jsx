import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StepIndicator - Progress indicator for multi-step registration
 * 
 * Features:
 * - Horizontal step display with numbers/dots
 * - Active step highlighting with primary color
 * - Completed state with checkmark for previous steps
 * - Connecting line between steps
 * 
 * Requirements: 3.3
 * 
 * @param {Object} props
 * @param {number} props.currentStep - Current active step (1-indexed)
 * @param {number} props.totalSteps - Total number of steps
 * @param {Array<{label: string, description?: string}>} props.steps - Step configuration
 * @param {string} props.className - Additional CSS classes
 */
const StepIndicator = ({
  currentStep,
  totalSteps,
  steps = [],
  className,
}) => {
  // Use provided steps or generate default ones
  const stepItems = steps.length > 0 
    ? steps 
    : Array.from({ length: totalSteps }, (_, i) => ({ label: `Step ${i + 1}` }));

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-center">
        {stepItems.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isLast = stepNumber === stepItems.length;

          return (
            <div key={stepNumber} className="flex items-center">
              {/* Step circle with number or checkmark */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                    'text-sm font-semibold',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isActive && 'border-primary text-primary bg-primary/10',
                    !isCompleted && !isActive && 'border-muted-foreground/30 text-muted-foreground bg-background'
                  )}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Step ${stepNumber}: ${step.label}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>
                
                {/* Step label */}
                <div className="mt-2 text-center">
                  <span
                    className={cn(
                      'text-xs font-medium transition-colors duration-300',
                      isActive && 'text-primary',
                      isCompleted && 'text-foreground',
                      !isCompleted && !isActive && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <p
                      className={cn(
                        'text-xs mt-0.5 transition-colors duration-300',
                        isActive ? 'text-muted-foreground' : 'text-muted-foreground/70'
                      )}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connecting line between steps */}
              {!isLast && (
                <div
                  className={cn(
                    'w-12 sm:w-16 md:w-24 h-0.5 mx-2 transition-colors duration-300',
                    isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
