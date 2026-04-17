"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";
import { statusStyles } from "@/lib/dashboard/status";
import { cn } from "@/lib/utils";
import type { GaugeData } from "@/types/domain";

type GaugeChartProps = {
  gauge: GaugeData;
  compact?: boolean;
  className?: string;
};

export function GaugeChart({
  gauge,
  compact = false,
  className,
}: GaugeChartProps) {
  const meta = statusStyles[gauge.status];
  const chartData = [{ name: gauge.label, value: gauge.total, fill: gauge.color }];
  const chartWidth = compact ? 180 : 260;
  const chartHeight = compact ? 120 : 220;

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <div
        className={cn("relative flex w-full justify-center", compact ? "h-40" : "h-64")}
      >
        <RadialBarChart
          width={chartWidth}
          height={chartHeight}
          cx="50%"
          cy="78%"
          data={chartData}
          endAngle={0}
          innerRadius={compact ? "62%" : "58%"}
          outerRadius={compact ? "100%" : "96%"}
          startAngle={180}
        >
          <PolarAngleAxis domain={[0, gauge.maxValue]} tick={false} type="number" />
          <RadialBar
            background={{
              fill: "#e2e8f0",
            }}
            cornerRadius={compact ? 8 : 12}
            dataKey="value"
          />
        </RadialBarChart>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1">
          <span
            className={cn(
              "rounded-full border border-white/50 bg-white/80 px-3 py-1 text-xs font-semibold shadow-sm",
              meta.accent,
            )}
          >
            {meta.label}
          </span>
          <div className="text-center">
            <p className={cn("font-semibold tracking-tight", compact ? "text-xl" : "text-4xl")}>
              {gauge.total}
            </p>
            <p className="text-xs text-muted-foreground">{gauge.label}</p>
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="mt-3 grid w-full grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
          <div>
            <p className="font-medium text-red-700">Regular</p>
            <p>&lt; {gauge.thresholds.limite_regular}</p>
          </div>
          <div>
            <p className="font-medium text-orange-700">Suficiente</p>
            <p>&lt; {gauge.thresholds.limite_suficiente}</p>
          </div>
          <div>
            <p className="font-medium text-green-700">Bom</p>
            <p>&lt; {gauge.thresholds.limite_otimo}</p>
          </div>
          <div>
            <p className="font-medium text-blue-700">Otimo</p>
            <p>&gt;= {gauge.thresholds.limite_otimo}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
