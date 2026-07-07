import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Iniciar sesión | ForgeOps",
  description: "Acceso a ForgeOps para control operacional, trazabilidad y gestión documental.",
};

interface LoginPageProps {
  searchParams?: Promise<{
    error?: string | string[];
    code?: string | string[];
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = await searchParams;
  const authError = Array.isArray(params?.error) ? params.error[0] : params?.error;
  const errorCode = Array.isArray(params?.code) ? params.code[0] : params?.code;

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="app-shell-bg flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="login-mark mb-6 flex justify-center">
          <BrandLockup variant="login" />
        </div>

        <Card className="login-panel mx-auto max-w-md border-steel/20 shadow-[0_24px_72px_rgba(2,6,23,0.52)]">
          <CardHeader>
            <div className="metal-brushed mx-auto mb-2 inline-flex items-center gap-2 rounded-full border border-steel/25 px-3 py-1 text-[11px] font-semibold uppercase text-steel">
              Centro seguro
            </div>
            <CardTitle className="text-center font-heading text-lg">
              Iniciar sesión
            </CardTitle>
            <CardDescription className="text-center">
              Acceso seguro al centro de control operacional, HSEQ y trazabilidad documental.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm authError={authError} errorCode={errorCode} />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} ForgeOps. Plataforma de control operacional.
        </p>
      </div>
    </div>
  );
}
