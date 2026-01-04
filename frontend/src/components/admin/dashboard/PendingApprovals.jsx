import { useState } from "react";
import { Building2, Check, X, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useApproveOrganizationMutation } from "@/services/admin.service";
import toast from "react-hot-toast";

const PendingApprovals = ({ organizations = [], isLoading }) => {
  const [approveOrganization, { isLoading: isApproving }] = useApproveOrganizationMutation();
  const [processingId, setProcessingId] = useState(null);

  const pendingOrgs = organizations.filter((org) => !org.is_approved);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await approveOrganization(id).unwrap();
      toast.success("Organization approved successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to approve organization");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4">Pending Approvals</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-muted/50 rounded-lg animate-pulse">
              <div className="h-5 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Pending Approvals</h3>
        {pendingOrgs.length > 0 && (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-600 rounded-full">
            {pendingOrgs.length} pending
          </span>
        )}
      </div>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-3">
          {pendingOrgs.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No pending approvals
              </p>
            </div>
          ) : (
            pendingOrgs.map((org) => (
              <div
                key={org._id}
                className="p-4 bg-muted/30 border border-border/50 rounded-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{org.name}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{org.email}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleApprove(org._id)}
                      disabled={isApproving && processingId === org._id}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={isApproving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PendingApprovals;
