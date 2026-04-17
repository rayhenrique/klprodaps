"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  Building2,
  FileText,
  Filter,
  LoaderCircle,
  Pencil,
  Save,
  Settings2,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { deleteGoalConfig, deleteUbs, saveGoalConfig, saveUbs } from "@/actions/coordinator";
import { GaugeChart } from "@/components/charts/gauge-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { monthOptions, yearOptions } from "@/lib/utils/date";
import type {
  CoordinatorDashboardData,
  GoalConfigRecord,
  PerformanceStatus,
  UbsRecord,
} from "@/types/domain";

type CoordinatorDashboardProps = {
  data: CoordinatorDashboardData;
};

type CoordinatorModule = "dashboard" | "ubs" | "goals" | "reports";
type StatusFilter = "all" | "pending" | PerformanceStatus;

const moduleMeta: Array<{
  id: CoordinatorModule;
  label: string;
  icon: typeof TrendingUp;
  description: string;
}> = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: TrendingUp,
    description: "Visao geral de performance e pendencias.",
  },
  {
    id: "ubs",
    label: "Cadastro UBS",
    icon: Building2,
    description: "CRUD das unidades acompanhadas.",
  },
  {
    id: "goals",
    label: "Metas",
    icon: Target,
    description: "CRUD das metas quantitativas por UBS.",
  },
  {
    id: "reports",
    label: "Relatorios",
    icon: FileText,
    description: "Leituras consolidadas da competencia.",
  },
];

function statusVariant(status: PerformanceStatus) {
  switch (status) {
    case "otimo":
      return "info" as const;
    case "bom":
      return "success" as const;
    case "suficiente":
      return "warning" as const;
    default:
      return "danger" as const;
  }
}

function statusLabel(status: PerformanceStatus) {
  switch (status) {
    case "otimo":
      return "Otimo";
    case "bom":
      return "Bom";
    case "suficiente":
      return "Suficiente";
    default:
      return "Regular";
  }
}

export function CoordinatorDashboard({ data }: CoordinatorDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeModule, setActiveModule] = useState<CoordinatorModule>("dashboard");
  const [filterPending, startFilterTransition] = useTransition();
  const [ubsPending, startUbsTransition] = useTransition();
  const [goalPending, startGoalTransition] = useTransition();
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [month, setMonth] = useState(String(data.competencia.month));
  const [year, setYear] = useState(String(data.competencia.year));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingUbs, setEditingUbs] = useState<UbsRecord | null>(null);
  const [editingGoal, setEditingGoal] = useState<GoalConfigRecord | null>(null);

  function applyFilters(nextMonth: string, nextYear: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", nextMonth);
    params.set("year", nextYear);

    startFilterTransition(() => {
      router.replace(`/app/coordenador?${params.toString()}`);
    });
  }

  async function handleUbsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    startUbsTransition(async () => {
      const result = await saveUbs(payload as Record<string, unknown> & { id?: string });

      if (!result.success) {
        toast.error(result.issues?.join(" ") || result.message);
        return;
      }

      toast.success(result.message);
      form.reset();
      setEditingUbs(null);
      router.refresh();
    });
  }

  async function handleGoalSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    startGoalTransition(async () => {
      const result = await saveGoalConfig(payload);

      if (!result.success) {
        toast.error(result.issues?.join(" ") || result.message);
        return;
      }

      toast.success(result.message);
      form.reset();
      setEditingGoal(null);
      router.refresh();
    });
  }

  async function handleDeleteUbs(ubs: UbsRecord) {
    if (!window.confirm(`Remover a UBS ${ubs.nome}?`)) {
      return;
    }

    setDeletePendingId(ubs.id);
    const result = await deleteUbs(ubs.id);
    setDeletePendingId(null);

    if (!result.success) {
      toast.error(result.issues?.join(" ") || result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  async function handleDeleteGoal(goal: GoalConfigRecord) {
    if (!window.confirm("Remover esta meta configurada?")) {
      return;
    }

    setDeletePendingId(goal.id);
    const result = await deleteGoalConfig(goal.id);
    setDeletePendingId(null);

    if (!result.success) {
      toast.error(result.issues?.join(" ") || result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  const pendingToday = useMemo(
    () => data.pendingUnits.filter((item) => !item.submittedToday),
    [data.pendingUnits],
  );

  const filteredCards = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return data.cards.filter((card) => {
      const matchesSearch = !normalizedSearch || card.nome.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "pending"
            ? card.pendingToday
            : card.gauges.some((gauge) => gauge.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [data.cards, search, statusFilter]);

  const summary = useMemo(() => {
    const allGauges = data.cards.flatMap((card) => card.gauges);
    const observations = data.cards.filter((card) => Boolean(card.latestObservation)).length;
    const topCard = [...data.cards]
      .sort((a, b) => {
        const totalA = a.gauges.reduce((sum, gauge) => sum + gauge.total, 0);
        const totalB = b.gauges.reduce((sum, gauge) => sum + gauge.total, 0);
        return totalB - totalA;
      })
      .at(0);

    return {
      totalUbs: data.ubsOptions.length,
      pendingCount: pendingToday.length,
      configuredGoals: data.goalConfigs.length,
      observations,
      totalProduction: allGauges.reduce((sum, gauge) => sum + gauge.total, 0),
      topCard,
      statusCount: {
        regular: allGauges.filter((gauge) => gauge.status === "regular").length,
        suficiente: allGauges.filter((gauge) => gauge.status === "suficiente").length,
        bom: allGauges.filter((gauge) => gauge.status === "bom").length,
        otimo: allGauges.filter((gauge) => gauge.status === "otimo").length,
      },
    };
  }, [data.cards, data.goalConfigs.length, data.ubsOptions.length, pendingToday.length]);

  const ubsMap = useMemo(
    () => new Map(data.ubsOptions.map((ubs) => [ubs.id, ubs.nome])),
    [data.ubsOptions],
  );

  const rankingRows = useMemo(
    () =>
      [...filteredCards]
        .map((card) => ({
          ...card,
          total: card.gauges.reduce((sum, gauge) => sum + gauge.total, 0),
        }))
        .sort((a, b) => b.total - a.total),
    [filteredCards],
  );

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-slate-200 bg-white/90">
        <CardHeader className="gap-5">
          <div className="space-y-3">
            <Badge variant="secondary">Painel do coordenador</Badge>
            <CardTitle className="text-3xl tracking-tight">
              Dashboard de acompanhamento, cadastro e relatorios
            </CardTitle>
            <CardDescription className="max-w-3xl">
              Controle a competencia atual, acompanhe pendencias, mantenha a base de UBS,
              administre metas quantitativas e consulte relatorios consolidados por unidade.
            </CardDescription>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-[1.5rem] border-blue-200 bg-blue-50/80 shadow-none">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">UBS acompanhadas</p>
                <p className="mt-1 text-3xl font-semibold">{summary.totalUbs}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] border-orange-200 bg-orange-50/80 shadow-none">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Pendencias do dia</p>
                <p className="mt-1 text-3xl font-semibold">{summary.pendingCount}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] border-emerald-200 bg-emerald-50/80 shadow-none">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Metas configuradas</p>
                <p className="mt-1 text-3xl font-semibold">{summary.configuredGoals}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] border-indigo-200 bg-indigo-50/80 shadow-none">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Observacoes ativas</p>
                <p className="mt-1 text-3xl font-semibold">{summary.observations}</p>
              </CardContent>
            </Card>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-[2rem]">
        <CardContent className="p-3">
          <div className="grid gap-3 md:grid-cols-4">
            {moduleMeta.map((module) => {
              const Icon = module.icon;

              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => setActiveModule(module.id)}
                  className={[
                    "rounded-[1.4rem] border px-4 py-4 text-left transition-all",
                    activeModule === module.id
                      ? "border-slate-900 bg-slate-950 text-white shadow-lg"
                      : "border-border bg-background hover:-translate-y-0.5 hover:bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-2xl",
                        activeModule === module.id
                          ? "bg-white/10 text-white"
                          : "bg-slate-950 text-white",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{module.label}</p>
                      <p
                        className={[
                          "text-sm",
                          activeModule === module.id ? "text-slate-300" : "text-muted-foreground",
                        ].join(" ")}
                      >
                        {module.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem]">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Filter className="h-5 w-5" />
              Filtros da competencia
            </CardTitle>
            <CardDescription>
              Refine a leitura do painel por periodo, pesquisa textual e estado da unidade.
            </CardDescription>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="month">Mes</Label>
              <select
                id="month"
                className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                value={month}
                onChange={(event) => {
                  const nextMonth = event.target.value;
                  setMonth(nextMonth);
                  applyFilters(nextMonth, year);
                }}
              >
                {monthOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <select
                id="year"
                className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                value={year}
                onChange={(event) => {
                  const nextYear = event.target.value;
                  setYear(nextYear);
                  applyFilters(month, nextYear);
                }}
              >
                {yearOptions(1).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Pesquisar UBS</Label>
              <Input
                id="search"
                placeholder="Digite o nome da unidade"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                <option value="all">Todas</option>
                <option value="pending">Com pendencia</option>
                <option value="regular">Regular</option>
                <option value="suficiente">Suficiente</option>
                <option value="bom">Bom</option>
                <option value="otimo">Otimo</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted text-sm text-muted-foreground">
                {filterPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Atualizando
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    {data.competencia.label}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {activeModule === "dashboard" ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>Leitura executiva da competencia</CardTitle>
                <CardDescription>
                  Resumo do periodo atual com foco em resposta rapida da coordenacao.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">Volume consolidado</p>
                  <p className="mt-1 text-3xl font-semibold">{summary.totalProduction}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Soma dos indicadores medico, enfermagem e odonto na competencia.
                  </p>
                </div>
                <div className="rounded-3xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">UBS filtradas</p>
                  <p className="mt-1 text-3xl font-semibold">{filteredCards.length}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Quantidade de unidades visiveis conforme os filtros atuais.
                  </p>
                </div>
                <div className="rounded-3xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">Melhor volume atual</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {summary.topCard?.nome || "Sem dados"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Unidade com maior soma mensal entre as exibidas.
                  </p>
                </div>
                <div className="rounded-3xl border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground">Pendencias abertas</p>
                  <p className="mt-1 text-3xl font-semibold">{pendingToday.length}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    UBS sem envio registrado no dia util atual.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>Painel de status dos gauges</CardTitle>
                <CardDescription>
                  Distribuicao das faixas de performance entre todas as categorias.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {(["regular", "suficiente", "bom", "otimo"] as PerformanceStatus[]).map(
                  (status) => (
                    <div
                      key={status}
                      className="rounded-3xl border border-border bg-background p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{statusLabel(status)}</p>
                        <Badge variant={statusVariant(status)}>
                          {summary.statusCount[status]}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Gauges classificados nesta faixa no periodo.
                      </p>
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>Pendencias do dia atual</CardTitle>
                <CardDescription>Unidades sem submissao do dia util corrente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingToday.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-700">
                    Todas as unidades ja enviaram o registro do dia, ou o dia atual esta fora da janela util.
                  </div>
                ) : (
                  pendingToday.map((unit) => (
                    <div
                      key={unit.ubsId}
                      className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-4"
                    >
                      <div>
                        <p className="font-medium">{unit.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {unit.contato || "Contato nao informado"}
                        </p>
                      </div>
                      <Badge variant="danger">Pendente</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              {filteredCards.map((card) => (
                <Card key={card.ubsId} className="rounded-[2rem]">
                  <CardHeader className="gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl">{card.nome}</CardTitle>
                        <CardDescription>{card.monthLabel}</CardDescription>
                      </div>
                      {card.pendingToday ? (
                        <Badge variant="warning">Sem envio hoje</Badge>
                      ) : (
                        <Badge variant="success">Enviado hoje</Badge>
                      )}
                    </div>
                    {card.latestObservation ? (
                      <div className="flex items-start gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-3 text-sm text-orange-800">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{card.latestObservation}</span>
                      </div>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {card.gauges.map((gauge) => (
                        <div
                          key={gauge.categoria}
                          className="rounded-2xl border border-border bg-background p-3"
                        >
                          <GaugeChart gauge={gauge} compact />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeModule === "ubs" ? (
        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>CRUD de UBS</CardTitle>
              <CardDescription>
                Cadastre novas unidades e mantenha os dados institucionais atualizados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleUbsSubmit}>
                <Input name="nome" placeholder="Nome da UBS" required />
                <Input name="endereco" placeholder="Endereco completo" required />
                <Input name="contato" placeholder="Telefone ou email de contacto" />
                <Button disabled={ubsPending} type="submit">
                  <Building2 className="h-4 w-4" />
                  {ubsPending ? "Salvando..." : "Salvar UBS"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Unidades cadastradas</CardTitle>
              <CardDescription>
                Edite a base de UBS e remova registros quando necessario.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.ubsOptions.map((ubs) => (
                <div
                  key={ubs.id}
                  className="rounded-3xl border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold">{ubs.nome}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{ubs.endereco}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {ubs.contato || "Sem contacto"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setEditingUbs(ubs)}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={deletePendingId === ubs.id}
                        onClick={() => void handleDeleteUbs(ubs)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletePendingId === ubs.id ? "Removendo..." : "Excluir"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeModule === "goals" ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>CRUD de metas</CardTitle>
              <CardDescription>
                Configure os limites que determinam as faixas dos gauges mensais.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-2" onSubmit={handleGoalSubmit}>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ubs_id">UBS</Label>
                  <select
                    id="ubs_id"
                    name="ubs_id"
                    className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                    required
                  >
                    <option value="">Selecione</option>
                    {data.ubsOptions.map((ubs) => (
                      <option key={ubs.id} value={ubs.id}>
                        {ubs.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <select
                    id="categoria"
                    name="categoria"
                    className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                    required
                  >
                    <option value="medico">Medico</option>
                    <option value="enfermeiro">Enfermagem</option>
                    <option value="odonto">Odontologia</option>
                  </select>
                </div>

                <Input min={0} name="limite_regular" placeholder="Regular" required type="number" />
                <Input min={1} name="limite_suficiente" placeholder="Suficiente" required type="number" />
                <Input min={1} name="limite_bom" placeholder="Bom" required type="number" />
                <Input min={1} name="limite_otimo" placeholder="Otimo" required type="number" />

                <div className="md:col-span-2">
                  <Button className="w-full" disabled={goalPending} type="submit">
                    <Save className="h-4 w-4" />
                    {goalPending ? "Salvando..." : "Salvar meta"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Metas vigentes</CardTitle>
              <CardDescription>
                Edite limites existentes ou remova configuracoes obsoletas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.goalConfigs.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-3xl border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{ubsMap.get(goal.ubs_id) || "UBS removida"}</p>
                        <Badge variant="outline">{goal.categoria}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Regular {goal.limite_regular} | Suficiente {goal.limite_suficiente} | Bom {goal.limite_bom} | Otimo {goal.limite_otimo}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setEditingGoal(goal)}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={deletePendingId === goal.id}
                        onClick={() => void handleDeleteGoal(goal)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletePendingId === goal.id ? "Removendo..." : "Excluir"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeModule === "reports" ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-[2rem]">
            <CardHeader>
              <CardTitle>Ranking por produtividade consolidada</CardTitle>
              <CardDescription>
                Ordenacao por soma mensal de medico, enfermagem e odonto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rankingRows.map((row, index) => (
                <div
                  key={row.ubsId}
                  className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{row.nome}</p>
                        <p className="text-sm text-muted-foreground">{row.monthLabel}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold">{row.total}</p>
                    <p className="text-sm text-muted-foreground">volume total</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>Distribuicao por status</CardTitle>
                <CardDescription>
                  Leitura rapida das faixas de performance no periodo filtrado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(["regular", "suficiente", "bom", "otimo"] as PerformanceStatus[]).map(
                  (status) => (
                    <div
                      key={status}
                      className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-4"
                    >
                      <div>
                        <p className="font-medium">{statusLabel(status)}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantidade de gauges nesta faixa
                        </p>
                      </div>
                      <Badge variant={statusVariant(status)}>
                        {summary.statusCount[status]}
                      </Badge>
                    </div>
                  ),
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem]">
              <CardHeader>
                <CardTitle>Observacoes e excecoes</CardTitle>
                <CardDescription>
                  Unidades com contexto operacional registrado na competencia.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredCards.filter((card) => card.latestObservation).length === 0 ? (
                  <div className="rounded-2xl border border-border bg-background px-4 py-5 text-sm text-muted-foreground">
                    Nenhuma observacao encontrada para os filtros atuais.
                  </div>
                ) : (
                  filteredCards
                    .filter((card) => card.latestObservation)
                    .map((card) => (
                      <div
                        key={card.ubsId}
                        className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4"
                      >
                        <p className="font-medium text-orange-900">{card.nome}</p>
                        <p className="mt-2 text-sm text-orange-800">{card.latestObservation}</p>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <Dialog open={Boolean(editingUbs)} onOpenChange={(open) => (!open ? setEditingUbs(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar UBS</DialogTitle>
            <DialogDescription>
              Atualize os dados principais da unidade selecionada.
            </DialogDescription>
          </DialogHeader>

          {editingUbs ? (
            <form className="grid gap-3" onSubmit={handleUbsSubmit}>
              <input type="hidden" name="id" value={editingUbs.id} />
              <Input defaultValue={editingUbs.nome} name="nome" placeholder="Nome da UBS" required />
              <Input
                defaultValue={editingUbs.endereco}
                name="endereco"
                placeholder="Endereco completo"
                required
              />
              <Input
                defaultValue={editingUbs.contato || ""}
                name="contato"
                placeholder="Telefone ou email de contacto"
              />
              <Button disabled={ubsPending} type="submit">
                <Building2 className="h-4 w-4" />
                {ubsPending ? "Salvando..." : "Salvar alteracoes"}
              </Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingGoal)} onOpenChange={(open) => (!open ? setEditingGoal(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar meta</DialogTitle>
            <DialogDescription>
              Atualize os limites quantitativos da configuracao selecionada.
            </DialogDescription>
          </DialogHeader>

          {editingGoal ? (
            <form className="grid gap-3 md:grid-cols-2" onSubmit={handleGoalSubmit}>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-goal-ubs">UBS</Label>
                <select
                  id="edit-goal-ubs"
                  name="ubs_id"
                  className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  defaultValue={editingGoal.ubs_id}
                >
                  {data.ubsOptions.map((ubs) => (
                    <option key={ubs.id} value={ubs.id}>
                      {ubs.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-goal-category">Categoria</Label>
                <select
                  id="edit-goal-category"
                  name="categoria"
                  className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  defaultValue={editingGoal.categoria}
                >
                  <option value="medico">Medico</option>
                  <option value="enfermeiro">Enfermagem</option>
                  <option value="odonto">Odontologia</option>
                </select>
              </div>

              <Input
                defaultValue={editingGoal.limite_regular}
                min={0}
                name="limite_regular"
                placeholder="Regular"
                required
                type="number"
              />
              <Input
                defaultValue={editingGoal.limite_suficiente}
                min={1}
                name="limite_suficiente"
                placeholder="Suficiente"
                required
                type="number"
              />
              <Input
                defaultValue={editingGoal.limite_bom}
                min={1}
                name="limite_bom"
                placeholder="Bom"
                required
                type="number"
              />
              <Input
                defaultValue={editingGoal.limite_otimo}
                min={1}
                name="limite_otimo"
                placeholder="Otimo"
                required
                type="number"
              />

              <div className="md:col-span-2">
                <Button className="w-full" disabled={goalPending} type="submit">
                  <Settings2 className="h-4 w-4" />
                  {goalPending ? "Salvando..." : "Salvar alteracoes"}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
