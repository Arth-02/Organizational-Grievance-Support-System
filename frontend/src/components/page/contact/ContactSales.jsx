import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, Building2, Mail, Phone, User, MessageSquare, AlertCircle, ArrowLeft, Sparkles } from "lucide-react";
import AnimatedSection from "@/components/page/landing/components/AnimatedSection";

// Validation schema for contact form
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const ContactSales = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedPlan = useMemo(() => {
    return searchParams.get('plan') || null;
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Simulate API call - in production, this would send to your backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Contact form submitted:', { ...data, interestedPlan: selectedPlan });
      
      toast.success("Thank you for your interest! Our sales team will contact you within 24 hours.");
      reset();
      
      // Redirect to home after a short delay
      setTimeout(() => navigate('/'), 2000);
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <AnimatedSection animation="fade-up" delay={0}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Contact Sales
            </h1>
            <p className="text-lg text-muted-foreground">
              Get in touch with our team to discuss your enterprise needs
            </p>
          </div>
        </AnimatedSection>

        {/* Enterprise Plan Badge */}
        {selectedPlan === 'enterprise' && (
          <AnimatedSection animation="fade-up" delay={50}>
            <div className="mb-8 p-4 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">Enterprise Plan Inquiry</h3>
                  <p className="text-sm text-muted-foreground">
                    Custom pricing, unlimited users, dedicated support, and SSO integration
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Contact Form */}
        <AnimatedSection animation="fade-up" delay={100}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded-lg border border-border">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-foreground">
                Your Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <User size={18} className={errors.name ? "text-red-500" : "text-muted-foreground"} />
                </div>
                <input
                  disabled={isSubmitting}
                  type="text"
                  id="name"
                  className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.name ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                  placeholder="John Doe"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5" role="alert">
                  <AlertCircle size={14} />
                  <span>{errors.name.message}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail size={18} className={errors.email ? "text-red-500" : "text-muted-foreground"} />
                </div>
                <input
                  disabled={isSubmitting}
                  type="email"
                  id="email"
                  className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.email ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                  placeholder="john@company.com"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5" role="alert">
                  <AlertCircle size={14} />
                  <span>{errors.email.message}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-semibold text-foreground">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Phone size={18} className={errors.phone ? "text-red-500" : "text-muted-foreground"} />
                </div>
                <input
                  disabled={isSubmitting}
                  type="text"
                  id="phone"
                  className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.phone ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                  placeholder="+1 (555) 000-0000"
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5" role="alert">
                  <AlertCircle size={14} />
                  <span>{errors.phone.message}</span>
                </div>
              )}
            </div>

            {/* Company */}
            <div className="space-y-2">
              <label htmlFor="company" className="block text-sm font-semibold text-foreground">
                Company Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Building2 size={18} className={errors.company ? "text-red-500" : "text-muted-foreground"} />
                </div>
                <input
                  disabled={isSubmitting}
                  type="text"
                  id="company"
                  className={`w-full h-11 pl-10 pr-4 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.company ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                  placeholder="Acme Inc."
                  {...register("company")}
                />
              </div>
              {errors.company && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5" role="alert">
                  <AlertCircle size={14} />
                  <span>{errors.company.message}</span>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-semibold text-foreground">
                How can we help?
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 pointer-events-none">
                  <MessageSquare size={18} className={errors.message ? "text-red-500" : "text-muted-foreground"} />
                </div>
                <textarea
                  disabled={isSubmitting}
                  id="message"
                  rows={4}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border bg-muted/30 text-foreground placeholder:text-muted-foreground transition-all duration-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.message ? "border-red-500" : "border-border hover:border-muted-foreground/50 focus:border-primary"}`}
                  placeholder="Tell us about your organization's needs, team size, and any specific requirements..."
                  {...register("message")}
                />
              </div>
              {errors.message && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1.5" role="alert">
                  <AlertCircle size={14} />
                  <span>{errors.message.message}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending...</span>
                </span>
              ) : (
                "Send Message"
              )}
            </Button>
          </form>
        </AnimatedSection>

        {/* Additional Info */}
        <AnimatedSection animation="fade-up" delay={150}>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Our sales team typically responds within 24 hours.</p>
            <p className="mt-2">
              For immediate assistance, email us at{" "}
              <a href="mailto:sales@example.com" className="text-primary hover:underline">
                sales@example.com
              </a>
            </p>
          </div>
        </AnimatedSection>
      </main>
    </div>
  );
};

export default ContactSales;
