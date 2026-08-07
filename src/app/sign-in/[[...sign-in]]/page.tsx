import { SignIn } from "@clerk/nextjs";

// Invite-only: public sign-up is disabled in the Clerk dashboard, so only people
// on the allowlist can complete a sign-in. This page is the one public route.
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1220] p-6">
      <SignIn />
    </main>
  );
}
