import { cache } from "react";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { GlobalSettingsRecord, ProfileWithUbs, UserRole } from "@/types/domain";

export const getDefaultAppRoute = (role: UserRole) => {
  if (role === "superadmin") {
    return "/app/admin";
  }

  if (role === "coordenador") {
    return "/app/coordenador";
  }

  return "/app/diretor";
};

export const getAuthenticatedProfile = cache(async () => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return null;
  }

  const { data } = await supabase
    .from("perfis")
    .select(
      "id, nome_completo, role, ubs_id, ubs:ubs_id (id, nome, endereco, contato)",
    )
    .eq("id", userId)
    .maybeSingle();

  return (data as ProfileWithUbs | null) ?? null;
});

export async function requireProfile(allowedRoles?: UserRole[]) {
  const profile = await getAuthenticatedProfile();

  if (!profile) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    redirect(getDefaultAppRoute(profile.role));
  }

  return profile;
}

export async function getPublicSettings() {
  const fallback: GlobalSettingsRecord = {
    id: 1,
    nome_sistema: "ProdAPS",
    logo_url: null,
  };

  if (!hasSupabaseEnv()) {
    return fallback;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("global_settings")
    .select("id, nome_sistema, logo_url")
    .eq("id", 1)
    .maybeSingle();

  return (data as GlobalSettingsRecord | null) ?? fallback;
}
