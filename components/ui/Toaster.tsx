"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Wrapper de Sonner Toaster para notificaciones toast en toda la aplicacion.
 * Usa tokens CSS del sistema de diseño para coherencia visual.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--color-popover)",
          color: "var(--color-popover-foreground)",
          border: "1px solid var(--color-border-subtle)",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}
