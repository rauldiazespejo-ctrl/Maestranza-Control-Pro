"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Wrapper de Sonner Toaster para notificaciones toast en toda la aplicacion.
 * Se integra en el layout principal.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#1a1a3e",
          color: "#ffffff",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      }}
    />
  );
}
