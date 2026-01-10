import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const TaskModalSkeleton = () => {
  return (
    <div className="bg-card rounded-xl w-full max-h-[90vh] overflow-hidden flex flex-col" tabIndex="-1" aria-hidden="true">
      {/* Header */}
      <div className="p-4 flex items-start justify-between border-b border-border">
        <div className="flex-1">
          {/* Issue Key */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-4 bg-muted" />
            <Skeleton className="h-4 w-24 bg-muted" />
          </div>
          
          {/* Title */}
          <Skeleton className="h-7 w-96 mb-3 bg-muted" />
          
          {/* Badges */}
          <div className="flex items-center gap-2 mt-3">
            <Skeleton className="h-5 w-16 bg-muted" />
            <Skeleton className="h-5 w-20 bg-muted" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 bg-muted" />
      </div>

      <Separator className="w-[97%] mx-auto bg-border" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 flex gap-6">
          {/* Left Column - Main Content */}
          <div className="flex-1 space-y-6">
            {/* Reporter and Assignee Info */}
            <div className="flex flex-wrap gap-6">
              {/* Reporter */}
              <div>
                <Skeleton className="h-3 w-16 mb-2 bg-muted" />
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-7 w-7 rounded-full bg-muted" />
                  <Skeleton className="h-4 w-24 bg-muted" />
                </div>
              </div>

              {/* Assignee */}
              <div>
                <Skeleton className="h-3 w-16 mb-2 bg-muted" />
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-7 w-7 rounded-full bg-muted" />
                  <Skeleton className="h-4 w-24 bg-muted" />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <Skeleton className="h-3 w-16 mb-2 bg-muted" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 bg-muted" />
                  <Skeleton className="h-4 w-24 bg-muted" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-5 bg-muted" />
                <Skeleton className="h-4 w-24 bg-muted" />
              </div>
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
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-4 w-4 bg-muted" />
                <Skeleton className="h-4 w-28 bg-muted" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg bg-muted" />
                ))}
              </div>
            </div>

            {/* Comments */}
            <div>
              <Skeleton className="h-4 w-20 mb-3 bg-muted" />
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32 bg-muted" />
                      <Skeleton className="h-4 w-full bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity */}
            <div>
              <Skeleton className="h-4 w-16 mb-3 bg-muted" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-6 w-6 rounded-full bg-muted flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="w-56 space-y-4 bg-muted/50 border border-border p-4 rounded-xl">
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

            {/* Type */}
            <div className="space-y-3">
              <Skeleton className="h-3 w-10 bg-muted" />
              <Skeleton className="h-9 w-full rounded-md bg-background" />
            </div>

            {/* Assignee */}
            <div className="space-y-3">
              <Skeleton className="h-3 w-16 bg-muted" />
              <Skeleton className="h-9 w-full rounded-md bg-background" />
            </div>

            {/* Due Date */}
            <div className="space-y-3">
              <Skeleton className="h-3 w-16 bg-muted" />
              <Skeleton className="h-9 w-full rounded-md bg-background" />
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-3 border-t border-border">
              <Skeleton className="h-3 w-14 bg-muted" />
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

export default TaskModalSkeleton;
