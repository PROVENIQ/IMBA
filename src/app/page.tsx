import { currentUser } from '@clerk/nextjs/server';
import { ImbaCeoCockpit } from '@/components/imba/ImbaCeoCockpit';
import { ImbaOsStateProvider } from '@/components/imba/ImbaOsState';
import { resolveImbaRole } from '@/lib/auth-roles';

// Server component: the signed-in identity (guaranteed by middleware) decides the
// default role the cockpit opens on. The in-app role selector still lets people
// explore other roles during a demo.
export default async function ImbaOsHome() {
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;
  const initialRole = resolveImbaRole({
    email,
    publicMetadataRole: user?.publicMetadata?.role,
  });
  return (
    <ImbaOsStateProvider>
      <ImbaCeoCockpit initialRole={initialRole} />
    </ImbaOsStateProvider>
  );
}
