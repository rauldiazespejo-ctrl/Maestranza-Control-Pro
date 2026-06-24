import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  className?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Error al cargar",
  description = "Ocurrió un problema al obtener los datos. Intenta nuevamente.",
  className,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-fire-bright/35 bg-fire/10 p-8 text-center shadow-industrial-sm",
        className
      )}
    >
      <AlertTriangle className="h-10 w-10 text-fire-bright" />
      <div className="space-y-1">
        <p className="font-heading text-sm font-semibold text-white">{title}</p>
        <p className="max-w-xs text-xs text-muted">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
