import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in";
const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up";

const isPublicRoute = createRouteMatcher([signInUrl, signUpUrl]);

/** Allows authentication pages through and protects every other matched route. */
export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return;
  }

  await auth.protect();
}, { signInUrl, signUpUrl });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js|png|jpg|jpeg|gif|svg|webp|avif|ico|json|txt|map)$).*)",
    "/",
  ],
};
