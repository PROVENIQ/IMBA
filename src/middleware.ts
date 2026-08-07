import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// The whole app requires a signed-in, invited user. Only the Clerk sign-in and
// sign-up flows are public; everything else (including API routes) is protected.
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return;
  const { userId } = await auth();
  if (userId) return;

  // Not signed in. Redirect page requests to the in-app sign-in page (not Clerk's
  // hosted Account Portal), and answer API requests with a clean 401.
  if (isApiRoute(request)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const signInUrl = new URL("/sign-in", request.url);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files unless referenced in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
