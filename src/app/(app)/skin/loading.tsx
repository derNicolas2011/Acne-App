import { Skeleton, SkeletonCard } from '@/components/shared/states';

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="mt-5 h-14 w-full rounded-2xl" />

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="mt-4 h-[220px] w-full rounded-xl" />
      </div>

      <div className="mt-6 space-y-2">
        <SkeletonCard lines={1} />
        <SkeletonCard lines={1} />
      </div>
    </div>
  );
}
