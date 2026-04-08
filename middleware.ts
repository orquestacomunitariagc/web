import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Rutas que SIEMPRE requieren login
const isProtectedRoute = createRouteMatcher(['/miembros(.*)', '/api/(.*)']);
// Rutas que son públicas (aunque estén en /api)
const isPublicRoute = createRouteMatcher([
  '/api/auth/register-musician',
  '/api/auth/validate-invite',
  '/api/roles',
  '/api/agrupaciones',
  '/api/unete',
  '/unete'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) return (await auth()).redirectToSignIn();

    // Redirección forzada: si entran en la base /miembros, al Tablón directo
    const url = new URL(req.url);
    if (url.pathname === "/miembros") {
      return NextResponse.redirect(new URL("/miembros/tablon", req.url));
    }
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
