import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "Sin registros",
  description = "No se encontraron datos para mostrar en este momento.",
  className,
  icon,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong bg-navy-primary/35 p-8 text-center backdrop-blur-sm",
        className
      )}
    >
      {icon ?? <Inbox className="h-10 w-10 text-steel/60" />}
      <div className="space-y-1">
        <p className="font-heading text-sm font-semibold text-white">{title}</p>
        <p className="max-w-xs text-xs text-muted">{description}</p>
      </div>
    </div>
  );
}
