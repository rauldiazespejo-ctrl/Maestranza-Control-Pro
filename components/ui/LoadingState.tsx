import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Cargando...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "surface-glass flex flex-col items-center justify-center gap-3 rounded-lg p-8 text-center",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-gold" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
