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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Receipt,
  Download,
  AlertTriangle,
  RefreshCw,
  FileText,
  Loader2,
} from "lucide-react";
import {
  useGetInvoicesQuery,
  useLazyDownloadInvoiceQuery,
} from "@/services/invoice.service";
import toast from "react-hot-toast";

/**
 * BillingHistory Component
 * Displays invoices in table format with date, amount, status, and download link
 * Includes pagination for navigating through invoice history
 * 
 * @requirements 9.5
 */
const BillingHistory = () => {
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);
  const limit = 10;

  // Fetch invoices with pagination
  const {
    data: invoicesData,
    isLoading,
    error,
    refetch,
  } = useGetInvoicesQuery({ page, limit });

  // Lazy query for downloading invoice
  const [triggerDownload] = useLazyDownloadInvoiceQuery();

  const invoices = invoicesData?.data?.invoices || invoicesData?.data || [];
  const pagination = invoicesData?.data?.pagination || {
    page: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { label: "Paid", className: "bg-green-500/10 text-green-600 border-green-500/20" },
      pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
      failed: { label: "Failed", className: "bg-red-500/10 text-red-600 border-red-500/20" },
      refunded: { label: "Refunded", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      draft: { label: "Draft", className: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
      void: { label: "Void", className: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
    };
    return statusConfig[status] || { label: status, className: "bg-gray-500/10 text-gray-600 border-gray-500/20" };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format currency
  const formatAmount = (amount, currency = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Convert cents to dollars
  };

  // Handle invoice download
  const handleDownload = async (invoice) => {
    setDownloadingId(invoice._id);
    try {
      // If there's a direct PDF URL, use it
      if (invoice.invoicePdfUrl) {
        window.open(invoice.invoicePdfUrl, "_blank");
        toast.success("Invoice download started");
      } else if (invoice.providerData?.hostedInvoiceUrl) {
        // Use Stripe hosted invoice URL
        window.open(invoice.providerData.hostedInvoiceUrl, "_blank");
        toast.success("Invoice opened in new tab");
      } else {
        // Use the download endpoint
        const result = await triggerDownload(invoice._id).unwrap();
        if (result) {
          const link = document.createElement("a");
          link.href = result;
          link.download = `invoice-${invoice.invoiceNumber}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(result);
          toast.success("Invoice downloaded successfully");
        }
      }
    } catch {
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle pagination
  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold">Failed to load billing history</h3>
            <p className="text-muted-foreground mt-1">
              {error?.data?.message || "An error occurred while loading your invoices."}
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
              <Receipt className="h-5 w-5 text-primary" />
              Billing History
            </CardTitle>
            <CardDescription>
              View and download your past invoices
            </CardDescription>
          </div>
          {pagination.totalCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {pagination.totalCount} invoice{pagination.totalCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No invoices yet</h3>
            <p className="text-muted-foreground mt-1">
              Your billing history will appear here once you have invoices.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const statusBadge = getStatusBadge(invoice.status);
                    return (
                      <TableRow key={invoice._id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {formatDate(invoice.created_at || invoice.createdAt)}
                        </TableCell>
                        <TableCell>
                          {formatAmount(invoice.amount, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadge.className}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(invoice)}
                            disabled={downloadingId === invoice._id}
                          >
                            {downloadingId === invoice._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            <span className="ml-2 hidden sm:inline">Download</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={handlePrevPage}
                        disabled={!pagination.hasPrevPage}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={handleNextPage}
                        disabled={!pagination.hasNextPage}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BillingHistory;
