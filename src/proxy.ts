import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes: only handle Supabase session refresh
  if (pathname.startsWith("/api/")) {
    return await updateSession(request);
  }

  // Apply i18n routing first
  const intlResponse = intlMiddleware(request);

  // Then refresh Supabase session
  const sessionResponse = await updateSession(request);

  // Merge cookies from session update into intl response
  sessionResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
