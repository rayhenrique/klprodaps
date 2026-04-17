"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedProfile, getPublicSettings } from "@/lib/auth/guards";
import { buildGaugeList } from "@/lib/dashboard/builders";
import { getMonthLabel, getMonthBounds, getCompetenciaParams, getLocalTodayISO, isWeekendDay } from "@/lib/utils/date";
import { productionSchema, type ProductionSchema } from "@/lib/validations/production";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, DirectorDashboardData, GoalConfigRecord, ProductionFormInput, ProductionRecord } from "@/types/domain";

function sanitizeProductionInput(input: ProductionSchema) {
  return {
    ...input,
    observacao: input.observacao?.trim() || null,
  };
}

async function getDirectorDependencies(searchMonth?: string, searchYear?: string) {
  const profile = await getAuthenticatedProfile();

  if (!profile || profile.role !== "diretor" || !profile.ubs_id) {
    throw new Error("Acesso restrito ao perfil diretor.");
  }

  const supabase = await createClient();
  const settings = await getPublicSettings();
  const { month, year } = getCompetenciaParams(searchMonth, searchYear);
  const { start, end } = getMonthBounds(month, year);
  const today = getLocalTodayISO();
  const isWeekend = isWeekendDay(today);

  const [{ data: rows }, { data: goalConfigs }, { data: todayRecord }] = await Promise.all([
    supabase
      .from("producao_diaria")
      .select("*")
      .eq("ubs_id", profile.ubs_id)
      .gte("data", start)
      .lte("data", end)
      .order("data", { ascending: true }),
    supabase
      .from("configuracoes_metas")
      .select("*")
      .eq("ubs_id", profile.ubs_id)
      .order("categoria"),
    supabase
      .from("producao_diaria")
      .select("*")
      .eq("ubs_id", profile.ubs_id)
      .eq("data", today)
      .maybeSingle(),
  ]);

  return {
    supabase,
    profile,
    settings,
    month,
    year,
    isWeekend,
    rows: (rows as ProductionRecord[] | null) ?? [],
    goalConfigs: (goalConfigs as GoalConfigRecord[] | null) ?? [],
    todayRecord: (todayRecord as ProductionRecord | null) ?? null,
  };
}

export async function getMonthlyDirectorDashboard(
  searchMonth?: string,
  searchYear?: string,
): Promise<DirectorDashboardData> {
  const { profile, settings, month, year, isWeekend, rows, goalConfigs, todayRecord } =
    await getDirectorDependencies(searchMonth, searchYear);

  return {
    profile,
    settings,
    competencia: {
      month,
      year,
      label: getMonthLabel(month, year),
    },
    gauges: buildGaugeList(goalConfigs, rows),
    todayRecord,
    isWeekend,
  };
}

export async function saveDailyProduction(
  input: ProductionFormInput,
): Promise<ActionResult> {
  const profile = await getAuthenticatedProfile();

  if (!profile || profile.role !== "diretor" || !profile.ubs_id) {
    return {
      success: false,
      message: "Somente diretores vinculados a uma UBS podem enviar producao.",
    };
  }

  const parsed = productionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Existem campos invalidos no formulario.",
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const today = getLocalTodayISO();

  if (isWeekendDay(today)) {
    return {
      success: false,
      message: "O envio diario fica bloqueado aos sabados e domingos.",
    };
  }

  if (parsed.data.data !== today) {
    return {
      success: false,
      message: "O diretor so pode registrar a producao da data atual.",
    };
  }

  const supabase = await createClient();
  const payload = sanitizeProductionInput(parsed.data);
  const { data: existing } = await supabase
    .from("producao_diaria")
    .select("id")
    .eq("ubs_id", profile.ubs_id)
    .eq("data", payload.data)
    .maybeSingle<{ id: string }>();

  const record = {
    ...payload,
    ubs_id: profile.ubs_id,
    criado_por: profile.id,
  };

  const mutation = existing?.id
    ? supabase.from("producao_diaria").update(record).eq("id", existing.id)
    : supabase.from("producao_diaria").insert(record);

  const { error } = await mutation;

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/app/diretor");
  revalidatePath("/app/coordenador");

  return {
    success: true,
    message: existing?.id
      ? "Producao do dia atualizada com sucesso."
      : "Producao do dia enviada com sucesso.",
  };
}

export async function updateDailyProduction(
  recordId: string,
  input: ProductionFormInput,
): Promise<ActionResult> {
  const profile = await getAuthenticatedProfile();

  if (!profile) {
    return {
      success: false,
      message: "Sessao expirada. Entre novamente para continuar.",
    };
  }

  const parsed = productionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: "Existem campos invalidos no formulario.",
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  if (profile.role === "diretor" && parsed.data.data !== getLocalTodayISO()) {
    return {
      success: false,
      message: "Diretores so podem editar o registro do proprio dia.",
    };
  }

  const supabase = await createClient();
  const payload = sanitizeProductionInput(parsed.data);
  const { error } = await supabase
    .from("producao_diaria")
    .update(payload)
    .eq("id", recordId);

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/app/diretor");
  revalidatePath("/app/coordenador");

  return {
    success: true,
    message: "Registro atualizado com sucesso.",
  };
}
