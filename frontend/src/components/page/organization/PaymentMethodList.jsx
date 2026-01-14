import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  useGetPaymentMethodsQuery,
  useRemovePaymentMethodMutation,
  useSetDefaultPaymentMethodMutation,
} from "@/services/payment.service";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

/**
 * PaymentMethodList Component
 * Displays saved payment methods with card icons
 * Shows default indicator, add/remove buttons
 * 
 * @requirements 9.6
 */
const PaymentMethodList = ({ onAddPaymentMethod }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  // Fetch payment methods
  const {
    data: paymentMethodsData,
    isLoading,
    error,
    refetch,
  } = useGetPaymentMethodsQuery();

  // Mutations
  const [removePaymentMethod, { isLoading: isRemoving }] = useRemovePaymentMethodMutation();
  const [setDefaultPaymentMethod, { isLoading: isSettingDefault }] = useSetDefaultPaymentMethodMutation();

  const paymentMethods = paymentMethodsData?.data?.paymentMethods || 
                         paymentMethodsData?.data || 
                         paymentMethodsData || 
                         [];

  // Get card brand icon/color
  const getCardBrandInfo = (brand) => {
    const brands = {
      visa: { color: "text-blue-600", bgColor: "bg-blue-500/10", label: "Visa" },
      mastercard: { color: "text-orange-600", bgColor: "bg-orange-500/10", label: "Mastercard" },
      amex: { color: "text-blue-500", bgColor: "bg-blue-500/10", label: "American Express" },
      discover: { color: "text-orange-500", bgColor: "bg-orange-500/10", label: "Discover" },
      diners: { color: "text-gray-600", bgColor: "bg-gray-500/10", label: "Diners Club" },
      jcb: { color: "text-green-600", bgColor: "bg-green-500/10", label: "JCB" },
      unionpay: { color: "text-red-600", bgColor: "bg-red-500/10", label: "UnionPay" },
      default: { color: "text-gray-600", bgColor: "bg-gray-500/10", label: "Card" },
    };
    return brands[brand?.toLowerCase()] || brands.default;
  };

  // Handle remove payment method
  const handleRemove = async (id) => {
    setDeletingId(id);
    try {
      await removePaymentMethod(id).unwrap();
      toast.success("Payment method removed successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to remove payment method");
    } finally {
      setDeletingId(null);
    }
  };

  // Handle set default payment method
  const handleSetDefault = async (id) => {
    setSettingDefaultId(id);
    try {
      await setDefaultPaymentMethod(id).unwrap();
      toast.success("Default payment method updated");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to set default payment method");
    } finally {
      setSettingDefaultId(null);
    }
  };

  // Format expiry date
  const formatExpiry = (month, year) => {
    if (!month || !year) return "N/A";
    const monthStr = month.toString().padStart(2, "0");
    const yearStr = year.toString().slice(-2);
    return `${monthStr}/${yearStr}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="font-semibold">Failed to load payment methods</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error?.data?.message || "An error occurred"}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Methods
            </CardTitle>
            <CardDescription>
              Manage your saved payment methods
            </CardDescription>
          </div>
          <Button onClick={onAddPaymentMethod} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg border-dashed">
            <CreditCard className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-medium">No payment methods</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add a payment method to enable automatic billing
            </p>
            <Button 
              variant="outline" 
              className="mt-4 gap-2"
              onClick={onAddPaymentMethod}
            >
              <Plus className="h-4 w-4" />
              Add Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const brandInfo = getCardBrandInfo(method.card?.brand);
              const isDeleting = deletingId === method._id && isRemoving;
              const isSettingAsDefault = settingDefaultId === method._id && isSettingDefault;

              return (
                <div
                  key={method._id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors",
                    method.isDefault && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Card Icon */}
                    <div className={cn(
                      "p-3 rounded-lg",
                      brandInfo.bgColor
                    )}>
                      <CreditCard className={cn("h-5 w-5", brandInfo.color)} />
                    </div>

                    {/* Card Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {brandInfo.label} •••• {method.card?.last4 || "****"}
                        </span>
                        {method.isDefault && (
                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Expires {formatExpiry(method.card?.expiryMonth, method.card?.expiryYear)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(method._id)}
                        disabled={isSettingAsDefault}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isSettingAsDefault ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-1" />
                            Set Default
                          </>
                        )}
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Payment Method?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this payment method ending in {method.card?.last4}?
                            {method.isDefault && (
                              <span className="block mt-2 text-orange-600">
                                This is your default payment method. You will need to set another one as default.
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemove(method._id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodList;
