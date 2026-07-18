import { AppShell } from '@/components/app-shell';

// Finance sub-app: everything under this route group renders inside the
// finance sidebar shell. The IMBA-OS cockpit at "/" sits above it.
export default function FinanceGroupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
