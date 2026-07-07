"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BrandLockup } from "@/components/brand/BrandLockup";

export function PortalLoginForm({ authError }: { authError?: string }) {
  const [rut, setRut] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState(authError || "");
  const [loading, setLoading] = React.useState(false);

  const formatRut = (value: string) => {
    let raw = value.replace(/[^0-9kK]/g, "");
    if (raw.length > 1) {
      raw = raw.slice(0, -1) + "-" + raw.slice(-1);
    }
    const parts = raw.split('-');
    const body = parts[0] ?? "";
    if (body.length > 3) {
      parts[0] = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    return parts.join('-');
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRut(formatRut(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // signIn con redirect: true
    await signIn("credentials", {
      rut,
      password,
      redirect: true,
      callbackUrl: "/portal/dashboard",
    });
    // Si falla, el middleware/auth.js hara redirect a /portal/login con ?error=...
    setLoading(false);
  };

  return (
    <Card className="spotlight-panel w-full max-w-md border-steel/25 shadow-industrial-lg">
      <CardHeader className="pb-2">
        <div className="mb-3 flex justify-center">
          <BrandLockup variant="header" showProductName={false} />
        </div>
        <div className="mx-auto mb-3 h-px w-24 industrial-divider" />
        <CardTitle className="text-center font-heading text-xl text-white">
          Acceso Portal Cliente
        </CardTitle>
        <CardDescription className="text-center">
          Monitorea órdenes, hitos de avance y documentos en tiempo real.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md border border-alert/40 bg-alert/15 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">RUT</label>
            <Input
              type="text"
              value={rut}
              onChange={handleRutChange}
              required
              placeholder="55.555.555-5"
              className="border-steel/25 bg-navy-dark/70 focus:border-steel"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">Contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-steel/25 bg-navy-dark/70 focus:border-steel"
            />
          </div>
          <Button
            type="submit"
            className="w-full border-steel/35 bg-steel text-navy-dark shadow-btn-primary transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-btn-primary-hover"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar al portal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
