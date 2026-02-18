import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  /** Number of skeleton card rows */
  count?: number;
}

/** Configurable skeleton list for feed/list loading states */
export function LoadingSkeleton({ count = 3 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border/50 p-4">
          <div className="flex items-start gap-3 mb-3">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
