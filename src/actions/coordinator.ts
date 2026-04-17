"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedProfile, getPublicSettings } from "@/lib/auth/guards";
import { buildCoordinatorCards, buildPendingUnits } from "@/lib/dashboard/builders";
import { getCompetenciaParams, getLocalTodayISO, getMonthBounds, getMonthLabel, isWeekendDay } from "@/lib/utils/date";
import { createClient } from "@/lib/supabase/server";
import { goalConfigSchema, upsertUbsSchema } from "@/lib/validations/admin";
import type { ActionResult, CoordinatorDashboardData, GoalConfigRecord, PendingUnitRow, ProductionRecord, UbsRecord } from "@/types/domain";

async function assertCoordinatorAccess() {
  const profile = await getAuthenticatedProfile();

  if (!profile || (profile.role !== "coordenador" && profile.role !== "superadmin")) {
    throw new Error("Acesso restrito a coordenadores e superadmins.");
  }

  return profile;
}

export async function getPendingUnits(): Promise<PendingUnitRow[]> {
  await assertCoordinatorAccess();

  const supabase = await createClient();
  const today = getLocalTodayISO();
  const weekend = isWeekendDay(today);
  const [{ data: ubsRecords }, { data: submissions }] = await Promise.all([
    supabase.from("ubs").select("id, nome, endereco, contato").order("nome"),
    weekend
      ? Promise.resolve({ data: [] })
      : supabase.from("producao_diaria").select("ubs_id").eq("data", today),
  ]);

  const submittedTodayIds = new Set(
    weekend
      ? ((ubsRecords as UbsRecord[] | null) ?? []).map((ubs) => ubs.id)
      : ((submissions as Array<{ ubs_id: string }> | null) ?? []).map(
          (submission) => submission.ubs_id,
        ),
  );

  return buildPendingUnits((ubsRecords as UbsRecord[] | null) ?? [], submittedTodayIds);
}

export async function getCoordinatorDashboard(
  searchMonth?: string,
  searchYear?: string,
): Promise<CoordinatorDashboardData> {
  await assertCoordinatorAccess();

  const supabase = await createClient();
  const settings = await getPublicSettings();
  const { month, year } = getCompetenciaParams(searchMonth, searchYear);
  const { start, end } = getMonthBounds(month, year);
  const today = getLocalTodayISO();
  const weekend = isWeekendDay(today);

  const [{ data: ubsRecords }, { data: rows }, { data: goalConfigs }, { data: submissions }] =
    await Promise.all([
      supabase.from("ubs").select("id, nome, endereco, contato").order("nome"),
      supabase
        .from("producao_diaria")
        .select("*")
        .gte("data", start)
        .lte("data", end)
        .order("data", { ascending: true }),
      supabase.from("configuracoes_metas").select("*").order("categoria"),
      weekend
        ? Promise.resolve({ data: [] })
        : supabase.from("producao_diaria").select("ubs_id").eq("data", today),
    ]);

  const ubsList = (ubsRecords as UbsRecord[] | null) ?? [];
  const submittedTodayIds = new Set(
    weekend
      ? ubsList.map((ubs) => ubs.id)
      : ((submissions as Array<{ ubs_id: string }> | null) ?? []).map(
          (submission) => submission.ubs_id,
        ),
  );

  return {
    settings,
    competencia: {
      month,
      year,
      label: getMonthLabel(month, year),
    },
    pendingUnits: buildPendingUnits(ubsList, submittedTodayIds),
    cards: buildCoordinatorCards({
      ubsRecords: ubsList,
      goalConfigs: (goalConfigs as GoalConfigRecord[] | null) ?? [],
      rows: (rows as ProductionRecord[] | null) ?? [],
      submittedTodayIds,
      monthLabel: getMonthLabel(month, year),
    }),
    ubsOptions: ubsList,
    goalConfigs: (goalConfigs as GoalConfigRecord[] | null) ?? [],
  };
}

export async function saveGoalConfig(
  input: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    await assertCoordinatorAccess();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Acesso negado.",
    };
  }

  const parsed = goalConfigSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os limites informados para a meta.",
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const { limite_regular, limite_suficiente, limite_bom, limite_otimo } = parsed.data;

  if (
    !(
      limite_regular < limite_suficiente &&
      limite_suficiente < limite_bom &&
      limite_bom < limite_otimo
    )
  ) {
    return {
      success: false,
      message: "Os limites devem crescer em ordem: regular, suficiente, bom e otimo.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("configuracoes_metas").upsert(parsed.data, {
    onConflict: "ubs_id,categoria",
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/app/coordenador");
  revalidatePath("/app/diretor");

  return {
    success: true,
    message: "Meta atualizada com sucesso.",
  };
}

export async function deleteGoalConfig(goalConfigId: string): Promise<ActionResult> {
  try {
    await assertCoordinatorAccess();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Acesso negado.",
    };
  }

  if (!goalConfigId) {
    return {
      success: false,
      message: "Meta invalida.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracoes_metas")
    .delete()
    .eq("id", goalConfigId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/app/coordenador");
  revalidatePath("/app/diretor");

  return {
    success: true,
    message: "Meta removida com sucesso.",
  };
}

export async function saveUbs(
  input: Record<string, unknown> & { id?: string },
): Promise<ActionResult> {
  try {
    await assertCoordinatorAccess();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Acesso negado.",
    };
  }

  const parsed = upsertUbsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os dados da UBS.",
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const supabase = await createClient();
  const payload = {
    ...parsed.data,
    contato: parsed.data.contato || null,
    ...(input.id ? { id: input.id } : {}),
  };
  const { error } = input.id
    ? await supabase.from("ubs").update(payload).eq("id", input.id)
    : await supabase.from("ubs").insert(payload);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/app/coordenador");
  revalidatePath("/app/admin");

  return {
    success: true,
    message: input.id
      ? "UBS atualizada com sucesso."
      : "UBS cadastrada com sucesso.",
  };
}

export async function deleteUbs(ubsId: string): Promise<ActionResult> {
  try {
    await assertCoordinatorAccess();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Acesso negado.",
    };
  }

  if (!ubsId) {
    return {
      success: false,
      message: "UBS invalida.",
    };
  }

  const supabase = await createClient();
  const { data: linkedDirectors, error: linkedDirectorsError } = await supabase
    .from("perfis")
    .select("nome_completo")
    .eq("ubs_id", ubsId)
    .eq("role", "diretor")
    .order("nome_completo");

  if (linkedDirectorsError) {
    return {
      success: false,
      message: linkedDirectorsError.message,
    };
  }

  if ((linkedDirectors?.length ?? 0) > 0) {
    const preview = linkedDirectors
      ?.slice(0, 3)
      .map((profile) => profile.nome_completo)
      .join(", ");

    return {
      success: false,
      message:
        (linkedDirectors?.length ?? 0) === 1
          ? `Nao e possivel excluir a UBS porque o diretor ${preview} ainda esta vinculado a ela.`
          : `Nao e possivel excluir a UBS porque ainda existem diretores vinculados a ela${preview ? `: ${preview}` : ""}.`,
    };
  }

  const { error } = await supabase.from("ubs").delete().eq("id", ubsId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/app/coordenador");
  revalidatePath("/app/admin");
  revalidatePath("/app/diretor");

  return {
    success: true,
    message: "UBS removida com sucesso.",
  };
}
