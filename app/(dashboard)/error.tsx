"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("[DashboardError] Error en dashboard:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
          <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>

        <h2 className="mb-2 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Error al cargar el panel
        </h2>

        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          No se pudo cargar esta seccion del dashboard. Intenta nuevamente.
        </p>

        {error.digest && (
          <p className="mb-4 rounded-md bg-gray-100 px-3 py-1.5 font-mono text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            Ref: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
