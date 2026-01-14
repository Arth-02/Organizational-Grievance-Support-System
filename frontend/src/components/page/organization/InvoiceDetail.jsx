import { useState } from "react";
import PropTypes from "prop-types";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  AlertTriangle,
  RefreshCw,
  Calendar,
  CreditCard,
  Building,
  Loader2,
  X,
} from "lucide-react";
import {
  useGetInvoiceQuery,
  useLazyDownloadInvoiceQuery,
} from "@/services/invoice.service";
import toast from "react-hot-toast";

/**
 * InvoiceDetail Component
 * Displays full invoice with line items and download PDF button
 * Can be used as a standalone component or within a modal
 *
 * @requirements 9.5
 */
const InvoiceDetail = ({ invoiceId, invoice: propInvoice, isModal = false, onClose }) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Fetch invoice if not provided as prop
  const {
    data: fetchedInvoiceData,
    isLoading,
    error,
    refetch,
  } = useGetInvoiceQuery(invoiceId, {
    skip: !invoiceId || !!propInvoice,
  });

  // Lazy query for downloading invoice
  const [triggerDownload] = useLazyDownloadInvoiceQuery();

  // Use prop invoice or fetched invoice
  const invoice = propInvoice || fetchedInvoiceData?.data || fetchedInvoiceData;

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
      month: "long",
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
  const handleDownload = async () => {
    if (!invoice) return;
    
    setDownloadingPdf(true);
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
      setDownloadingPdf(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <InvoiceDetailSkeleton isModal={isModal} />
    );
  }

  // Error state
  if (error) {
    return (
      <InvoiceDetailError 
        error={error} 
        onRetry={refetch} 
        isModal={isModal}
        onClose={onClose}
      />
    );
  }

  // No invoice found
  if (!invoice) {
    return (
      <InvoiceDetailEmpty isModal={isModal} onClose={onClose} />
    );
  }

  const statusBadge = getStatusBadge(invoice.status);
  const lineItems = invoice.lineItems || [];

  const content = (
    <>
      {/* Invoice Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Invoice {invoice.invoiceNumber}</h3>
            <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Issued on {formatDate(invoice.created_at || invoice.createdAt)}
          </p>
        </div>
        <Button
          onClick={handleDownload}
          disabled={downloadingPdf}
          className="w-full sm:w-auto"
        >
          {downloadingPdf ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Download PDF
        </Button>
      </div>

      <Separator className="mb-6" />

      {/* Invoice Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Billing Period */}
        {invoice.billingPeriod && (invoice.billingPeriod.start || invoice.billingPeriod.end) && (
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Billing Period</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(invoice.billingPeriod.start)} - {formatDate(invoice.billingPeriod.end)}
              </p>
            </div>
          </div>
        )}

        {/* Due Date */}
        {invoice.dueDate && (
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Due Date</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>
        )}

        {/* Paid Date */}
        {invoice.paidAt && (
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Paid On</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(invoice.paidAt)}
              </p>
            </div>
          </div>
        )}

        {/* Provider Info */}
        {invoice.providerData?.provider && (
          <div className="flex items-start gap-3">
            <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Payment Provider</p>
              <p className="text-sm text-muted-foreground capitalize">
                {invoice.providerData.provider}
              </p>
            </div>
          </div>
        )}
      </div>

      <Separator className="mb-6" />

      {/* Line Items Table */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-4">Line Items</h4>
        {lineItems.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.description || "Subscription"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity || 1}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(item.unitPrice || 0, invoice.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(item.amount || 0, invoice.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Subscription Charge</span>
              <span className="font-semibold">
                {formatAmount(invoice.amount, invoice.currency)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Total Summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total Amount</span>
          <span className="text-2xl font-bold text-primary">
            {formatAmount(invoice.amount, invoice.currency)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Currency: {invoice.currency?.toUpperCase() || "USD"}
        </p>
      </div>
    </>
  );

  // Render as modal or standalone card
  if (isModal) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Details
            </DialogTitle>
            <DialogDescription>
              View and download your invoice
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">{content}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Invoice Details
        </CardTitle>
        <CardDescription>
          View and download your invoice
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};

// Loading skeleton component
const InvoiceDetailSkeleton = ({ isModal }) => {
  const content = (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );

  if (isModal) {
    return (
      <Dialog open={true}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </DialogHeader>
          <div className="mt-4">{content}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};

// Error component
const InvoiceDetailError = ({ error, onRetry, isModal, onClose }) => {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold">Failed to load invoice</h3>
      <p className="text-muted-foreground mt-1">
        {error?.data?.message || "An error occurred while loading the invoice."}
      </p>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        {isModal && onClose && (
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardContent className="py-6">{content}</CardContent>
    </Card>
  );
};

// Empty state component
const InvoiceDetailEmpty = ({ isModal, onClose }) => {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium">Invoice not found</h3>
      <p className="text-muted-foreground mt-1">
        The requested invoice could not be found.
      </p>
      {isModal && onClose && (
        <Button variant="outline" className="mt-4" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      )}
    </div>
  );

  if (isModal) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardContent className="py-6">{content}</CardContent>
    </Card>
  );
};

InvoiceDetail.propTypes = {
  invoiceId: PropTypes.string,
  invoice: PropTypes.shape({
    _id: PropTypes.string,
    invoiceNumber: PropTypes.string,
    status: PropTypes.string,
    amount: PropTypes.number,
    currency: PropTypes.string,
    lineItems: PropTypes.arrayOf(
      PropTypes.shape({
        description: PropTypes.string,
        quantity: PropTypes.number,
        unitPrice: PropTypes.number,
        amount: PropTypes.number,
      })
    ),
    billingPeriod: PropTypes.shape({
      start: PropTypes.string,
      end: PropTypes.string,
    }),
    dueDate: PropTypes.string,
    paidAt: PropTypes.string,
    invoicePdfUrl: PropTypes.string,
    providerData: PropTypes.shape({
      provider: PropTypes.string,
      invoiceId: PropTypes.string,
      hostedInvoiceUrl: PropTypes.string,
    }),
    created_at: PropTypes.string,
    createdAt: PropTypes.string,
  }),
  isModal: PropTypes.bool,
  onClose: PropTypes.func,
};

InvoiceDetailSkeleton.propTypes = {
  isModal: PropTypes.bool,
};

InvoiceDetailError.propTypes = {
  error: PropTypes.object,
  onRetry: PropTypes.func,
  isModal: PropTypes.bool,
  onClose: PropTypes.func,
};

InvoiceDetailEmpty.propTypes = {
  isModal: PropTypes.bool,
  onClose: PropTypes.func,
};

export default InvoiceDetail;
