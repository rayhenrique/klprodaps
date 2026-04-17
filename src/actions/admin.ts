"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedProfile } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { brandingSchema, createUserSchema, updateUserSchema } from "@/lib/validations/admin";
import type { ActionResult, AdminPanelData, AdminUserRow, GlobalSettingsRecord, ProfileWithUbs, UbsRecord } from "@/types/domain";

async function assertSuperadmin() {
  const profile = await getAuthenticatedProfile();

  if (!profile || profile.role !== "superadmin") {
    throw new Error("Acesso restrito ao superadmin.");
  }

  return profile;
}

export async function getAdminPanelData(): Promise<AdminPanelData> {
  const profile = await assertSuperadmin();

  const admin = createAdminClient();
  const [{ data: settings }, { data: profiles }, { data: ubsRecords }, usersResponse] =
    await Promise.all([
      admin.from("global_settings").select("id, nome_sistema, logo_url").eq("id", 1).maybeSingle(),
      admin
        .from("perfis")
        .select("id, nome_completo, role, ubs_id, ubs:ubs_id (nome)")
        .order("nome_completo"),
      admin.from("ubs").select("id, nome, endereco, contato").order("nome"),
      admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      }),
    ]);

  const authUsers = usersResponse.data.users ?? [];
  const profileMap = new Map(
    ((profiles as Array<
      ProfileWithUbs & {
        ubs: { nome: string } | null;
      }
    > | null) ?? []).map((profile) => [profile.id, profile]),
  );

  const users: AdminUserRow[] = authUsers.map((user) => {
    const profile = profileMap.get(user.id);

    return {
      id: user.id,
      email: user.email ?? "",
      nome_completo: profile?.nome_completo ?? "Sem perfil",
      role: profile?.role ?? "diretor",
      ubs_id: profile?.ubs_id ?? null,
      ubs_nome: profile?.ubs?.nome ?? null,
      last_sign_in_at: user.last_sign_in_at ?? null,
    };
  });

  return {
    currentUserId: profile.id,
    settings:
      (settings as GlobalSettingsRecord | null) ?? {
        id: 1,
        nome_sistema: "ProdAPS",
        logo_url: null,
      },
    users,
    ubsOptions: (ubsRecords as UbsRecord[] | null) ?? [],
  };
}

export async function updateUserProfile(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  let profile;
  try {
    profile = await assertSuperadmin();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Acesso negado.",
    };
  }

  const parsed = updateUserSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os dados do utilizador.",
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  if (parsed.data.role === "diretor" && !parsed.data.ubs_id) {
    return {
      success: false,
      message: "O diretor precisa ser vinculado a uma UBS.",
    };
  }

  if (parsed.data.id === profile.id && parsed.data.role !== "superadmin") {
    return {
      success: false,
      message: "Nao e permitido remover o proprio acesso de superadmin.",
    };
  }

  const admin = createAdminClient();

  const profilePayload = {
    id: parsed.data.id,
    nome_completo: parsed.data.nome_completo,
    role: parsed.data.role,
    ubs_id: parsed.data.ubs_id ?? null,
  };

  const { error: profileError } = await admin.from("perfis").upsert(profilePayload, {
    onConflict: "id",
  });

  if (profileError) {
    return {
      success: false,
      message: profileError.message,
    };
  }

  if (parsed.data.password) {
    const { error: authError } = await admin.auth.admin.updateUserById(parsed.data.id, {
      password: parsed.data.password,
    });

    if (authError) {
      return {
        success: false,
        message: authError.message,
      };
    }
  }

  revalidatePath("/app/admin");

  return {
    success: true,
    message: "Utilizador atualizado com sucesso.",
  };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  let profile;
  try {
    profile = await assertSuperadmin();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Acesso negado.",
    };
  }

  if (!userId) {
    return {
      success: false,
      message: "Utilizador invalido.",
    };
  }

  if (userId === profile.id) {
    return {
      success: false,
      message: "Nao e permitido apagar o proprio utilizador.",
    };
  }

  const admin = createAdminClient();
  const { count, error: linkedProductionError } = await admin
    .from("producao_diaria")
    .select("id", { count: "exact", head: true })
    .eq("criado_por", userId);

  if (linkedProductionError) {
    return {
      success: false,
      message: linkedProductionError.message,
    };
  }

  if ((count ?? 0) > 0) {
    return {
      success: false,
      message:
        "Nao e possivel excluir este utilizador porque ele possui registros de producao vinculados. Reatribua ou preserve o historico antes de remover a conta.",
    };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/app/admin");

  return {
    success: true,
    message: "Utilizador removido com sucesso.",
  };
}

export async function createUserWithProfile(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    await assertSuperadmin();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Acesso negado.",
    };
  }

  const parsed = createUserSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os dados do novo utilizador.",
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  if (parsed.data.role === "diretor" && !parsed.data.ubs_id) {
    return {
      success: false,
      message: "O diretor precisa ser vinculado a uma UBS.",
    };
  }

  const admin = createAdminClient();
  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (createError || !createdUser.user) {
    return {
      success: false,
      message: createError?.message || "Nao foi possivel criar o utilizador.",
    };
  }

  const { error: profileError } = await admin.from("perfis").upsert({
    id: createdUser.user.id,
    nome_completo: parsed.data.nome_completo,
    role: parsed.data.role,
    ubs_id: parsed.data.ubs_id ?? null,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(createdUser.user.id);

    return {
      success: false,
      message: profileError.message,
    };
  }

  revalidatePath("/app/admin");

  return {
    success: true,
    message: "Utilizador criado e vinculado com sucesso.",
  };
}

export async function updateBranding(formData: FormData): Promise<ActionResult> {
  try {
    await assertSuperadmin();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Acesso negado.",
    };
  }

  const admin = createAdminClient();
  const nome_sistema = String(formData.get("nome_sistema") || "");
  const parsed = brandingSchema.safeParse({ nome_sistema });

  if (!parsed.success) {
    return {
      success: false,
      message: "Revise o nome do sistema.",
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const { data: existingSettings } = await admin
    .from("global_settings")
    .select("logo_url")
    .eq("id", 1)
    .maybeSingle<{ logo_url: string | null }>();
  const logo = formData.get("logo");
  let logoUrl = existingSettings?.logo_url ?? null;

  if (logo instanceof File && logo.size > 0) {
    const extension = logo.name.split(".").pop() || "png";
    const filePath = `branding/logo-${Date.now()}.${extension}`;
    const { data: uploadData, error: uploadError } = await admin.storage
      .from("branding")
      .upload(filePath, logo, {
        cacheControl: "3600",
        upsert: true,
        contentType: logo.type,
      });

    if (uploadError) {
      return {
        success: false,
        message: uploadError.message,
      };
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("branding").getPublicUrl(uploadData.path);
    logoUrl = publicUrl;
  }

  const { error } = await admin.from("global_settings").upsert({
    id: 1,
    nome_sistema: parsed.data.nome_sistema,
    logo_url: logoUrl,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/");
  revalidatePath("/app/admin");
  revalidatePath("/app/coordenador");
  revalidatePath("/app/diretor");

  return {
    success: true,
    message: "Marca e titulo atualizados com sucesso.",
  };
}
