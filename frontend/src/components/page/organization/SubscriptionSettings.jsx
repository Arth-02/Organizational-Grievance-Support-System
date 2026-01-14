import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  useGetCurrentSubscriptionQuery,
  useGetPlansQuery,
  useGetUsagePercentagesQuery,
  useCancelSubscriptionMutation,
} from "@/services/subscription.service";
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
import UsageMetrics from "./UsageMetrics";
import PlanComparison from "./PlanComparison";
import toast from "react-hot-toast";

/**
 * SubscriptionSettings Component
 * Displays current subscription plan, status, billing cycle, and usage metrics
 * Provides upgrade/downgrade functionality
 * 
 * @requirements 9.1, 9.2
 */
const SubscriptionSettings = () => {
  const navigate = useNavigate();
  const [showPlanComparison, setShowPlanComparison] = useState(false);

  // Fetch current subscription data
  const {
    data: subscriptionData,
    isLoading: isLoadingSubscription,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useGetCurrentSubscriptionQuery();

  // Fetch available plans
  const {
    data: plansData,
    isLoading: isLoadingPlans,
  } = useGetPlansQuery();

  // Fetch usage percentages
  const {
    data: usageData,
    isLoading: isLoadingUsage,
  } = useGetUsagePercentagesQuery();

  // Cancel subscription mutation
  const [cancelSubscription, { isLoading: isCancelling }] = useCancelSubscriptionMutation();

  const subscription = subscriptionData?.data?.subscription || subscriptionData?.data;
  const plan = subscriptionData?.data?.plan || subscription?.plan_id;
  const usage = usageData?.data || usageData;
  const plans = plansData?.data || plansData || [];

  // Get status badge variant
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: "default", label: "Active", className: "bg-green-500/10 text-green-600 border-green-500/20" },
      trialing: { variant: "secondary", label: "Trial", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      past_due: { variant: "destructive", label: "Past Due", className: "bg-red-500/10 text-red-600 border-red-500/20" },
      cancelled: { variant: "outline", label: "Cancelled", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
      expired: { variant: "destructive", label: "Expired", className: "bg-red-500/10 text-red-600 border-red-500/20" },
      pending: { variant: "secondary", label: "Pending", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    };
    return statusConfig[status] || { variant: "outline", label: status, className: "" };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription({ immediate: false }).unwrap();
      toast.success("Subscription will be cancelled at the end of the billing period");
      refetchSubscription();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to cancel subscription");
    }
  };

  // Determine if upgrade/downgrade is possible
  const canUpgrade = plan?.name !== "enterprise";
  const canDowngrade = plan?.name !== "starter";

  // Loading state
  if (isLoadingSubscription || isLoadingPlans) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (subscriptionError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold">Failed to load subscription</h3>
            <p className="text-muted-foreground mt-1">
              {subscriptionError?.data?.message || "An error occurred while loading your subscription."}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => refetchSubscription()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusBadge = getStatusBadge(subscription?.status);

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </div>
            <Badge className={statusBadge.className}>
              {statusBadge.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 border">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold capitalize">
                {plan?.displayName || plan?.name || "No Plan"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {plan?.description || "No description available"}
              </p>
            </div>
            <div className="text-right">
              {plan?.monthlyPrice === 0 ? (
                <div className="text-2xl font-bold text-green-600">Free</div>
              ) : (
                <div>
                  <div className="text-2xl font-bold">
                    ${subscription?.billingCycle === "annual" 
                      ? plan?.annualPrice /100
                      : plan?.monthlyPrice / 100}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{subscription?.billingCycle === "annual" ? "year" : "month"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Billing Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="p-2 rounded-full bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Billing Cycle</p>
                <p className="font-medium capitalize">{subscription?.billingCycle || "Monthly"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="p-2 rounded-full bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Period Start</p>
                <p className="font-medium">{formatDate(subscription?.currentPeriodStart)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="p-2 rounded-full bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {subscription?.cancelAtPeriodEnd ? "Cancels On" : "Renews On"}
                </p>
                <p className="font-medium">{formatDate(subscription?.currentPeriodEnd)}</p>
              </div>
            </div>
          </div>

          {/* Trial Information */}
          {subscription?.status === "trialing" && subscription?.trialEnd && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 text-blue-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Trial Period</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Your trial ends on {formatDate(subscription.trialEnd)}. 
                Add a payment method to continue using all features.
              </p>
            </div>
          )}

          {/* Cancellation Notice */}
          {subscription?.cancelAtPeriodEnd && (
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Subscription Ending</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Your subscription will end on {formatDate(subscription.currentPeriodEnd)}. 
                You'll retain access until then.
              </p>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {canUpgrade && (
              <Button
                onClick={() => setShowPlanComparison(true)}
                className="gap-2"
              >
                <ArrowUpRight className="h-4 w-4" />
                Upgrade Plan
              </Button>
            )}
            {canDowngrade && plan?.name !== "starter" && (
              <Button
                variant="outline"
                onClick={() => setShowPlanComparison(true)}
                className="gap-2"
              >
                <ArrowDownRight className="h-4 w-4" />
                Change Plan
              </Button>
            )}
            {subscription?.status === "active" && !subscription?.cancelAtPeriodEnd && plan?.name !== "starter" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your subscription will remain active until {formatDate(subscription?.currentPeriodEnd)}. 
                      After that, you'll be downgraded to the Starter plan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        "Cancel Subscription"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      <UsageMetrics 
        usage={usage} 
        plan={plan} 
        isLoading={isLoadingUsage} 
      />

      {/* Plan Comparison Modal */}
      {showPlanComparison && (
        <PlanComparison
          plans={plans}
          currentPlan={plan}
          subscription={subscription}
          onClose={() => setShowPlanComparison(false)}
          onPlanChange={() => {
            setShowPlanComparison(false);
            refetchSubscription();
          }}
        />
      )}
    </div>
  );
};

export default SubscriptionSettings;
