"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, HardHat } from "lucide-react";
import Link from "next/link";

interface PortalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PortalError({ error, reset }: PortalErrorProps) {
  useEffect(() => {
    console.error("[PortalError] Error en portal cliente:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan/15">
          <AlertTriangle className="h-8 w-8 text-cyan-bright" />
        </div>

        <h2 className="mb-2 text-xl font-semibold tracking-tight text-white">
          Error al cargar el portal
        </h2>

        <p className="mb-4 text-sm text-steel">
          No se pudo cargar esta sección del portal de cliente. Intenta nuevamente.
        </p>

        {error.digest && (
          <p className="mb-4 rounded-md bg-navy-light px-3 py-1.5 font-mono text-xs text-steel">
            Ref: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="/portal/dashboard">
              <HardHat className="h-4 w-4" />
              Mi Panel
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
