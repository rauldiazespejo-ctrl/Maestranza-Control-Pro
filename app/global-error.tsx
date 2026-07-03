"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalError] Error crítico capturado:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center bg-navy-dark px-4">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-alert-dark/30">
            <AlertTriangle className="h-10 w-10 text-alert" />
          </div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">
            Error Crítico
          </h1>

          <p className="mb-6 text-sm text-steel">
            Se produjo un error inesperado en la aplicación. Nuestro equipo ha sido notificado.
            Por favor, intenta recargar la página.
          </p>

          {error.digest && (
            <p className="mb-4 rounded-md bg-navy-light px-3 py-1.5 font-mono text-xs text-steel">
              Ref: {error.digest}
            </p>
          )}

          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Recargar página
          </Button>
        </div>
      </body>
    </html>
  );
}
