import { useParams, useNavigate } from "react-router-dom";
import { useGetAuditLogByIdQuery } from "@/services/admin.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Building2, 
  Globe, 
  Monitor,
  FileText,
  Activity,
  Info
} from "lucide-react";

const AuditLogDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetAuditLogByIdQuery(id);

  const log = data?.data;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionColor = (action) => {
    if (action?.includes("DELETED")) return "destructive";
    if (action?.includes("CREATED") || action?.includes("APPROVED") || action?.includes("ACTIVATED")) return "default";
    if (action?.includes("SUSPENDED") || action?.includes("DEACTIVATED") || action?.includes("REJECTED")) return "secondary";
    if (action?.includes("UPDATED") || action?.includes("CHANGED")) return "outline";
    return "outline";
  };

  const getEntityColor = (entityType) => {
    const colors = {
      Organization: "bg-blue-100 text-blue-800",
      User: "bg-green-100 text-green-800",
      Role: "bg-orange-100 text-orange-800",
      Grievance: "bg-red-100 text-red-800",
      Department: "bg-yellow-100 text-yellow-800",
    };
    return colors[entityType] || "bg-gray-100 text-gray-800";
  };

  const renderMetadata = (metadata) => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return <p className="text-muted-foreground text-sm">No additional metadata</p>;
    }

    return (
      <div className="space-y-3">
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key} className="border-b pb-2 last:border-0">
            <p className="text-sm font-medium text-muted-foreground capitalize">
              {key.replace(/_/g, " ").replace(/([A-Z])/g, " $1")}
            </p>
            {typeof value === "object" ? (
              <pre className="text-sm bg-muted p-2 rounded mt-1 overflow-x-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <p className="text-sm">{String(value)}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Failed to load audit log details</p>
        <Button variant="outline" onClick={() => navigate("/admin/audit-logs")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Audit Logs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/audit-logs")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Audit Log Details</h1>
            <p className="text-muted-foreground text-sm">ID: {log._id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={getActionColor(log.action)}>{log.action?.replace(/_/g, " ")}</Badge>
          <Badge className={getEntityColor(log.entity_type)}>{log.entity_type}</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Action Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Action Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Action</p>
              <Badge variant={getActionColor(log.action)} className="mt-1">
                {log.action?.replace(/_/g, " ")}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm mt-1">{log.description}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" /> Timestamp
              </p>
              <p className="text-sm mt-1">{formatDate(log.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Entity Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Entity Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entity Type</p>
              <Badge className={`${getEntityColor(log.entity_type)} mt-1`}>
                {log.entity_type}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entity Name</p>
              <p className="text-sm mt-1">{log.entity_name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Entity ID</p>
              <p className="mt-1 font-mono text-xs">{log.entity_id || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Performer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Performed By
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {log.performed_by ? (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-sm mt-1">
                    {log.performed_by.firstname} {log.performed_by.lastname}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p className="text-sm mt-1">@{log.performed_by.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm mt-1">{log.performed_by.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="mt-1 font-mono text-xs">{log.performed_by._id}</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">System / Unknown</p>
            )}
          </CardContent>
        </Card>

        {/* Organization & Request Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Context Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Building2 className="h-4 w-4" /> Organization
              </p>
              <p className="text-sm mt-1">
                {log.organization_id?.name || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Globe className="h-4 w-4" /> IP Address
              </p>
              <p className="text-sm mt-1 font-mono">{log.ip_address || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Monitor className="h-4 w-4" /> User Agent
              </p>
              <p className="mt-1 text-xs break-all">{log.user_agent || "N/A"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Additional Metadata
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderMetadata(log.metadata)}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogDetails;
