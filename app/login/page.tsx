import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, FileCheck2, ShieldCheck } from "lucide-react";

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
    <main className="login-workshop app-shell-bg min-h-dvh overflow-hidden">
      <div className="mx-auto grid min-h-dvh w-full max-w-[1440px] lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden border-r border-hairline px-10 py-12 lg:flex xl:px-16">
          <div className="login-blueprint" aria-hidden="true" />
          <BrandLockup variant="login" />

          <div className="relative z-10 max-w-2xl">
            <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Centro de mando · Maestranza
            </p>
            <h1 className="max-w-xl font-heading text-5xl font-bold leading-[1.04] tracking-[-0.035em] text-white xl:text-6xl">
              Cada orden bajo control. Cada riesgo visible.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-ink-muted">
              Producción, trazabilidad documental y gestión HSEQ conectadas en una sola operación.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline">
              {[
                [Activity, "Producción", "Avance en tiempo real"],
                [ShieldCheck, "HSEQ", "Controles vigentes"],
                [FileCheck2, "Trazabilidad", "Evidencia centralizada"],
              ].map(([Icon, label, detail]) => {
                const FeatureIcon = Icon as typeof Activity;
                return (
                  <div key={label as string} className="bg-surface-1/95 p-4">
                    <FeatureIcon className="mb-5 h-5 w-5 text-gold" aria-hidden="true" />
                    <p className="text-sm font-semibold text-white">{label as string}</p>
                    <p className="mt-1 text-xs leading-5 text-ink-subtle">{detail as string}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="relative z-10 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-tertiary">
            ForgeOps / Control operacional integrado
          </p>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="login-mark mb-8 flex justify-center lg:hidden">
              <BrandLockup variant="login" />
            </div>

        <Card className="login-panel border-steel/20 shadow-[0_24px_72px_rgba(2,6,23,0.52)]">
          <CardHeader>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              Acceso protegido
            </div>
            <CardTitle className="font-heading text-2xl tracking-tight">
              Ingreso al centro de control
            </CardTitle>
            <CardDescription>
              Usa tus credenciales corporativas para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm authError={authError} errorCode={errorCode} />
          </CardContent>
        </Card>

            <p className="mt-6 text-center text-xs text-ink-tertiary">
              © {new Date().getFullYear()} ForgeOps · Acceso exclusivo autorizado
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
