import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/env";
import type { UserRole } from "@/types/domain";

const roleHome: Record<UserRole, string> = {
  diretor: "/app/diretor",
  coordenador: "/app/coordenador",
  superadmin: "/app/admin",
};

function getFallbackRoute(role?: UserRole | null) {
  if (!role) {
    return "/login";
  }

  return roleHome[role];
}

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next();
  }

  const { url, publishableKey } = getSupabaseEnv();
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  const pathname = request.nextUrl.pathname;
  const isAppRoute = pathname.startsWith("/app");
  const isLoginRoute = pathname.startsWith("/login");

  if (!userId) {
    if (isAppRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  }

  const { data: profile } = await supabase
    .from("perfis")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: UserRole }>();

  const role = profile?.role ?? null;
  const destination = getFallbackRoute(role);

  if (isLoginRoute) {
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (pathname === "/app") {
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (pathname.startsWith("/app/admin") && role !== "superadmin") {
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (
    pathname.startsWith("/app/coordenador") &&
    role !== "coordenador" &&
    role !== "superadmin"
  ) {
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (pathname.startsWith("/app/diretor") && role !== "diretor") {
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}
