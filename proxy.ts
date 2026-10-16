import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const isProtectedRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/");

  if (isProtectedRoute) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/__clerk/:path*",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
