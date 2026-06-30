"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalError] Error critico capturado:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Error Critico
          </h1>

          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Se produjo un error inesperado en la aplicacion. Nuestro equipo ha sido notificado.
            Por favor, intenta recargar la pagina.
          </p>

          {error.digest && (
            <p className="mb-4 rounded-md bg-gray-100 px-3 py-1.5 font-mono text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Ref: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.058M20.9 14.25A10.053 10.053 0 0021.1 12a10 10 0 00-19.04-3.05M4 20h16"
              />
            </svg>
            Recargar pagina
          </button>
        </div>
      </body>
    </html>
  );
}
