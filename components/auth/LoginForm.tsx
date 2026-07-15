"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { AlertCircle, IdCard, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const authErrorMessages: Record<string, string> = {
  CredentialsSignin: "RUT o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.",
  AccessDenied: "No tienes permisos para acceder a este sistema.",
  Configuration: "La autenticación no está configurada correctamente.",
};

const credentialErrorMessages: Record<string, string> = {
  credenciales_invalidas: "RUT o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.",
  credentials: "RUT o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.",
  intentos_temporales: "Demasiados intentos fallidos. Espera unos minutos e intenta nuevamente.",
  servicio_no_disponible: "No se pudo validar el acceso con la base de datos. Revisa la configuración e intenta nuevamente.",
};

interface LoginFormProps {
  authError?: string;
  errorCode?: string;
}

export function LoginForm({ authError, errorCode }: LoginFormProps) {
  const [rut, setRut] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const authMessage =
    authError === "CredentialsSignin" && errorCode
      ? credentialErrorMessages[errorCode] ?? authErrorMessages.CredentialsSignin
      : authError
        ? authErrorMessages[authError] ?? "No se pudo iniciar sesión. Intenta nuevamente."
        : null;
  const displayError = error ?? authMessage;

  const formatRut = (value: string) => {
    let raw = value.replace(/[^0-9kK]/g, "");
    if (raw.length > 1) {
      raw = raw.slice(0, -1) + "-" + raw.slice(-1);
    }
    const parts = raw.split("-");
    const body = parts[0] ?? "";
    if (body.length > 3) {
      parts[0] = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    return parts.join("-");
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRut(formatRut(e.target.value));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // FIX AUTH-002: usar redirect: true para evitar race condition
    // signIn con redirect: true fuerza navegación full-page cuando el
    // servidor setea la cookie, eliminando la ventana de race.
    await signIn("credentials", {
      rut,
      password,
      redirect: true,
      callbackUrl: "/dashboard",
    });

    // Línea inalcanzable si redirect: true funciona; se mantiene por si
    // el provider devuelve un error antes del redirect.
    setLoading(false);
  }

  return (
    <form method="post" onSubmit={handleSubmit} className="space-y-5">
      {displayError && (
        <div
          className="flex items-start gap-2 rounded-md border border-red-400/35 bg-red-500/15 p-3 text-sm text-white shadow-sm"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
          <span>{displayError}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="rut" className="text-sm font-medium text-steel">
          RUT
        </label>
        <div className="relative">
          <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" aria-hidden="true" />
          <Input
            id="rut"
            name="rut"
            type="text"
            required
            autoComplete="username"
            inputMode="text"
            placeholder="Ej.: 12.345.678-9"
            value={rut}
            onChange={handleRutChange}
            aria-invalid={Boolean(displayError)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label htmlFor="password" className="text-sm font-medium text-steel">
            Contraseña
          </label>
          <span className="text-xs text-steel/60 italic">Requerida</span>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" aria-hidden="true" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(displayError)}
            className="pl-10"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className={cn("w-full", loading && "opacity-80")}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Ingresando…
          </>
        ) : (
          "Ingresar"
        )}
      </Button>
    </form>
  );
}
