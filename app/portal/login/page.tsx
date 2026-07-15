import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PortalLoginForm } from "@/components/portal/PortalLoginForm";

interface PortalLoginPageProps {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
}

export default async function PortalLoginPage({ searchParams }: PortalLoginPageProps) {
  const session = await getSession();
  const params = await searchParams;
  const authError = Array.isArray(params?.error) ? params.error[0] : params?.error;

  if (session?.user?.role === "CLIENT") redirect("/portal/dashboard");

  return (
    <div className="app-shell-bg flex min-h-screen items-center justify-center p-4">
      <PortalLoginForm authError={authError} />
    </div>
  );
}
