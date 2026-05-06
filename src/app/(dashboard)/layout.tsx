import { RequireAuth } from "@/components/auth/RequireAuth";
import { Shell } from "@/components/layout/Shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <Shell>{children}</Shell>
    </RequireAuth>
  );
}
