import { LoadingState } from "@/components/ui/LoadingState";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <LoadingState
        message="Actualizando información operacional..."
        className="min-h-40"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-lg border border-hairline bg-surface-2"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2" aria-hidden="true">
        <div className="h-72 animate-pulse rounded-lg border border-hairline bg-surface-2" />
        <div className="h-72 animate-pulse rounded-lg border border-hairline bg-surface-2" />
      </div>
    </div>
  );
}
