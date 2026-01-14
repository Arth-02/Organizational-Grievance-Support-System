import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import {
  Check,
  X,
  Crown,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  useUpgradeSubscriptionMutation,
  useDowngradeSubscriptionMutation,
} from "@/services/subscription.service";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

/**
 * PlanComparison Component
 * Displays all plans side-by-side with features comparison
 * Allows users to upgrade or downgrade their subscription
 * 
 * @requirements 9.3
 */
const PlanComparison = ({ 
  plans = [], 
  currentPlan, 
  subscription,
  onClose, 
  onPlanChange 
}) => {
  const [isAnnual, setIsAnnual] = useState(subscription?.billingCycle === "annual");
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [upgradeSubscription, { isLoading: isUpgrading }] = useUpgradeSubscriptionMutation();
  const [downgradeSubscription, { isLoading: isDowngrading }] = useDowngradeSubscriptionMutation();

  const isProcessing = isUpgrading || isDowngrading;

  // Sort plans by sortOrder or price
  const sortedPlans = [...plans].sort((a, b) => {
    if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
      return a.sortOrder - b.sortOrder;
    }
    return (a.monthlyPrice || 0) - (b.monthlyPrice || 0);
  });

  // Get plan tier index for comparison
  const getPlanTierIndex = (planName) => {
    const tierOrder = { starter: 0, professional: 1, enterprise: 2 };
    return tierOrder[planName?.toLowerCase()] ?? 1;
  };

  // Determine if plan is upgrade or downgrade
  const getPlanAction = (plan) => {
    const currentTier = getPlanTierIndex(currentPlan?.name);
    const targetTier = getPlanTierIndex(plan.name);
    
    if (targetTier > currentTier) return "upgrade";
    if (targetTier < currentTier) return "downgrade";
    return "current";
  };

  // Handle plan selection
  const handleSelectPlan = async (plan) => {
    const action = getPlanAction(plan);
    
    if (action === "current") return;

    setSelectedPlan(plan);

    try {
      if (action === "upgrade") {
        await upgradeSubscription({
          planId: plan._id,
          billingCycle: isAnnual ? "annual" : "monthly",
        }).unwrap();
        toast.success(`Successfully upgraded to ${plan.displayName || plan.name}!`);
      } else {
        await downgradeSubscription({
          planId: plan._id,
          billingCycle: isAnnual ? "annual" : "monthly",
        }).unwrap();
        toast.success(`Plan change scheduled. You'll be moved to ${plan.displayName || plan.name} at the end of your billing period.`);
      }
      onPlanChange?.();
    } catch (error) {
      toast.error(error?.data?.message || `Failed to ${action} plan`);
    } finally {
      setSelectedPlan(null);
    }
  };

  // Format price display
  const formatPrice = (plan) => {
    if (plan.monthlyPrice === 0) return "Free";
    if (plan.monthlyPrice === null || plan.monthlyPrice === undefined) return "Custom";
    
    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    return `$${price}`;
  };

  // Get period label
  const getPeriodLabel = (plan) => {
    if (plan.monthlyPrice === 0 || plan.monthlyPrice === null) return "";
    return isAnnual ? "/year" : "/month";
  };

  // Feature list for comparison
  const allFeatures = [
    { key: "maxUsers", label: "Users", format: (v) => v === -1 ? "Unlimited" : `Up to ${v}` },
    { key: "maxProjects", label: "Projects", format: (v) => v === -1 ? "Unlimited" : `Up to ${v}` },
    { key: "maxStorageBytes", label: "Storage", format: (v) => v === -1 ? "Unlimited" : formatStorage(v) },
    { key: "basic_grievance", label: "Grievance Tracking", isFeature: true },
    { key: "advanced_permissions", label: "Advanced Permissions", isFeature: true },
    { key: "custom_roles", label: "Custom Roles", isFeature: true },
    { key: "audit_logs", label: "Audit Logs", isFeature: true },
    { key: "api_access", label: "API Access", isFeature: true },
    { key: "sso", label: "SSO Integration", isFeature: true },
    { key: "priority_support", label: "Priority Support", isFeature: true },
    { key: "dedicated_support", label: "Dedicated Support", isFeature: true },
    { key: "custom_integrations", label: "Custom Integrations", isFeature: true },
  ];

  // Format storage bytes
  function formatStorage(bytes) {
    if (bytes === -1) return "Unlimited";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb}GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb}MB`;
  }

  // Check if plan has feature
  const hasFeature = (plan, featureKey) => {
    if (!plan) return false;
    return plan.features?.includes(featureKey);
  };

  // Get limit value
  const getLimitValue = (plan, limitKey) => {
    return plan?.limits?.[limitKey];
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Choose Your Plan
          </DialogTitle>
          <DialogDescription>
            Compare plans and select the one that best fits your needs
          </DialogDescription>
        </DialogHeader>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 py-4">
          <Label 
            htmlFor="billing-toggle" 
            className={cn(
              "text-sm cursor-pointer",
              !isAnnual ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <Label 
            htmlFor="billing-toggle" 
            className={cn(
              "text-sm cursor-pointer flex items-center gap-1",
              isAnnual ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            Annual
            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
              Save 17%
            </Badge>
          </Label>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedPlans.map((plan) => {
            const action = getPlanAction(plan);
            const isCurrent = action === "current";
            const isRecommended = plan.name?.toLowerCase() === "professional";
            const isSelected = selectedPlan?._id === plan._id;

            return (
              <div
                key={plan._id || plan.name}
                className={cn(
                  "relative flex flex-col rounded-xl border p-5 transition-all",
                  isCurrent && "border-primary bg-primary/5",
                  isRecommended && !isCurrent && "border-primary/50 shadow-lg",
                  !isCurrent && !isRecommended && "border-border hover:border-primary/30"
                )}
              >
                {/* Current Plan Badge */}
                {isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Current Plan
                  </Badge>
                )}

                {/* Recommended Badge */}
                {isRecommended && !isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                )}

                {/* Plan Header */}
                <div className="text-center mb-4 pt-2">
                  <h3 className="text-xl font-bold capitalize">
                    {plan.displayName || plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold">
                    {formatPrice(plan)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {getPeriodLabel(plan)}
                    </span>
                  </div>
                  {isAnnual && plan.monthlyPrice > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ${Math.round(plan.annualPrice / 12)}/month billed annually
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  variant={isCurrent ? "outline" : isRecommended ? "default" : "outline"}
                  className={cn(
                    "w-full mb-4",
                    isCurrent && "cursor-default"
                  )}
                  disabled={isCurrent || isProcessing}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isSelected && isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : action === "upgrade" ? (
                    <>
                      Upgrade
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Downgrade
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {/* Features List */}
                <div className="flex-1 space-y-2">
                  {/* Limits */}
                  {allFeatures.filter(f => !f.isFeature).map((feature) => {
                    const value = getLimitValue(plan, feature.key);
                    return (
                      <div key={feature.key} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-muted-foreground">
                          {feature.format(value)}
                        </span>
                        <span className="text-muted-foreground/60">
                          {feature.label}
                        </span>
                      </div>
                    );
                  })}

                  {/* Features */}
                  {allFeatures.filter(f => f.isFeature).map((feature) => {
                    const has = hasFeature(plan, feature.key);
                    return (
                      <div 
                        key={feature.key} 
                        className={cn(
                          "flex items-center gap-2 text-sm",
                          !has && "opacity-50"
                        )}
                      >
                        {has ? (
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className={has ? "text-muted-foreground" : "text-muted-foreground/60"}>
                          {feature.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
          <p>
            All plans include a 14-day free trial for Professional tier.
            {" "}Downgrades take effect at the end of your billing period.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanComparison;
