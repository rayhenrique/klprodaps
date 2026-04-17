import { buildGaugeData } from "@/lib/dashboard/status";
import type {
  GoalConfigRecord,
  MetaCategoria,
  PendingUnitRow,
  ProductionRecord,
  ThresholdConfig,
  UbsPerformanceCard,
  UbsRecord,
} from "@/types/domain";

const categories: MetaCategoria[] = ["medico", "enfermeiro", "odonto"];

const fallbackThresholds: ThresholdConfig = {
  limite_regular: 100,
  limite_suficiente: 150,
  limite_bom: 250,
  limite_otimo: 300,
};

export function buildGaugeList(
  goalConfigs: GoalConfigRecord[],
  rows: ProductionRecord[],
) {
  const configMap = new Map(goalConfigs.map((item) => [item.categoria, item]));

  return categories.map((categoria) => {
    const total = rows.reduce((sum, row) => sum + Number(row[categoria] || 0), 0);
    const config = configMap.get(categoria);

    return buildGaugeData(categoria, total, config ?? fallbackThresholds);
  });
}

export function buildPendingUnits(
  ubsRecords: UbsRecord[],
  submittedTodayIds: Set<string>,
): PendingUnitRow[] {
  return ubsRecords.map((ubs) => ({
    ubsId: ubs.id,
    nome: ubs.nome,
    contato: ubs.contato,
    submittedToday: submittedTodayIds.has(ubs.id),
  }));
}

export function buildCoordinatorCards(input: {
  ubsRecords: UbsRecord[];
  goalConfigs: GoalConfigRecord[];
  rows: ProductionRecord[];
  submittedTodayIds: Set<string>;
  monthLabel: string;
}) {
  const { ubsRecords, goalConfigs, rows, submittedTodayIds, monthLabel } = input;

  return ubsRecords.map<UbsPerformanceCard>((ubs) => {
    const ubsRows = rows
      .filter((row) => row.ubs_id === ubs.id)
      .sort((a, b) => a.data.localeCompare(b.data));
    const ubsGoalConfigs = goalConfigs.filter((config) => config.ubs_id === ubs.id);
    const latestObservation =
      [...ubsRows].reverse().find((row) => row.observacao?.trim())?.observacao ?? null;

    return {
      ubsId: ubs.id,
      nome: ubs.nome,
      gauges: buildGaugeList(ubsGoalConfigs, ubsRows),
      pendingToday: !submittedTodayIds.has(ubs.id),
      latestObservation,
      monthLabel,
    };
  });
}
