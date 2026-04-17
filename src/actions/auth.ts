"use server";

import { redirect } from "next/navigation";
import { getDefaultAppRoute } from "@/lib/auth/guards";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, UserRole } from "@/types/domain";

export async function signIn(
  _previousState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  if (!hasSupabaseEnv()) {
    return {
      success: false,
      message: "Configure as credenciais do Supabase para autenticar o sistema.",
    };
  }

  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return {
      success: false,
      message: "Preencha email e senha para entrar.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      success: false,
      message: "Credenciais invalidas ou utilizador sem acesso.",
    };
  }

  const { data: profile } = await supabase
    .from("perfis")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle<{ role: UserRole }>();

  if (!profile?.role) {
    return {
      success: false,
      message: "O utilizador nao possui perfil configurado no ProdAPS.",
    };
  }

  redirect(getDefaultAppRoute(profile.role));
}

export async function signOut() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
