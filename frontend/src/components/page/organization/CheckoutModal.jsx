import { useState, useEffect, useMemo, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Check,
  ArrowRight,
  Star,
  RefreshCw,
} from "lucide-react";
import {
  useGetPaymentMethodsQuery,
  useCreatePaymentIntentMutation,
} from "@/services/payment.service";
import {
  useUpgradeSubscriptionMutation,
  useCreateSubscriptionMutation,
} from "@/services/subscription.service";
import toast from "react-hot-toast";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

/**
 * CheckoutForm - Inner form component for payment processing
 */
const CheckoutForm = ({
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/settings/subscription?success=true`,
        },
        redirect: "if_required",
      });

      if (error) {
        setPaymentError(error.message);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.success("Payment successful!");
        onSuccess?.();
      }
    } catch (err) {
      setPaymentError(err.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {paymentError && (
        <div className="flex items-center gap-2 text-sm text-destructive p-3 rounded-lg bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          {paymentError}
        </div>
      )}

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Confirm Payment
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * CheckoutModal Component
 * Shows plan details, prorated amount (if upgrade), payment method selection
 * Handles the checkout flow for subscription changes
 * 
 * @requirements 9.4
 */
const CheckoutModal = ({
  open,
  onOpenChange,
  plan,
  currentPlan,
  subscription,
  billingCycle = "monthly",
  onSuccess,
}) => {
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [prorationAmount, setProrationAmount] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState(null);

  // Fetch payment methods
  const {
    data: paymentMethodsData,
    isLoading: isLoadingPaymentMethods,
    refetch: refetchPaymentMethods,
  } = useGetPaymentMethodsQuery();

  // Mutations
  const [createPaymentIntent, { isLoading: isCreatingIntent }] = useCreatePaymentIntentMutation();
  const [upgradeSubscription, { isLoading: isUpgrading }] = useUpgradeSubscriptionMutation();
  const [createSubscription, { isLoading: isCreating }] = useCreateSubscriptionMutation();

  const paymentMethods = useMemo(() => 
    paymentMethodsData?.data?.paymentMethods ||
    paymentMethodsData?.data ||
    paymentMethodsData ||
    [], [paymentMethodsData]);

  const isProcessing = isCreatingIntent || isUpgrading || isCreating || isCalculating;

  // Calculate proration amount
  const calculateProration = useCallback(async () => {
    if (!subscription || !plan) return;

    setIsCalculating(true);
    try {
      // Calculate days remaining in current period
      const now = new Date();
      const periodEnd = new Date(subscription.currentPeriodEnd);
      const periodStart = new Date(subscription.currentPeriodStart);
      
      const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)));
      
      const currentPrice = billingCycle === "annual" 
        ? (currentPlan?.annualPrice || 0) 
        : (currentPlan?.monthlyPrice || 0);
      const newPrice = billingCycle === "annual" 
        ? (plan?.annualPrice || 0) 
        : (plan?.monthlyPrice || 0);
      
      // Calculate prorated amount
      const priceDifference = newPrice - currentPrice;
      const proration = Math.max(0, (daysRemaining / totalDays) * priceDifference);
      
      setProrationAmount(Math.round(proration * 100) / 100);
    } catch (err) {
      console.error("Failed to calculate proration:", err);
    } finally {
      setIsCalculating(false);
    }
  }, [subscription, plan, billingCycle, currentPlan]);

  // Set default payment method on load
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentMethodId) {
      const defaultMethod = paymentMethods.find((pm) => pm.isDefault);
      setSelectedPaymentMethodId(defaultMethod?._id || paymentMethods[0]._id);
    }
  }, [paymentMethods, selectedPaymentMethodId]);

  // Calculate proration when modal opens
  useEffect(() => {
    if (open && plan && currentPlan && plan._id !== currentPlan._id) {
      calculateProration();
    }
  }, [open, plan, currentPlan, calculateProration]);

  // Handle checkout
  const handleCheckout = async () => {
    if (!plan || !selectedPaymentMethodId) {
      toast.error("Please select a payment method");
      return;
    }

    setError(null);

    try {
      // Create payment intent
      const intentResult = await createPaymentIntent({
        planId: plan._id,
        billingCycle,
        paymentMethodId: selectedPaymentMethodId,
      }).unwrap();

      const secret = intentResult?.data?.clientSecret || intentResult?.clientSecret;
      
      if (secret) {
        setClientSecret(secret);
      } else {
        // If no client secret, proceed with subscription directly (free plan or trial)
        await handleDirectSubscription();
      }
    } catch (err) {
      const errorMessage = err?.data?.message || "Failed to initiate checkout";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Handle direct subscription (no payment required)
  const handleDirectSubscription = async () => {
    try {
      if (currentPlan) {
        await upgradeSubscription({
          planId: plan._id,
          billingCycle,
          paymentMethodId: selectedPaymentMethodId,
        }).unwrap();
      } else {
        await createSubscription({
          planId: plan._id,
          billingCycle,
          paymentMethodId: selectedPaymentMethodId,
        }).unwrap();
      }
      
      toast.success(`Successfully subscribed to ${plan.displayName || plan.name}!`);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err?.data?.message || "Failed to process subscription";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  // Format price
  const formatPrice = (price) => {
    if (price === 0 || price === null || price === undefined) return "Free";
    return `$${price}`;
  };

  // Get card brand info
  const getCardBrandInfo = (brand) => {
    const brands = {
      visa: { label: "Visa" },
      mastercard: { label: "Mastercard" },
      amex: { label: "Amex" },
      discover: { label: "Discover" },
      default: { label: "Card" },
    };
    return brands[brand?.toLowerCase()] || brands.default;
  };

  // Calculate total
  const getTotal = () => {
    const planPrice = billingCycle === "annual" 
      ? (plan?.annualPrice || 0) 
      : (plan?.monthlyPrice || 0);
    
    if (prorationAmount !== null && prorationAmount > 0) {
      return prorationAmount;
    }
    return planPrice;
  };

  const isUpgrade = currentPlan && plan && 
    (plan.monthlyPrice || 0) > (currentPlan.monthlyPrice || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {isUpgrade ? "Upgrade Subscription" : "Subscribe to Plan"}
          </DialogTitle>
          <DialogDescription>
            {isUpgrade 
              ? "Review your upgrade details and confirm payment"
              : "Complete your subscription setup"
            }
          </DialogDescription>
        </DialogHeader>

        {clientSecret ? (
          // Show Stripe Payment Element
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "hsl(var(--primary))",
                },
              },
            }}
          >
            <CheckoutForm
              plan={plan}
              currentPlan={currentPlan}
              billingCycle={billingCycle}
              prorationAmount={prorationAmount}
              selectedPaymentMethodId={selectedPaymentMethodId}
              onSuccess={handlePaymentSuccess}
              onCancel={() => onOpenChange(false)}
              clientSecret={clientSecret}
            />
          </Elements>
        ) : (
          // Show checkout summary
          <div className="space-y-6">
            {/* Plan Details */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg capitalize">
                    {plan?.displayName || plan?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan?.description}
                  </p>
                </div>
                {isUpgrade && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Upgrade
                  </Badge>
                )}
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan Price</span>
                <span>
                  {formatPrice(billingCycle === "annual" ? plan?.annualPrice : plan?.monthlyPrice)}
                  <span className="text-muted-foreground">
                    /{billingCycle === "annual" ? "year" : "month"}
                  </span>
                </span>
              </div>

              {isUpgrade && prorationAmount !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Prorated Amount (remaining period)
                  </span>
                  {isCalculating ? (
                    <Skeleton className="h-4 w-16" />
                  ) : (
                    <span className="text-green-600">
                      {formatPrice(prorationAmount)}
                    </span>
                  )}
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total Due Today</span>
                {isCalculating ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  <span className="text-lg">{formatPrice(getTotal())}</span>
                )}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label>Payment Method</Label>
              {isLoadingPaymentMethods ? (
                <Skeleton className="h-10 w-full" />
              ) : paymentMethods.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed text-center">
                  <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No payment methods found
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => refetchPaymentMethods()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <Select
                  value={selectedPaymentMethodId}
                  onValueChange={setSelectedPaymentMethodId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => {
                      const brandInfo = getCardBrandInfo(method.card?.brand);
                      return (
                        <SelectItem key={method._id} value={method._id}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>
                              {brandInfo.label} •••• {method.card?.last4}
                            </span>
                            {method.isDefault && (
                              <Star className="h-3 w-3 text-primary fill-current" />
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
              <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Secure Checkout</p>
                <p className="text-muted-foreground">
                  Your payment is processed securely by Stripe.
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive p-3 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={isProcessing || !selectedPaymentMethodId || paymentMethods.length === 0}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
