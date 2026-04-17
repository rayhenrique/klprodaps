import { AlertTriangle, CalendarDays, Clock3, MapPin } from "lucide-react";
import { GaugeChart } from "@/components/charts/gauge-chart";
import { ProductionForm } from "@/components/forms/production-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { DirectorDashboardData } from "@/types/domain";

type DirectorDashboardProps = {
  data: DirectorDashboardData;
};

export function DirectorDashboard({ data }: DirectorDashboardProps) {
  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60">
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="info">Dashboard do diretor</Badge>
            <CardTitle className="text-3xl tracking-tight">
              {data.profile.ubs?.nome}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm">
              Acompanhamento quantitativo da competenca atual com acumuladores absolutos
              e semaforo por categoria.
            </CardDescription>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white/80 px-4 py-3">
              <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                <CalendarDays className="h-4 w-4" />
                Competencia
              </div>
              <p>{data.competencia.label}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/80 px-4 py-3">
              <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                <Clock3 className="h-4 w-4" />
                Regra do dia
              </div>
              <p>{data.isWeekend ? "Bloqueado por fim de semana" : "Edicao liberada hoje"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/80 px-4 py-3">
              <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                <MapPin className="h-4 w-4" />
                Endereco
              </div>
              <p>{data.profile.ubs?.endereco}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-3">
            {data.gauges.map((gauge) => (
              <Card key={gauge.categoria} className="rounded-[1.75rem]">
                <CardHeader>
                  <CardTitle className="text-base">{gauge.label}</CardTitle>
                  <CardDescription>{gauge.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <GaugeChart gauge={gauge} />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {data.isWeekend ? (
        <Card className="rounded-[2rem] border-orange-200 bg-orange-50/90">
          <CardContent className="flex items-start gap-4 p-6">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-600" />
            <div className="space-y-1">
              <p className="font-medium text-orange-900">Envio bloqueado neste momento</p>
              <p className="text-sm text-orange-800">
                Pela regra do MVP, o formulario diario fica desativado em sabados e domingos.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Separator />
      <ProductionForm initialRecord={data.todayRecord} isWeekend={data.isWeekend} />
    </div>
  );
}
