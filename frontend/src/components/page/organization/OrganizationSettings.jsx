import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { CustomInput } from "@/components/ui/input";
import { CustomTextarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  Globe,
  MapPin,
  Save,
  Trash2,
  AlertTriangle,
  Loader2,
  Camera,
  X,
  CreditCard,
} from "lucide-react";
import {
  useGetOrganizationByIdQuery,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
} from "@/services/organization.service";
import { logout } from "@/features/userSlice";
import toast from "react-hot-toast";

// Subscription-related components
import SubscriptionSettings from "./SubscriptionSettings";
import PaymentMethodList from "./PaymentMethodList";
import BillingHistory from "./BillingHistory";
import AddPaymentMethod from "./AddPaymentMethod";

// Section component for visual grouping (matching AddUpdateEmployee pattern)
const FormSection = ({ icon: Icon, title, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 pb-2 border-b border-border">
      <Icon size={18} className="text-primary" />
      <h3 className="font-medium text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);

const OrganizationSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector((state) => state.user.user);
  const userPermissions = useSelector((state) => state.user.permissions);

  const hasUpdatePermission = userPermissions.includes("UPDATE_ORGANIZATION");
  const hasDeletePermission = userPermissions.includes("DELETE_ORGANIZATION");
  const hasAnyPermission = hasUpdatePermission || hasDeletePermission;

  // Get active tab from URL or default to "general"
  const activeTab = searchParams.get("tab") || "general";
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);

  const { data, isLoading, error } = useGetOrganizationByIdQuery(
    user?.organization_id?._id,
    { skip: !user?.organization_id?._id }
  );

  const [updateOrganization, { isLoading: isUpdating }] =
    useUpdateOrganizationMutation();
  const [deleteOrganization, { isLoading: isDeleting }] =
    useDeleteOrganizationMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    description: "",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Populate form when data loads
  useEffect(() => {
    if (data?.data) {
      const org = data.data;
      setFormData({
        name: org.name || "",
        email: org.email || "",
        phone: org.phone || "",
        website: org.website || "",
        address: org.address || "",
        city: org.city || "",
        state: org.state || "",
        country: org.country || "",
        pincode: org.pincode || "",
        description: org.description || "",
      });
      if (org.logo_id?.url) {
        setLogoPreview(org.logo_id.url);
      } else {
        setLogoPreview(null);
      }
      setRemoveLogo(false);
    }
  }, [data]);

  // Handle tab change
  const handleTabChange = (value) => {
    setSearchParams({ tab: value });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setRemoveLogo(false);
      setHasChanges(true);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
    setHasChanges(true);
  };

  const handleAvatarClick = () => {
    if (hasUpdatePermission) {
      fileInputRef.current?.click();
    }
  };

  const handleInputChange = (e) => {
    if (!hasUpdatePermission) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleUpdate = async () => {
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key]);
      });
      if (logoFile) {
        submitData.append("logo", logoFile);
      }
      if (removeLogo) {
        submitData.append("remove_logo", "true");
      }
      await updateOrganization(submitData).unwrap();
      
      toast.success("Organization updated successfully");
      setHasChanges(false);
      setLogoFile(null);
      setRemoveLogo(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update organization");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrganization().unwrap();
      toast.success("Organization deleted successfully");
      dispatch(logout());
      navigate("/login");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete organization");
    }
  };

  const getInitials = () => {
    return formData.name?.substring(0, 2)?.toUpperCase() || "OR";
  };

  if (isLoading) {
    return (
      <MainLayout title="Organization Settings">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error || !data?.data) {
    return (
      <MainLayout title="Organization Settings">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Organization not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Organization Settings">
      <div className="max-w-4xl space-y-6">
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
            <TabsTrigger value="general" className="gap-2">
              <Building2 className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-8 mt-6">
            {/* Organization Details Form */}
            {hasAnyPermission && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Organization Details
                  </CardTitle>
                  <CardDescription>
                    {hasUpdatePermission
                      ? "Update your organization's information"
                      : "View your organization's information (read-only)"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-10">
                  {/* Logo Section */}
                  <div className="flex items-center gap-6">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Avatar with hover effect */}
                    <div className="relative">
                      <div
                        onClick={handleAvatarClick}
                        className={`relative group ${hasUpdatePermission ? "cursor-pointer" : ""}`}
                      >
                        <Avatar className="h-20 w-20 border-2 border-border">
                          <AvatarImage src={logoPreview} />
                          <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        {hasUpdatePermission && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      {hasUpdatePermission && logoPreview && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-1 -right-1 h-6 w-6 rounded-full shadow-md"
                          onClick={handleRemoveLogo}
                          title="Remove logo"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium">{formData.name || "Organization"}</h4>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-muted-foreground">
                          {hasUpdatePermission
                            ? "Click on the logo to change it"
                            : "Organization logo"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Basic Information */}
                  <FormSection icon={Building2} title="Basic Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CustomInput
                        label="Organization Name"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={!hasUpdatePermission}
                        placeholder="Enter organization name"
                      />
                      <CustomInput
                        label="Email"
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!hasUpdatePermission}
                        placeholder="contact@organization.com"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <CustomInput
                        label="Phone"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!hasUpdatePermission}
                        placeholder="+1 234 567 890"
                      />
                      <CustomInput
                        label="Website"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        disabled={!hasUpdatePermission}
                        placeholder="https://organization.com"
                      />
                    </div>
                  </FormSection>

                  {/* Address Section */}
                  <FormSection icon={MapPin} title="Address">
                    <CustomTextarea
                      label="Street Address"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!hasUpdatePermission}
                      placeholder="Enter street address"
                      className="min-h-[80px]"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <CustomInput
                        label="City"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        disabled={!hasUpdatePermission}
                        placeholder="City"
                      />
                      <CustomInput
                        label="State"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        disabled={!hasUpdatePermission}
                        placeholder="State"
                      />
                      <CustomInput
                        label="Country"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        disabled={!hasUpdatePermission}
                        placeholder="Country"
                      />
                      <CustomInput
                        label="Pincode"
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        disabled={!hasUpdatePermission}
                        placeholder="Pincode"
                      />
                    </div>
                  </FormSection>

                  {/* About Section */}
                  <FormSection icon={Globe} title="About">
                    <CustomTextarea
                      label="Description"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={!hasUpdatePermission}
                      placeholder="Brief description about your organization"
                      className="min-h-[100px]"
                    />
                  </FormSection>

                  {/* Save Button */}
                  {hasUpdatePermission && (
                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleUpdate}
                        disabled={isUpdating || !hasChanges}
                        className="min-w-[140px]"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            {hasAnyPermission && (
              <Card className="border-red-500/30 bg-red-500/5 dark:bg-red-500/10">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-red-500/30 bg-background">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-red-600 dark:text-red-400">
                        Delete Organization
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete this organization. All users will be
                        deactivated.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          disabled={isDeleting || !hasDeletePermission}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Organization
                          </AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-3">
                              <p>
                                Are you sure you want to delete{" "}
                                <strong className="text-foreground">
                                  {formData.name}
                                </strong>
                                ?
                              </p>
                              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                                  This action will:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                  <li>Deactivate all users in the organization</li>
                                  <li>Prevent anyone from logging in</li>
                                  <li>Archive all organization data</li>
                                </ul>
                              </div>
                              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                This action cannot be undone. You will be logged out
                                immediately.
                              </p>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete Organization"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No permissions message for General tab */}
            {!hasAnyPermission && (
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="p-4 rounded-full bg-muted mb-4">
                      <Building2 className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold">No Access</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm">
                      You don&apos;t have permission to manage organization
                      settings. Contact your administrator for access.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={() => navigate("/dashboard")}
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6 mt-6">
            {/* Subscription Settings - Current Plan & Usage */}
            <SubscriptionSettings />

            {/* Payment Methods */}
            <PaymentMethodList 
              onAddPaymentMethod={() => setShowAddPaymentMethod(true)} 
            />

            {/* Billing History */}
            <BillingHistory />

            {/* Add Payment Method Modal */}
            <AddPaymentMethod 
              open={showAddPaymentMethod}
              onOpenChange={setShowAddPaymentMethod}
              onSuccess={() => setShowAddPaymentMethod(false)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default OrganizationSettings;
