"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log del error para monitoreo
    console.error("[ErrorBoundary] Error capturado:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>

        <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Algo salio mal
        </h2>

        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Se produjo un error inesperado. Intenta recargar la pagina o vuelve al inicio.
        </p>

        {error.digest && (
          <p className="mb-4 rounded-md bg-gray-100 px-3 py-1.5 font-mono text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            Ref: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={reset}
            variant="default"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
