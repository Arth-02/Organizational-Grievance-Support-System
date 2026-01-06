import { Skeleton } from "@/components/ui/skeleton";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const GrievanceModalSkeleton = () => {
  return (
      <div className="bg-card rounded-xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-border shadow-xl" tabIndex="-1" aria-hidden="true">
        <DialogHeader>
          <DialogTitle className="p-4 flex items-start justify-between">
            <div className="flex-1">
              <Skeleton className="h-7 w-96 mb-3 bg-muted" />
              <div className="flex items-center gap-2 mt-3">
                <Skeleton className="h-5 w-16 bg-muted" />
                <Skeleton className="h-5 w-20 bg-muted" />
              </div>
            </div>
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <Separator className="w-[97%] mx-auto bg-border" />

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 flex gap-6">
            {/* Left Column - Main Content */}
            <div className="flex-1 space-y-6">
              <div className="flex flex-wrap gap-6">
                {/* Reported By */}
                <div>
                  <Skeleton className="h-3 w-20 mb-2 bg-muted" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-full bg-muted" />
                    <Skeleton className="h-4 w-24 bg-muted" />
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <Skeleton className="h-3 w-20 mb-2 bg-muted" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-full bg-muted" />
                    <Skeleton className="h-4 w-24 bg-muted" />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <Skeleton className="h-3 w-20 mb-2 bg-muted" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-full bg-muted" />
                    <Skeleton className="h-4 w-24 bg-muted" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Skeleton className="h-3 w-32 mb-3 bg-muted" />
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-full bg-muted" />
                    <Skeleton className="h-4 w-3/4 bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <Skeleton className="h-3 w-24 mb-3 bg-muted" />
                <div className="flex gap-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-24 rounded-lg bg-muted" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="w-52 space-y-4 bg-muted/50 p-4 rounded-xl">
              {/* Status */}
              <div className="space-y-3">
                <Skeleton className="h-3 w-12 bg-muted" />
                <Skeleton className="h-9 w-full rounded-md bg-background" />
              </div>

              {/* Priority */}
              <div className="space-y-3">
                <Skeleton className="h-3 w-14 bg-muted" />
                <Skeleton className="h-9 w-full rounded-md bg-background" />
              </div>

              {/* Add to card */}
              <div className="space-y-3 pt-3 border-t border-border">
                <Skeleton className="h-3 w-20 bg-muted" />
                <Skeleton className="h-8 w-full rounded-md bg-background" />
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-3 border-t border-border">
                <Skeleton className="h-3 w-14 bg-muted" />
                <Skeleton className="h-8 w-full rounded-md bg-background" />
                <Skeleton className="h-8 w-full rounded-md bg-background" />
              </div>

              {/* Created date */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-muted" />
                  <Skeleton className="h-4 w-28 bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default GrievanceModalSkeleton;