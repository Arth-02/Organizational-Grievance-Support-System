import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressDetailsSchema, organizationDetailsSchema } from "@/validators/users";
import { useCreateOrganizationMutation } from "@/services/organization.service";
import { Link } from "react-router-dom";
import { Loader2, Building2, Mail, Phone, Globe, FileImage, MapPin, AlertCircle } from "lucide-react";
import AuthLayout from "./AuthLayout";
import StepIndicator from "./StepIndicator";
import AnimatedSection from "@/components/page/landing/components/AnimatedSection";

/**
 * Check if user prefers reduced motion
 * Requirement 6.3, 7.5: Respect prefers-reduced-motion settings
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

const RegisterOrg = () => {
  const [createOrganization, { isLoading }] = useCreateOrganizationMutation();
  const [step, setStep] = useState(1);
  const [animationDirection, setAnimationDirection] = useState("forward");
  const prefersReducedMotion = usePrefersReducedMotion();

  // Step configuration for StepIndicator
  const steps = [
    { label: "Organization", description: "Company details" },
    { label: "Address", description: "Location info" },
  ];

  // Use appropriate resolver depending on the step
  const formSchema = step === 1 ? organizationDetailsSchema : addressDetailsSchema;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data) => {
    if (step === 1) {
      setAnimationDirection("forward");
      setStep(2);
    } else {
      try {
        const response = await createOrganization(data).unwrap();
        if (response) {
          toast.success("Registration successful! Your organization is pending approval.");
        } else {
          toast.error("Something went wrong! Please try again later.");
        }
      } catch (error) {
        toast.error(error.message || "Registration failed. Please try again.");
      }
    }
  };

  const handleBack = () => {
    setAnimationDirection("backward");
    setStep(1);
  };

  return (
    <AuthLayout
      illustration="/images/register-org.png"
      illustrationAlt="Organization registration illustration"
      showBackLink={true}
      className="max-w-lg"
    >
      {/* Heading with design system typography */}
      <AnimatedSection animation="fade-up" delay={0}>
        <h1 className="text-center text-4xl font-bold text-foreground mb-2">
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
          totalSteps={2}
          steps={steps}
          className="mb-8"
        />
      </AnimatedSection>

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {step === 1 ? (
          <OrganizationDetailsForm 
            register={register} 
            errors={errors} 
            animationDirection={animationDirection}
            isLoading={isLoading}
            prefersReducedMotion={prefersReducedMotion}
          />
        ) : (
          <AddressDetailsForm 
            register={register} 
            errors={errors} 
            animationDirection={animationDirection}
            isLoading={isLoading}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}

        {/* Navigation Buttons */}
        <AnimatedSection animation="fade-up" delay={500}>
          <div className="flex gap-3 pt-2">
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1 h-11"
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              className={`h-11 ${step === 1 ? "w-full" : "flex-1"}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Registering...</span>
                </span>
              ) : step === 1 ? (
                "Next"
              ) : (
                "Register Organization"
              )}
            </Button>
          </div>
        </AnimatedSection>
      </form>

      {/* Divider */}
      <AnimatedSection animation="fade-up" delay={600}>
        <div className="flex items-center gap-4 my-6">
          <span className="flex-1 h-px bg-border" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">or</span>
          <span className="flex-1 h-px bg-border" aria-hidden="true" />
        </div>
      </AnimatedSection>

      {/* Login Link */}
      <AnimatedSection animation="fade-up" delay={700}>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            Sign In
          </Link>
        </p>
      </AnimatedSection>
    </AuthLayout>
  );
};


const OrganizationDetailsForm = ({ register, errors, animationDirection, isLoading, prefersReducedMotion }) => (
  <div
    className={`space-y-5 ${
      prefersReducedMotion 
        ? '' 
        : `transition-all duration-300 ease-in-out ${
            animationDirection === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"
          }`
    }`}
  >
    {/* Company Name */}
    <AnimatedSection animation="fade-up" delay={200}>
      <div className="space-y-2">
        <label
          htmlFor="name"
          className="block text-sm font-semibold text-foreground"
        >
          Company Name
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Building2
              size={18}
              className={errors.name ? "text-red-500" : "text-muted-foreground"}
              aria-hidden="true"
            />
          </div>
          <input
            disabled={isLoading}
            type="text"
            id="name"
            className={`
              w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30
              text-foreground placeholder:text-muted-foreground
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                errors.name
                  ? "border-red-500 focus:border-red-500"
                  : "border-border hover:border-muted-foreground/50 focus:border-primary"
              }
            `}
            placeholder="Enter your company name"
            aria-required="true"
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
        </div>
        {errors.name && (
          <div
            id="name-error"
            className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <AlertCircle size={14} aria-hidden="true" />
            <span>{errors.name.message}</span>
          </div>
        )}
      </div>
    </AnimatedSection>

    {/* Email and Phone - Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <AnimatedSection animation="fade-up" delay={250}>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-foreground"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Mail
                size={18}
                className={errors.email ? "text-red-500" : "text-muted-foreground"}
                aria-hidden="true"
              />
            </div>
            <input
              disabled={isLoading}
              type="email"
              id="email"
              className={`
                w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30
                text-foreground placeholder:text-muted-foreground
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-50
                ${
                  errors.email
                    ? "border-red-500 focus:border-red-500"
                    : "border-border hover:border-muted-foreground/50 focus:border-primary"
                }
              `}
              placeholder="you@company.com"
              aria-required="true"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <div
              id="email-error"
              className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle size={14} aria-hidden="true" />
              <span>{errors.email.message}</span>
            </div>
          )}
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={300}>
        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-foreground"
          >
            Phone
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Phone
                size={18}
                className={errors.phone ? "text-red-500" : "text-muted-foreground"}
                aria-hidden="true"
              />
            </div>
            <input
              disabled={isLoading}
              type="text"
              id="phone"
              className={`
                w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30
                text-foreground placeholder:text-muted-foreground
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-50
                ${
                  errors.phone
                    ? "border-red-500 focus:border-red-500"
                    : "border-border hover:border-muted-foreground/50 focus:border-primary"
                }
              `}
              placeholder="1234567890"
              aria-required="true"
              aria-invalid={errors.phone ? "true" : "false"}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <div
              id="phone-error"
              className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle size={14} aria-hidden="true" />
              <span>{errors.phone.message}</span>
            </div>
          )}
        </div>
      </AnimatedSection>
    </div>

    {/* Website */}
    <AnimatedSection animation="fade-up" delay={350}>
      <div className="space-y-2">
        <label
          htmlFor="website"
          className="block text-sm font-semibold text-foreground"
        >
          Website <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Globe
              size={18}
              className="text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <input
            disabled={isLoading}
            type="text"
            id="website"
            className={`
              w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30
              text-foreground placeholder:text-muted-foreground
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              border-border hover:border-muted-foreground/50 focus:border-primary
            `}
            placeholder="https://yourcompany.com"
            {...register("website")}
          />
        </div>
      </div>
    </AnimatedSection>

    {/* Logo Upload */}
    <AnimatedSection animation="fade-up" delay={400}>
      <div className="space-y-2">
        <label
          htmlFor="logo"
          className="block text-sm font-semibold text-foreground"
        >
          Company Logo <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <FileImage
              size={18}
              className="text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <input
            disabled={isLoading}
            type="file"
            id="logo"
            accept="image/*"
            className={`
              w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30
              text-foreground file:mr-4 file:py-1 file:px-3
              file:rounded-md file:border-0 file:text-sm file:font-medium
              file:bg-primary/10 file:text-primary hover:file:bg-primary/20
              file:cursor-pointer cursor-pointer
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              border-border hover:border-muted-foreground/50 focus:border-primary
            `}
            {...register("logo")}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Upload a logo image (PNG, JPG, or SVG)
        </p>
      </div>
    </AnimatedSection>

    {/* Description */}
    <AnimatedSection animation="fade-up" delay={450}>
      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-semibold text-foreground"
        >
          Description
        </label>
        <textarea
          disabled={isLoading}
          id="description"
          rows={3}
          className={`
            w-full px-4 py-3 rounded-lg border bg-muted/30
            text-foreground placeholder:text-muted-foreground
            transition-all duration-200 resize-none
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${
              errors.description
                ? "border-red-500 focus:border-red-500"
                : "border-border hover:border-muted-foreground/50 focus:border-primary"
            }
          `}
          placeholder="What does your company do?"
          aria-invalid={errors.description ? "true" : "false"}
          aria-describedby={errors.description ? "description-error" : undefined}
          {...register("description")}
        />
        {errors.description && (
          <div
            id="description-error"
            className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <AlertCircle size={14} aria-hidden="true" />
            <span>{errors.description.message}</span>
          </div>
        )}
      </div>
    </AnimatedSection>
  </div>
);


const AddressDetailsForm = ({ register, errors, animationDirection, isLoading, prefersReducedMotion }) => (
  <div
    className={`space-y-5 ${
      prefersReducedMotion 
        ? '' 
        : `transition-all duration-300 ease-in-out ${
            animationDirection === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"
          }`
    }`}
  >
    {/* Address */}
    <AnimatedSection animation="fade-up" delay={200}>
      <div className="space-y-2">
        <label
          htmlFor="address"
          className="block text-sm font-semibold text-foreground"
        >
          Address
        </label>
        <div className="relative">
          <div className="absolute left-3 top-3 pointer-events-none">
            <MapPin
              size={18}
              className={errors.address ? "text-red-500" : "text-muted-foreground"}
              aria-hidden="true"
            />
          </div>
          <textarea
            disabled={isLoading}
            id="address"
            rows={3}
            className={`
              w-full pl-10 pr-4 py-3 rounded-lg border bg-muted/30
              text-foreground placeholder:text-muted-foreground
              transition-all duration-200 resize-none
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                errors.address
                  ? "border-red-500 focus:border-red-500"
                  : "border-border hover:border-muted-foreground/50 focus:border-primary"
              }
            `}
            placeholder="Enter your full address"
            aria-required="true"
            aria-invalid={errors.address ? "true" : "false"}
            aria-describedby={errors.address ? "address-error" : undefined}
            {...register("address")}
          />
        </div>
        {errors.address && (
          <div
            id="address-error"
            className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <AlertCircle size={14} aria-hidden="true" />
            <span>{errors.address.message}</span>
          </div>
        )}
      </div>
    </AnimatedSection>

    {/* City and State - Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <AnimatedSection animation="fade-up" delay={250}>
        <div className="space-y-2">
          <label
            htmlFor="city"
            className="block text-sm font-semibold text-foreground"
          >
            City
          </label>
          <input
            disabled={isLoading}
            type="text"
            id="city"
            className={`
              w-full h-11 px-4 rounded-lg border bg-muted/30
              text-foreground placeholder:text-muted-foreground
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                errors.city
                  ? "border-red-500 focus:border-red-500"
                  : "border-border hover:border-muted-foreground/50 focus:border-primary"
              }
            `}
            placeholder="City"
            aria-required="true"
            aria-invalid={errors.city ? "true" : "false"}
            aria-describedby={errors.city ? "city-error" : undefined}
            {...register("city")}
          />
          {errors.city && (
            <div
              id="city-error"
              className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle size={14} aria-hidden="true" />
              <span>{errors.city.message}</span>
            </div>
          )}
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={300}>
        <div className="space-y-2">
          <label
            htmlFor="state"
            className="block text-sm font-semibold text-foreground"
          >
            State
          </label>
          <input
            disabled={isLoading}
            type="text"
            id="state"
            className={`
              w-full h-11 px-4 rounded-lg border bg-muted/30
              text-foreground placeholder:text-muted-foreground
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                errors.state
                  ? "border-red-500 focus:border-red-500"
                  : "border-border hover:border-muted-foreground/50 focus:border-primary"
              }
            `}
            placeholder="State"
            aria-required="true"
            aria-invalid={errors.state ? "true" : "false"}
            aria-describedby={errors.state ? "state-error" : undefined}
            {...register("state")}
          />
          {errors.state && (
            <div
              id="state-error"
              className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle size={14} aria-hidden="true" />
              <span>{errors.state.message}</span>
            </div>
          )}
        </div>
      </AnimatedSection>
    </div>

    {/* Country and Pincode - Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <AnimatedSection animation="fade-up" delay={350}>
        <div className="space-y-2">
          <label
            htmlFor="country"
            className="block text-sm font-semibold text-foreground"
          >
            Country
          </label>
          <input
            disabled={isLoading}
            type="text"
            id="country"
            className={`
              w-full h-11 px-4 rounded-lg border bg-muted/30
              text-foreground placeholder:text-muted-foreground
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                errors.country
                  ? "border-red-500 focus:border-red-500"
                  : "border-border hover:border-muted-foreground/50 focus:border-primary"
              }
            `}
            placeholder="Country"
            aria-required="true"
            aria-invalid={errors.country ? "true" : "false"}
            aria-describedby={errors.country ? "country-error" : undefined}
            {...register("country")}
          />
          {errors.country && (
            <div
              id="country-error"
              className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle size={14} aria-hidden="true" />
              <span>{errors.country.message}</span>
            </div>
          )}
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={400}>
        <div className="space-y-2">
          <label
            htmlFor="pincode"
            className="block text-sm font-semibold text-foreground"
          >
            Pincode
          </label>
          <input
            disabled={isLoading}
            type="text"
            id="pincode"
            className={`
              w-full h-11 px-4 rounded-lg border bg-muted/30
              text-foreground placeholder:text-muted-foreground
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                errors.pincode
                  ? "border-red-500 focus:border-red-500"
                  : "border-border hover:border-muted-foreground/50 focus:border-primary"
              }
            `}
            placeholder="Pincode"
            aria-required="true"
            aria-invalid={errors.pincode ? "true" : "false"}
            aria-describedby={errors.pincode ? "pincode-error" : undefined}
            {...register("pincode")}
          />
          {errors.pincode && (
            <div
              id="pincode-error"
              className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle size={14} aria-hidden="true" />
              <span>{errors.pincode.message}</span>
            </div>
          )}
        </div>
      </AnimatedSection>
    </div>

    {/* Terms and Conditions Checkbox */}
    <AnimatedSection animation="fade-up" delay={450}>
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            disabled={isLoading}
            className={`
              mt-1 h-[18px] w-[18px] shrink-0 rounded-[4px] border-2
              transition-colors duration-200 cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              checked:bg-primary checked:border-primary
              ${
                errors.terms
                  ? "border-red-500"
                  : "border-muted-foreground/40 hover:border-muted-foreground/60"
              }
            `}
            aria-required="true"
            aria-invalid={errors.terms ? "true" : "false"}
            aria-describedby={errors.terms ? "terms-error" : undefined}
            {...register("terms")}
          />
          <label
            htmlFor="terms"
            className="text-sm text-foreground leading-relaxed cursor-pointer select-none"
          >
            I agree to the{" "}
            <Link
              to="/terms"
              className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.terms && (
          <div
            id="terms-error"
            className="flex items-center gap-1.5 text-red-500 text-xs"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <AlertCircle size={14} aria-hidden="true" />
            <span>{errors.terms.message}</span>
          </div>
        )}
      </div>
    </AnimatedSection>
  </div>
);

export default RegisterOrg;
