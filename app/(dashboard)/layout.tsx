import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
    return; // unreachable, but satisfies TS
  }

  return (
    <DashboardShell user={session.user}>{children}</DashboardShell>
  );
}
