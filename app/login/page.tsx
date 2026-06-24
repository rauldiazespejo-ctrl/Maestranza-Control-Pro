import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Iniciar sesión | MAESTRANZA Control Pro",
  description: "Acceso al sistema de control de maestranza de BOILER COMP y SOLDESP.",
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="app-shell-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="login-mark mb-6 flex justify-center">
          <BrandLockup variant="login" />
        </div>

        <Card className="login-panel mx-auto max-w-md border-gold/20 shadow-industrial-lg">
          <CardHeader>
            <CardTitle className="text-center font-heading text-lg">
              Iniciar sesión
            </CardTitle>
            <CardDescription className="text-center">
              Acceso interno para operación, HSEQ, reportes y control documental.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} BOILER COMP S.A. / SOLDESP S.A. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
