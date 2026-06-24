import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalLoginForm } from "@/components/portal/PortalLoginForm";

export default async function PortalLoginPage() {
  const session = await auth();
  if (session?.user?.role === "CLIENT") redirect("/portal/dashboard");

  return (
    <div className="app-shell-bg flex min-h-screen items-center justify-center p-4">
      <PortalLoginForm />
    </div>
  );
}
