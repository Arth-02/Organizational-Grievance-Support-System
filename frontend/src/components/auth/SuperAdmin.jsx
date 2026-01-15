import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "../ui/button";
import { useCallback, useState } from "react";
import { superAdminBaseSchema, superAdminSchemaWithOTP } from "@/validators/users";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CustomOTPInput } from "../ui/input-otp";
import {
  BadgeAlert,
  BadgeCheck,
  Loader2,
  User,
  Mail,
  Lock,
  Phone,
  IdCard,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Shield
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import { CustomTooltip } from "../ui/tooltip";
import { useCreateSuperAdminMutation } from "@/services/organization.service";
import { useOtpGenerateMutation } from "@/services/auth.service";
import { useCheckEmailMutation, useCheckUsernameMutation } from "@/services/user.service";
import AuthLayout from "./AuthLayout";
import StepIndicator from "./StepIndicator";
import AnimatedSection from "@/components/page/landing/components/AnimatedSection";

// Define schemas for each step
const personalDetailsSchema = superAdminBaseSchema.pick({
  firstname: true,
  lastname: true,
  employee_id: true,
  phone_number: true,
});

const accountCredentialsSchema = superAdminBaseSchema.pick({
  username: true,
  email: true,
  password: true,
  confirmpassword: true,
}).refine((data) => data.password === data.confirmpassword, {
  message: "Passwords don't match",
  path: ["confirmpassword"],
});

const SuperAdmin = () => {
  const [superAdmin, { isLoading }] = useCreateSuperAdminMutation();
  const [generateOtp, { isLoading: isOTPGenerating }] = useOtpGenerateMutation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const [searchParams] = useSearchParams();
  const organizationId = searchParams.get("id");

  // Step configuration for StepIndicator
  const steps = [
    { label: "Personal", description: "Details" },
    { label: "Account", description: "Credentials" },
    { label: "Verify", description: "OTP Check" },
  ];

  const handleNext = async (stepData) => {
    // Merge new data
    const updatedData = { ...formData, ...stepData };
    setFormData(updatedData);

    if (step === 2) {
      // If moving from step 2 to 3, trigger OTP generation
      try {
        const response = await generateOtp({
          organization_id: organizationId,
        }).unwrap();
        if (!response) {
          toast.error("Error generating OTP. Please try again.");
          return;
        }
        toast.success("OTP sent to organization email!");
        setStep(3);
      } catch (error) {
        toast.error(error?.data?.message || error?.message || "Error generating OTP. Please try again.");
        return; // Stop progression if OTP fails
      }
    } else {
      // Standard progression for step 1
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleFinalSubmit = async (otpData) => {
    try {
      //  Remove confirm Password
      delete formData.confirmpassword;
      const allData = { ...formData, ...otpData, organization_id: organizationId };
      const response = await superAdmin(allData).unwrap();
      if (response) {
        toast.success("Super Admin created successfully!");
        // set token in localStorage
        localStorage.setItem("token", response.token);
        // Navigate to dashboard after successful creation
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        toast.error("Something went wrong! Please try again later.");
      }
    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Check if organization ID is provided
  if (!organizationId) {
    return (
      <AuthLayout
        illustration="/images/super-admin.png"
        illustrationAlt="Super Admin illustration"
        showBackLink={true}
      >
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h2>
          <p className="text-muted-foreground mb-6">
            This page requires a valid organization ID. Please use the link provided in your approval email.
          </p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      illustration="/images/super-admin.png"
      illustrationAlt="Super Admin illustration"
      showBackLink={true}
      className="max-w-lg"
    >
      {/* Heading */}
      <AnimatedSection animation="fade-up" delay={0}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-center text-4xl font-bold text-foreground">
            Super Admin
          </h1>
        </div>
        <p className="text-center text-muted-foreground mb-6">
          Create your administrator account to manage your organization
        </p>
      </AnimatedSection>

      {/* Step Indicator */}
      <AnimatedSection animation="fade-up" delay={100}>
        <StepIndicator
          currentStep={step}
          totalSteps={3}
          steps={steps}
          className="mb-8"
        />
      </AnimatedSection>

      <div>
        {step === 1 && (
          <PersonalDetailsForm
            defaultValues={formData}
            onNext={handleNext}
          />
        )}

        {step === 2 && (
          <AccountCredentialsForm
            defaultValues={formData}
            onNext={handleNext}
            onBack={handleBack}
            isProcessing={isOTPGenerating || isLoading}
          />
        )}

        {step === 3 && (
          <OTPForm
            onSubmit={handleFinalSubmit}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Help text */}
      <AnimatedSection animation="fade-up" delay={600}>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help?{" "}
          <Link
            to="/contact"
            className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            Contact Support
          </Link>
        </p>
      </AnimatedSection>
    </AuthLayout>
  );
};

/* --- Step 1: Personal Details --- */
const PersonalDetailsForm = ({ defaultValues, onNext, animationDirection }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className={`space-y-5 transition-all duration-300 ease-in-out ${animationDirection === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"}`}>
      {/* First Name & Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatedSection animation="fade-up" delay={250}>
          <div className="space-y-2">
            <label htmlFor="firstname" className="block text-sm font-semibold text-foreground">
              First Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="firstname"
                className={`w-full h-11 px-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.firstname ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="John"
                {...register("firstname")}
              />
            </div>
            {errors.firstname && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5" role="alert">
                <AlertCircle size={14} />
                <span>{errors.firstname.message}</span>
              </div>
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={250}>
          <div className="space-y-2">
            <label htmlFor="lastname" className="block text-sm font-semibold text-foreground">
              Last Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="lastname"
                className={`w-full h-11 px-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.lastname ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="Doe"
                {...register("lastname")}
              />
            </div>
            {errors.lastname && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5" role="alert">
                <AlertCircle size={14} />
                <span>{errors.lastname.message}</span>
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>

      {/* Employee ID & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatedSection animation="fade-up" delay={300}>
          <div className="space-y-2">
            <label htmlFor="employee_id" className="block text-sm font-semibold text-foreground">
              Employee ID
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <IdCard size={18} className={errors.employee_id ? "text-red-500" : "text-muted-foreground"} />
              </div>
              <input
                type="text"
                id="employee_id"
                className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.employee_id ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="EMP001"
                {...register("employee_id")}
              />
            </div>
            {errors.employee_id && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5" role="alert">
                <AlertCircle size={14} />
                <span>{errors.employee_id.message}</span>
              </div>
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={300}>
          <div className="space-y-2">
            <label htmlFor="phone_number" className="block text-sm font-semibold text-foreground">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Phone size={18} className={errors.phone_number ? "text-red-500" : "text-muted-foreground"} />
              </div>
              <input
                type="text"
                id="phone_number"
                className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.phone_number ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="1234567890"
                {...register("phone_number")}
              />
            </div>
            {errors.phone_number && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5" role="alert">
                <AlertCircle size={14} />
                <span>{errors.phone_number.message}</span>
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>

      <AnimatedSection animation="fade-up" delay={400}>
        <Button type="submit" className="w-full h-11 mt-2">
          Continue <ArrowRight size={16} className="ml-2" />
        </Button>
      </AnimatedSection>
    </form>
  );
};

/* --- Step 2: Account Credentials --- */
const AccountCredentialsForm = ({ defaultValues, onNext, onBack, animationDirection, isProcessing }) => {
  const { register, setError, clearErrors, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(accountCredentialsSchema),
    defaultValues
  });

  const [username, setUsername] = useState(defaultValues.username || "");
  const [email, setEmail] = useState(defaultValues.email || "");
  const [isUserNameAvailable, setIsUserNameAvailable] = useState(undefined);
  const [isEmailAvailable, setIsEmailAvailable] = useState(undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [checkUsername, { isLoading: checkingUserName }] = useCheckUsernameMutation();
  const [checkEmail, { isLoading: checkingEmail }] = useCheckEmailMutation();

  const checkIfUsernameExists = useCallback(async (username) => {
    if (!username) return;
    if (username.length < 3) {
      setIsUserNameAvailable(false);
      setError("username", { type: "manual", message: "Username must be at least 3 characters long" });
      return;
    }
    try {
      const response = await checkUsername({ username }).unwrap();
      if (response) {
        setIsUserNameAvailable(!response.exists);
        if (response.exists) {
          setError("username", { type: "manual", message: "Username is already taken" });
        } else {
          clearErrors("username");
        }
      }
    } catch (error) {
      const errorMessages = Array.isArray(error.message) ? error.message.join(", ") : error.message;
      setIsUserNameAvailable(false);
      setError("username", { type: "manual", message: errorMessages });
    }
  }, [checkUsername, setError, clearErrors]);

  const checkIfEmailExists = useCallback(async (email) => {
    if (!email) return;
    try {
      const response = await checkEmail({ email }).unwrap();
      if (response) {
        setIsEmailAvailable(!response.exists);
        if (response.exists) {
          setError("email", { type: "manual", message: "Email is already in use" });
        } else {
          clearErrors("email");
        }
      }
    } catch (error) {
      const errorMessages = Array.isArray(error.message) ? error.message.join(", ") : error.message;
      setIsEmailAvailable(false);
      setError("email", { type: "manual", message: errorMessages });
    }
  }, [checkEmail, setError, clearErrors]);

  useDebounce(email, 500, checkIfEmailExists);
  useDebounce(username, 500, checkIfUsernameExists);

  return (
    <form onSubmit={handleSubmit(onNext)} className={`space-y-5 transition-all duration-300 ease-in-out ${animationDirection === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"}`}>
      {/* Username */}
      <AnimatedSection animation="fade-up" delay={400}>
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-semibold text-foreground">
            Username
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <User size={18} className={errors.username ? "text-red-500" : "text-muted-foreground"} />
            </div>
            <input
              type="text"
              id="username"
              className={`w-full h-11 pl-10 pr-10 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.username ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
              placeholder="johndoe"
              {...register("username", {
                onChange: (e) => setUsername(e.target.value),
              })}
            />
            {username && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isUserNameAvailable === undefined || checkingUserName ? (
                  <Loader2 size={18} className="animate-spin text-primary" />
                ) : isUserNameAvailable ? (
                  <CustomTooltip className="bg-green-50 text-green-600" content="Username is available">
                    <BadgeCheck className="text-green-500" size={18} />
                  </CustomTooltip>
                ) : (
                  <CustomTooltip className="bg-red-50 text-red-500" content={username.length < 3 ? "Username must have at least 3 characters" : "Username is not available"}>
                    <BadgeAlert className="text-red-500" size={18} />
                  </CustomTooltip>
                )}
              </div>
            )}
          </div>
          {errors.username && (
            <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5" role="alert">
              <AlertCircle size={14} />
              <span>{errors.username.message}</span>
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* Email */}
      <AnimatedSection animation="fade-up" delay={450}>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-foreground">
            Email
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Mail size={18} className={errors.email ? "text-red-500" : "text-muted-foreground"} />
            </div>
            <input
              type="email"
              id="email"
              className={`w-full h-11 pl-10 pr-10 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.email ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
              placeholder="john@example.com"
              {...register("email", {
                onBlur: (e) => setEmail(e.target.value),
              })}
            />
            {email && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isEmailAvailable === undefined || checkingEmail ? (
                  <Loader2 size={18} className="animate-spin text-primary" />
                ) : isEmailAvailable ? (
                  <CustomTooltip className="bg-green-50 text-green-600" content="Email is available">
                    <BadgeCheck className="text-green-500" size={18} />
                  </CustomTooltip>
                ) : (
                  <CustomTooltip className="bg-red-50 text-red-500" content="Email is not available">
                    <BadgeAlert className="text-red-500" size={18} />
                  </CustomTooltip>
                )}
              </div>
            )}
          </div>
          {errors.email && (
            <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5" role="alert">
              <AlertCircle size={14} />
              <span>{errors.email.message}</span>
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* Password & Confirm Password */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatedSection animation="fade-up" delay={500}>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-foreground">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock size={18} className={errors.password ? "text-red-500" : "text-muted-foreground"} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className={`w-full h-11 pl-10 pr-10 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.password ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="••••••••"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5" role="alert">
                <AlertCircle size={14} />
                <span>{errors.password.message}</span>
              </div>
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-up" delay={550}>
          <div className="space-y-2">
            <label htmlFor="confirmpassword" className="block text-sm font-semibold text-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock size={18} className={errors.confirmpassword ? "text-red-500" : "text-muted-foreground"} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmpassword"
                className={`w-full h-11 pl-10 pr-10 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${errors.confirmpassword ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                placeholder="••••••••"
                {...register("confirmpassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmpassword && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5" role="alert">
                <AlertCircle size={14} />
                <span>{errors.confirmpassword.message}</span>
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>

      <AnimatedSection animation="fade-up" delay={500}>
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-11">Back</Button>
          <Button type="submit" disabled={isProcessing} className="flex-1 h-11">
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending OTP...</span>
              </span>
            ) : (
              <>Next Step <ArrowRight size={16} className="ml-2" /></>
            )}
          </Button>
        </div>
      </AnimatedSection>

    </form>
  );
};

/* --- Step 3: OTP Verification --- */
const OTPForm = ({ onSubmit, onBack, animationDirection, isLoading }) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(superAdminSchemaWithOTP),
    mode: "onSubmit",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 transition-all duration-300 ease-in-out ${animationDirection === "forward" ? "animate-slide-in-right" : "animate-slide-in-left"}`}>
      <AnimatedSection animation="fade-up" delay={200}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Verify Your Email
          </h3>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a 6-digit verification code to your organization&apos;s email address.
            Please enter it below.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={250}>
        <CustomOTPInput
          control={control}
          name="otp"
          label="Enter OTP"
          maxLength={6}
          error={errors.otp}
        />
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={300}>
        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            className="font-semibold text-primary hover:underline focus:outline-none"
          >
            Resend OTP
          </button>
        </p>
      </AnimatedSection>

      <AnimatedSection animation="fade-up" delay={350}>
        <div className="flex gap-3 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1 h-11"
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 h-11"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </span>
            ) : (
              "Create Account"
            )}
          </Button>
        </div>
      </AnimatedSection>
    </form>
  );
};

export default SuperAdmin;
