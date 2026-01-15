import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "../ui/button";
import { useState, useEffect, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressDetailsSchema, organizationDetailsSchema } from "@/validators/users";
import { useCreateOrganizationMutation } from "@/services/organization.service";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, Building2, Mail, Phone, Globe, MapPin, Check, UploadCloud, Image as ImageIcon, ArrowRight, Trash2 } from "lucide-react";
import AuthLayout from "./AuthLayout";
import StepIndicator from "./StepIndicator";
import AnimatedSection from "@/components/page/landing/components/AnimatedSection";
import { useDropzone } from "react-dropzone";
import { z } from "zod";
import { cn } from "@/lib/utils";

/**
 * Check if user prefers reduced motion
 */
const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * Plan data for display during registration
 */
const PLAN_DATA = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ['Up to 10 users', '3 active projects', '1GB storage'],
    isFree: true,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For growing organizations',
    monthlyPrice: 29,
    annualPrice: 290,
    features: ['Up to 50 users', 'Unlimited projects', '10GB storage'],
    isFree: false,
    trialDays: 14,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: null,
    annualPrice: null,
    features: ['Unlimited users', 'Unlimited projects', 'Unlimited storage'],
    isFree: false,
    isCustom: true,
  },
};

// Define schemas for each step
const organizationInfoSchema = organizationDetailsSchema.pick({
  name: true,
  description: true,
  website: true,
});

const contactDetailsSchema = organizationDetailsSchema.pick({
  email: true,
  phone: true,
}).extend({
  logo: z.any().optional(), 
});

const RegisterOrg = () => {
  const [createOrganization, { isLoading }] = useCreateOrganizationMutation();
  const [step, setStep] = useState(1);
  const [animationDirection, setAnimationDirection] = useState("forward");
  const prefersReducedMotion = usePrefersReducedMotion();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Accumulated data from all steps
  const [formData, setFormData] = useState({});

  // Plan state
  const [selectedPlanId, setSelectedPlanId] = useState('starter');
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Initialize plan from URL
  useEffect(() => {
    const planParam = searchParams.get('plan');
    const billingParam = searchParams.get('billing');

    if (planParam && PLAN_DATA[planParam]) {
      setSelectedPlanId(planParam);
    }
    if (billingParam === 'annual' || billingParam === 'monthly') {
      setBillingCycle(billingParam);
    }
  }, [searchParams]);


  const steps = [
    { label: "Organization", description: "Details" },
    { label: "Contact", description: "Info" },
    { label: "Address", description: "Location" },
    { label: "Plan", description: "Review" },
  ];

  // Handler to move to next step
  const handleNext = (stepData) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
    setAnimationDirection("forward");
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setAnimationDirection("backward");
    setStep((prev) => prev - 1);
  };

  const handleFinalSubmit = async () => {
    try {
      // eslint-disable-next-line no-unused-vars
      const { terms, ...cleanData } = formData;
      
      const payload = new FormData();
      
      // Append gathered form data
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] !== undefined && cleanData[key] !== null) {
            // Append logo if it's a file
            if (key === 'logo' && cleanData[key] instanceof File) {
               payload.append('logo', cleanData[key]);
            } else if (key !== 'logo') {
               // Append other fields
               payload.append(key, cleanData[key]);
            }
        }
      });
      
      // Append plan details
      payload.append('selectedPlan', selectedPlanId);
      payload.append('billingCycle', billingCycle);
      
      const response = await createOrganization(payload).unwrap();
      if (response) {
        toast.success(`Registration successful! Your organization is pending approval.`);
        navigate('/');
      } else {
        toast.error("Something went wrong! Please try again later.");
      }
    } catch (error) {
      toast.error(error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <AuthLayout
      illustration="/images/register-org.png"
      illustrationAlt="Organization registration illustration"
      showBackLink={true}
      className="max-w-xl"
    >
      {/* Heading */}
      <AnimatedSection animation="fade-up" delay={0}>
        <h1 className="text-center text-3xl font-bold text-foreground mb-2">
          Register Organization
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          Create your organization account to get started
        </p>
      </AnimatedSection>

      {/* Step Indicator */}
      <AnimatedSection animation="fade-up" delay={100}>
        <StepIndicator
          currentStep={step}
          totalSteps={4}
          steps={steps}
          className="mb-8"
        />
      </AnimatedSection>

      {/* Steps content */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <OrganizationInfoForm 
            defaultValues={formData}
            onNext={handleNext}
            animationDirection={animationDirection}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}
        
        {step === 2 && (
          <ContactDetailsForm 
            defaultValues={formData}
            onNext={handleNext}
            onBack={handleBack}
            animationDirection={animationDirection}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}

        {step === 3 && (
          <AddressDetailsForm 
            defaultValues={formData}
            onNext={handleNext}
            onBack={handleBack}
            animationDirection={animationDirection}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}

        {step === 4 && (
          <PlanSelectionStep
            selectedPlanId={selectedPlanId}
            setSelectedPlanId={setSelectedPlanId}
            billingCycle={billingCycle}
            setBillingCycle={setBillingCycle}
            onBack={handleBack}
            onSubmit={handleFinalSubmit}
            isLoading={isLoading}
            animationDirection={animationDirection}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}
      </div>

      {/* Footer links */}
      {step === 1 && (
         <AnimatedSection animation="fade-up" delay={600}>
            <div className="mt-8 pt-6 border-t border-border">
                <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                    to="/login"
                    className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                    Sign In
                </Link>
                </p>
            </div>
         </AnimatedSection>
      )}
    </AuthLayout>
  );
};

/* --- Step 1: Organization Info --- */
const OrganizationInfoForm = ({ defaultValues, onNext, animationDirection, prefersReducedMotion }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(organizationInfoSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className={`space-y-5 ${!prefersReducedMotion ? `transition-all duration-300 ease-in-out ${animationDirection === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"}` : ''}`}>
        
        <AnimatedSection animation="fade-up" delay={200}>
        <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-semibold text-foreground">Company Name</label>
            <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Building2 size={18} className={errors.name ? "text-red-500" : "text-muted-foreground"} />
            </div>
            <input
                type="text" id="name"
                className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.name ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="Enter your company name"
                {...register("name")}
            />
            </div>
            {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
        </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={250}>
        <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-semibold text-foreground">Description</label>
            <textarea
            id="description" rows={3}
            className={`w-full px-4 py-3 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.description ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
            placeholder="What does your company do?"
            {...register("description")}
            />
            {errors.description && <span className="text-red-500 text-xs mt-1 block">{errors.description.message}</span>}
        </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={300}>
        <div className="space-y-2">
            <label htmlFor="website" className="block text-sm font-semibold text-foreground">Website <span className="text-muted-foreground font-normal">(optional)</span></label>
            <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Globe size={18} className="text-muted-foreground" />
            </div>
            <input
                type="text" id="website"
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:border-muted-foreground/50 focus:border-primary"
                placeholder="https://yourcompany.com"
                {...register("website")}
            />
            </div>
        </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={400}>
            <Button type="submit" className="w-full h-11 mt-2">
                Continue <ArrowRight size={16} className="ml-2" />
            </Button>
        </AnimatedSection>
    </form>
  );
};

/* --- Step 2: Contact Details --- */
const ContactDetailsForm = ({ defaultValues, onNext, onBack, animationDirection, prefersReducedMotion }) => {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(contactDetailsSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className={`space-y-5 ${!prefersReducedMotion ? `transition-all duration-300 ease-in-out ${animationDirection === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"}` : ''}`}>
      {/* Changed grid to stack email and phone vertically */}
      <div className="space-y-4">
        <AnimatedSection animation="fade-up" delay={200}>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-foreground">Email</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail size={18} className={errors.email ? "text-red-500" : "text-muted-foreground"} />
              </div>
              <input
                type="email" id="email"
                className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.email ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="you@company.com"
                {...register("email")}
              />
            </div>
            {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email.message}</span>}
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={250}>
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-semibold text-foreground">Phone</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Phone size={18} className={errors.phone ? "text-red-500" : "text-muted-foreground"} />
              </div>
              <input
                type="text" id="phone"
                className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.phone ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="1234567890"
                {...register("phone")}
              />
            </div>
            {errors.phone && <span className="text-red-500 text-xs mt-1 block">{errors.phone.message}</span>}
          </div>
        </AnimatedSection>
      </div>

      <AnimatedSection animation="fade-up" delay={300}>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">Company Logo <span className="text-muted-foreground font-normal">(optional)</span></label>
          <Controller
            control={control}
            name="logo"
            render={({ field: { onChange, value, ...field } }) => (
              <LogoDropzone onChange={onChange} value={value} {...field} />
            )}
          />
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={400}>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-11">Back</Button>
            <Button type="submit" className="flex-1 h-11">Continue <ArrowRight size={16} className="ml-2" /></Button>
          </div>
      </AnimatedSection>
    </form>
  );
};


/* --- Step 3: Address Details --- */
const AddressDetailsForm = ({ defaultValues, onNext, onBack, animationDirection, prefersReducedMotion }) => {
    const { register, handleSubmit, formState: { errors } } = useForm({
      resolver: zodResolver(addressDetailsSchema),
      defaultValues,
    });
  
    return (
      <form onSubmit={handleSubmit(onNext)} className={`space-y-5 ${!prefersReducedMotion ? `transition-all duration-300 ease-in-out ${animationDirection === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"}` : ''}`}>
        <AnimatedSection animation="fade-up" delay={200}>
          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm font-semibold text-foreground">Address</label>
            <div className="relative">
              <div className="absolute left-3 top-3 pointer-events-none">
                <MapPin size={18} className={errors.address ? "text-red-500" : "text-muted-foreground"} />
              </div>
              <textarea
                id="address" rows={2}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.address ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="Street address, P.O. Box"
                {...register("address")}
              />
            </div>
            {errors.address && <span className="text-red-500 text-xs mt-1 block">{errors.address.message}</span>}
          </div>
        </AnimatedSection>
  
        <div className="grid grid-cols-2 gap-4">
          <AnimatedSection animation="fade-up" delay={250}>
            <div className="space-y-2">
              <label htmlFor="city" className="block text-sm font-semibold text-foreground">City</label>
              <input
                type="text" id="city"
                className={`w-full h-11 px-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.city ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="New York" {...register("city")}
              />
              {errors.city && <span className="text-red-500 text-xs mt-1 block">{errors.city.message}</span>}
            </div>
          </AnimatedSection>
  
          <AnimatedSection animation="fade-up" delay={300}>
            <div className="space-y-2">
              <label htmlFor="state" className="block text-sm font-semibold text-foreground">State</label>
              <input
                type="text" id="state"
                className={`w-full h-11 px-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.state ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="NY" {...register("state")}
              />
             {errors.state && <span className="text-red-500 text-xs mt-1 block">{errors.state.message}</span>}
            </div>
          </AnimatedSection>
        </div>
  
        <div className="grid grid-cols-2 gap-4">
          <AnimatedSection animation="fade-up" delay={350}>
            <div className="space-y-2">
              <label htmlFor="country" className="block text-sm font-semibold text-foreground">Country</label>
              <input
                type="text" id="country"
                className={`w-full h-11 px-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.country ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="USA" {...register("country")}
              />
              {errors.country && <span className="text-red-500 text-xs mt-1 block">{errors.country.message}</span>}
            </div>
          </AnimatedSection>
  
          <AnimatedSection animation="fade-up" delay={400}>
            <div className="space-y-2">
              <label htmlFor="pincode" className="block text-sm font-semibold text-foreground">Pincode</label>
              <input
                type="text" id="pincode"
                className={`w-full h-11 px-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.pincode ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="10001" {...register("pincode")}
              />
              {errors.pincode && <span className="text-red-500 text-xs mt-1 block">{errors.pincode.message}</span>}
            </div>
          </AnimatedSection>
        </div>
  
        <AnimatedSection animation="fade-up" delay={450}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox" id="terms"
                className={`h-4 w-4 shrink-0 rounded border transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.terms ? "border-red-500" : "border-muted-foreground/40 checked:bg-primary checked:border-primary"}`}
                {...register("terms")}
              />
              <label htmlFor="terms" className="text-sm text-foreground cursor-pointer select-none">
                I agree to the <Link to="/terms" className="font-semibold text-primary hover:underline">Terms of Service</Link> and <Link to="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>
              </label>
            </div>
            {errors.terms && <span className="text-red-500 text-xs ml-1">{errors.terms.message}</span>}
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={500}>
            <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-11">Back</Button>
                <Button type="submit" className="flex-1 h-11">Next Step <ArrowRight size={16} className="ml-2" /></Button>
            </div>
        </AnimatedSection>
      </form>
    );
  };

/* --- Step 4: Plan Selection --- */
const PlanSelectionStep = ({ 
  selectedPlanId, setSelectedPlanId, 
  billingCycle, setBillingCycle, 
  onBack, onSubmit, isLoading, 
  animationDirection, prefersReducedMotion 
}) => {
  return (
    <div className={`space-y-6 ${!prefersReducedMotion ? `transition-all duration-300 ease-in-out ${animationDirection === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"}` : ''}`}>
      
      {/* Billing Switch */}
      <AnimatedSection animation="fade-up" delay={200}>
        <div className="flex items-center justify-center gap-3 bg-muted/40 p-1.5 rounded-lg w-fit mx-auto border border-border">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-medium transition-all duration-200",
              billingCycle === 'monthly' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-medium transition-all duration-200",
              billingCycle === 'annual' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Yearly
          </button>
        </div>
      </AnimatedSection>

      {/* Plan Cards */}
      <div className="space-y-3">
        {Object.values(PLAN_DATA).map((plan, idx) => (
          <AnimatedSection key={plan.id} animation="fade-up" delay={250 + (idx * 50)}>
            <div 
              onClick={() => setSelectedPlanId(plan.id)}
              className={cn(
                "relative group cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:border-primary/50",
                selectedPlanId === plan.id 
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                  : "border-border bg-card hover:bg-muted/30"
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={cn("font-bold text-base", selectedPlanId === plan.id ? "text-primary" : "text-foreground")}>
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
                  
                  {/* Features for selected plan */}
                  {selectedPlanId === plan.id && (
                     <div className="mt-3 flex flex-wrap gap-2">
                        {plan.features.slice(0, 3).map((feature, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-background border border-primary/20 text-muted-foreground">
                            {feature}
                          </span>
                        ))}
                     </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="font-bold text-lg">
                    {plan.isCustom ? (
                      "Custom"
                    ) : plan.isFree ? (
                      "Free"
                    ) : (
                      <span className="flex flex-col items-end">
                        <span>${billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice}</span>
                        <span className="text-xs text-muted-foreground font-normal">/{billingCycle === 'annual' ? 'yr' : 'mo'}</span>
                      </span>
                    )}
                  </div>
                  {selectedPlanId === plan.id && (
                    <div className="mt-2 flex justify-end">
                        <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm">
                            <Check size={14} strokeWidth={3} />
                        </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>

      {/* Actions */}
      <AnimatedSection animation="fade-up" delay={500}>
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} disabled={isLoading} className="flex-1 h-11">
            Back
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isLoading} className="flex-1 h-11">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </span>
            ) : (
              "Complete Registration"
            )}
          </Button>
        </div>
      </AnimatedSection>
    </div>
  );
};

const LogoDropzone = ({ onChange, value, isLoading }) => {
    const onDrop = useCallback((acceptedFiles) => {
      if (acceptedFiles?.length > 0) onChange(acceptedFiles[0]);
    }, [onChange]);
  
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
      onDrop,
      accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp'] },
      maxFiles: 1,
      multiple: false,
      disabled: isLoading
    });
  
    const removeFile = (e) => {
      e.stopPropagation();
      onChange(null);
    };
  
    const previewUrl = value ? (value instanceof File ? URL.createObjectURL(value) : value) : null;
    useEffect(() => () => { if (previewUrl && value instanceof File) URL.revokeObjectURL(previewUrl); }, [previewUrl, value]);
  
    return (
      <div className="w-full">
        {!value ? (
           <div 
             {...getRootProps()} 
             className={cn(
                "relative border-2 border-border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 group",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/20",
                isLoading && "opacity-50 cursor-not-allowed"
             )}
           >
             <input {...getInputProps()} id="logo-upload" />
             <div className="flex flex-col items-center gap-3">
               <div className={cn(
                 "p-4 rounded-full transition-colors duration-300", 
                 isDragActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
               )}>
                 <UploadCloud size={24} />
               </div>
               <div>
                  <p className="text-sm font-medium text-foreground">
                    <span className="text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    SVG, PNG, JPG or GIF (max. 5MB)
                  </p>
               </div>
             </div>
           </div>
        ) : (
            <div className="relative rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between group overflow-hidden">
                <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                        {typeof value === 'string' || value instanceof File ? (
                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <p className="truncate text-sm font-medium text-foreground">
                            {value instanceof File ? value.name : "Logo Uploaded"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {value instanceof File ? (value.size / 1024).toFixed(1) + " KB" : "Ready to upload"}
                        </p>
                    </div>
                </div>
                
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/10 transition-colors"
                    onClick={removeFile}
                    disabled={isLoading}
                    title="Remove logo"
                >
                    <Trash2 size={16} />
                </Button>
            </div>
        )}
      </div>
    );
  };

export default RegisterOrg;
