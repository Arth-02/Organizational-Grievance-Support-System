import { Skeleton } from "@/components/ui/skeleton";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const GrievanceModalSkeleton = () => {
  return (
      <div className="bg-slate-800 rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" tabIndex="-1" aria-hidden="true">
        <DialogHeader>
          <DialogTitle className="p-4 flex items-start justify-between border-slate-700">
            <div className="flex-1">
              <Skeleton className="h-7 w-96 mb-3" />
              <div className="flex items-center gap-2 mt-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <Separator className="w-[97%] mx-auto dark:bg-white/10 h-[1px]" />

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 flex gap-6">
            {/* Left Column - Main Content */}
            <div className="flex-1 space-y-6">
              <div className="flex flex-wrap gap-6">
                {/* Reported By */}
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Skeleton className="h-4 w-32 mb-4" />
                <div className="rounded-lg border border-slate-700 overflow-hidden">
                  <div className="bg-slate-900/50 p-2 border-b border-slate-700 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-8" />
                    ))}
                  </div>
                  <div className="p-3">
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded"
                    >
                      <Skeleton className="h-9 w-9" />
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 w-9" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="w-48 space-y-12">
              {/* Status */}
              <div className="space-y-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-full" />

                <Skeleton className="h-4 w-16 mt-4 mb-2" />
                <Skeleton className="h-6 w-full" />
              </div>

              {/* Add to card */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-full" />
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>

              {/* Created date */}
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default GrievanceModalSkeleton;