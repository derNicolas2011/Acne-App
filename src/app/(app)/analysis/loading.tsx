import { Skeleton, SkeletonCard } from '@/components/shared/states';

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="mt-5 h-11 w-full rounded-xl" />

      <div className="mt-6 space-y-3">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  );
}
