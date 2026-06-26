"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BrandLockup } from "@/components/brand/BrandLockup";

export function PortalLoginForm() {
  const router = useRouter();
  const [rut, setRut] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const formatRut = (value: string) => {
    let raw = value.replace(/[^0-9kK]/g, "");
    if (raw.length > 1) {
      raw = raw.slice(0, -1) + "-" + raw.slice(-1);
    }
    const parts = raw.split('-');
    if (parts[0].length > 3) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
    const result = await signIn("credentials", {
      rut,
      password,
      redirect: false,
      callbackUrl: "/portal/dashboard",
    });
    setLoading(false);
    if (result?.ok) {
      router.push("/portal/dashboard");
      router.refresh();
    } else {
      setError("Credenciales incorrectas o usuario no es cliente.");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="mb-3 flex justify-center">
          <BrandLockup variant="header" showProductName={false} />
        </div>
        <CardTitle className="text-center font-heading text-xl text-white">
          Portal Cliente
        </CardTitle>
        <CardDescription className="text-center">
          Seguimiento de órdenes, avances y documentos publicados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-fire-bright">{error}</p>}
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">RUT</label>
            <Input type="text" value={rut} onChange={handleRutChange} required placeholder="55.555.555-5" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-steel">Contraseña</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Ingresando..." : "Ingresar"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
