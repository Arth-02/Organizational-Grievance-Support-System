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
  const stepItems = steps.length > 0 
    ? steps 
    : Array.from({ length: totalSteps }, (_, i) => ({ label: `Step ${i + 1}` }));

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-start justify-between relative">
        {/* Connecting lines container - aligned to center of steps */}
        <div className="absolute top-5 left-5 right-5 h-0.5 -z-10">
          {/* Background Track */}
          <div className="absolute top-0 left-0 w-full h-full bg-muted-foreground/20" />
          
          {/* Active Progress */}
          <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>

        {stepItems.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div key={stepNumber} className="flex flex-col items-center z-0 group cursor-default">
              {/* Step Circle */}
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 bg-background',
                  'text-sm font-semibold',
                  isCompleted && 'bg-primary border-primary text-primary-foreground',
                  isActive && 'border-primary text-primary ring-4 ring-primary/10',
                  !isCompleted && !isActive && 'border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>
              
              {/* Labels */}
              <div className="mt-2 text-center max-w-[80px] sm:max-w-none">
                <span
                  className={cn(
                    'block text-xs font-medium transition-colors duration-300',
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
                      'hidden sm:block text-[10px] mt-0.5 transition-colors duration-300',
                      isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'
                    )}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
