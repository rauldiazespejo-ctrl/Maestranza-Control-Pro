import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-steel">No se pudo cargar la sesión (layout).</p>
      </div>
    );
  }

  return (
    <DashboardShell user={session.user}>{children}</DashboardShell>
  );
}
