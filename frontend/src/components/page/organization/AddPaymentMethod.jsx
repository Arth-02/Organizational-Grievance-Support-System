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
      color: "hsl(var(--foreground))",
      fontFamily: "inherit",
      "::placeholder": {
        color: "hsl(var(--muted-foreground))",
      },
      iconColor: "hsl(var(--primary))",
    },
    invalid: {
      color: "hsl(var(--destructive))",
      iconColor: "hsl(var(--destructive))",
    },
  },
  hidePostalCode: false,
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

  const [addPaymentMethod] = useAddPaymentMethodMutation();

  // Handle card element changes
  const handleCardChange = (event) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
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
          <div
            className={cn(
              "p-4 rounded-lg border bg-background transition-colors",
              cardError ? "border-destructive" : "border-input",
              "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            )}
          >
            <CardElement
              id="card-element"
              options={cardElementOptions}
              onChange={handleCardChange}
            />
          </div>
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
          disabled={!stripe || !cardComplete || isProcessing}
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
