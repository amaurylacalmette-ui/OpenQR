import { requireUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <DashboardShell name={user.name} email={user.email}>
      {children}
    </DashboardShell>
  );
}
