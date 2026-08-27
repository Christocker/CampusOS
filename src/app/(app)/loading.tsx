import { Skeleton } from "@/components/ui/Badge";

export default function AppLoading() {
  return (
    <div className="space-y-5 pt-2">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-5 w-32" />
      <div className="space-y-2.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
