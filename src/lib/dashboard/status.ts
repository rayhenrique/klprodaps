import type {
  GaugeData,
  MetaCategoria,
  PerformanceStatus,
  ThresholdConfig,
} from "@/types/domain";

export const statusStyles: Record<
  PerformanceStatus,
  { color: string; label: string; accent: string }
> = {
  regular: {
    color: "var(--chart-regular)",
    label: "Regular",
    accent: "text-red-700",
  },
  suficiente: {
    color: "var(--chart-suficiente)",
    label: "Suficiente",
    accent: "text-orange-700",
  },
  bom: {
    color: "var(--chart-bom)",
    label: "Bom",
    accent: "text-green-700",
  },
  otimo: {
    color: "var(--chart-otimo)",
    label: "Otimo",
    accent: "text-blue-700",
  },
};

export const categoryLabels: Record<MetaCategoria, string> = {
  medico: "Medico",
  enfermeiro: "Enfermagem",
  odonto: "Odontologia",
};

export function getPerformanceStatus(
  total: number,
  thresholds: ThresholdConfig,
): PerformanceStatus {
  if (total < thresholds.limite_regular) {
    return "regular";
  }

  if (total < thresholds.limite_suficiente) {
    return "suficiente";
  }

  if (total < thresholds.limite_otimo) {
    return "bom";
  }

  return "otimo";
}

export function buildGaugeData(
  categoria: MetaCategoria,
  total: number,
  thresholds: ThresholdConfig,
): GaugeData {
  const status = getPerformanceStatus(total, thresholds);
  const maxValue = Math.max(thresholds.limite_otimo, total, 1);
  const label = categoryLabels[categoria];
  const summary = `${label}: ${total} acumulado(s)`;

  return {
    categoria,
    label,
    total,
    status,
    maxValue,
    progress: Math.min(total / maxValue, 1),
    thresholds,
    color: statusStyles[status].color,
    summary,
  };
}
