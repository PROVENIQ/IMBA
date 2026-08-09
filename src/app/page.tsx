import { auth, currentUser } from '@clerk/nextjs/server';
import { ImbaCeoCockpit } from '@/components/imba/ImbaCeoCockpit';
import { ImbaOsStateProvider } from '@/components/imba/ImbaOsState';
import { resolveImbaRole } from '@/lib/auth-roles';

function RoleRequiredScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071512] px-6 text-[#edf4ee]">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b7e35b]">IMBA-OS access</p>
        <h1 className="mt-3 text-2xl font-semibold">Your role is not assigned yet</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">
          An IMBA administrator must assign a Clerk role before this account can view IMBA-OS data.
        </p>
        <p className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-xs leading-5 text-amber-100">
          No role means no data access. Ask your administrator to set the account&apos;s public metadata role or organization role.
        </p>
      </section>
    </main>
  );
}

// Server component: the signed-in identity (guaranteed by middleware) decides the
// default role the cockpit opens on. The in-app role selector still lets people
// explore other roles during a demo.
export default async function ImbaOsHome() {
  const { orgRole } = await auth();
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;
  const initialRole = resolveImbaRole({
    email,
    publicMetadataRole: user?.publicMetadata?.role,
    organizationRole: orgRole,
  });
  if (!initialRole) return <RoleRequiredScreen />;
  return (
    <ImbaOsStateProvider>
      <ImbaCeoCockpit initialRole={initialRole} />
    </ImbaOsStateProvider>
  );
}
