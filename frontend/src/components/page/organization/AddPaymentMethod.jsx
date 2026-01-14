import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CreditCard,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useAddPaymentMethodMutation } from "@/services/payment.service";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Initialize Stripe with publishable key from environment
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

/**
 * Card Element styling options
 */
const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#ffffff",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSmoothing: "antialiased",
      "::placeholder": {
        color: "#6b7280",
      },
      iconColor: "#22d3ee",
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
  hidePostalCode: true,
};

/**
 * AddPaymentMethodForm - Inner form component that uses Stripe hooks
 */
const AddPaymentMethodForm = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isDefault, setIsDefault] = useState(true);
  const [cardError, setCardError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStripeReady, setIsStripeReady] = useState(false);

  const [addPaymentMethod] = useAddPaymentMethodMutation();

  // Check when Stripe is ready
  useEffect(() => {
    if (stripe && elements) {
      setIsStripeReady(true);
    }
  }, [stripe, elements]);

  // Handle card element changes
  const handleCardChange = (event) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  // Handle card element ready
  const handleCardReady = () => {
    console.log("Stripe CardElement is ready");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe has not loaded yet. Please try again.");
      return;
    }

    if (!cardComplete) {
      setCardError("Please complete your card details");
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      // Create payment method with Stripe
      const cardElement = elements.getElement(CardElement);
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (error) {
        setCardError(error.message);
        setIsProcessing(false);
        return;
      }

      // Send payment method to backend
      await addPaymentMethod({
        paymentMethodId: paymentMethod.id,
        isDefault,
      }).unwrap();

      toast.success("Payment method added successfully");
      onSuccess?.();
    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || "Failed to add payment method";
      setCardError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Card Input Section */}
        <div className="space-y-3">
          <Label htmlFor="card-element" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Card Details
          </Label>
          
          {/* Loading state while Stripe loads */}
          {!isStripeReady && (
            <div className="p-4 rounded-lg border border-input bg-muted/30 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading payment form...</span>
            </div>
          )}
          
          <div
            className={cn(
              "p-4 rounded-lg border bg-muted/30 transition-colors min-h-[50px]",
              cardError ? "border-destructive" : "border-input hover:border-primary/50",
              "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background",
              !isStripeReady && "hidden"
            )}
          >
            <CardElement
              id="card-element"
              options={cardElementOptions}
              onChange={handleCardChange}
              onReady={handleCardReady}
            />
          </div>
          
          {/* Helper text */}
          {isStripeReady && !cardError && (
            <p className="text-xs text-muted-foreground">
              Enter your card number, expiry date, CVC, and postal code
            </p>
          )}
          
          {cardError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {cardError}
            </div>
          )}
        </div>

        {/* Set as Default Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="set-default"
            checked={isDefault}
            onCheckedChange={setIsDefault}
          />
          <Label
            htmlFor="set-default"
            className="text-sm font-normal cursor-pointer"
          >
            Set as default payment method
          </Label>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
          <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Secure Payment</p>
            <p className="text-muted-foreground">
              Your card information is encrypted and securely processed by Stripe.
              We never store your full card details.
            </p>
          </div>
        </div>
      </div>

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
          disabled={!isStripeReady || !cardComplete || isProcessing}
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Add Payment Method
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * AddPaymentMethod Component
 * Modal dialog for adding a new payment method using Stripe Elements
 * 
 * @requirements 9.8
 */
const AddPaymentMethod = ({ open, onOpenChange, onSuccess }) => {
  const [stripeError, setStripeError] = useState(null);

  // Check if Stripe key is configured
  useEffect(() => {
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      setStripeError("Stripe is not configured. Please contact support.");
    }
  }, []);

  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Add Payment Method
          </DialogTitle>
          <DialogDescription>
            Add a new card for subscription payments
          </DialogDescription>
        </DialogHeader>

        {stripeError ? (
          <div className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium">{stripeError}</p>
          </div>
        ) : (
          <Elements stripe={stripePromise}>
            <AddPaymentMethodForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentMethod;
