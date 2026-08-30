import { Skeleton, SkeletonCard } from '@/components/shared/states';

/** Generischer Ladezustand für alle Seiten der App-Gruppe. */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-2 h-4 w-56" />

      <div className="mt-6 space-y-3">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  );
}
