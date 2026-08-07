import { SignUp } from "@clerk/nextjs";

// Only reachable via a Clerk invitation link (public sign-up is disabled in the
// Clerk dashboard). Invitees land here once to set up their account.
export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1220] p-6">
      <SignUp />
    </main>
  );
}
