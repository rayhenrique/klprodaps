"use client";

import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  LineChart,
  ShieldCheck,
  Smartphone,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/marketing/animated-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type LandingPageProps = {
  systemName: string;
  logoUrl: string | null;
  whatsappHref: string;
};

type GaugeTone = "emerald" | "orange" | "red" | "blue";

type MarketingGauge = {
  label: string;
  shortLabel: string;
  total: number;
  thresholds: {
    regular: number;
    suficiente: number;
    bom: number;
    otimo: number;
  };
  tone: GaugeTone;
};

const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const revealUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, ease: smoothEase },
};

const gaugeToneMap: Record<
  GaugeTone,
  {
    main: string;
    soft: string;
    border: string;
    text: string;
  }
> = {
  emerald: {
    main: "#10b981",
    soft: "rgba(16, 185, 129, 0.14)",
    border: "rgba(16, 185, 129, 0.24)",
    text: "text-emerald-700",
  },
  orange: {
    main: "#f97316",
    soft: "rgba(249, 115, 22, 0.14)",
    border: "rgba(249, 115, 22, 0.24)",
    text: "text-orange-700",
  },
  red: {
    main: "#ef4444",
    soft: "rgba(239, 68, 68, 0.14)",
    border: "rgba(239, 68, 68, 0.24)",
    text: "text-red-700",
  },
  blue: {
    main: "#2563eb",
    soft: "rgba(37, 99, 235, 0.14)",
    border: "rgba(37, 99, 235, 0.24)",
    text: "text-blue-700",
  },
};

const heroGauges: MarketingGauge[] = [
  {
    label: "Médico",
    shortLabel: "MED",
    total: 214,
    thresholds: {
      regular: 100,
      suficiente: 150,
      bom: 250,
      otimo: 300,
    },
    tone: "emerald",
  },
  {
    label: "Enfermagem",
    shortLabel: "ENF",
    total: 162,
    thresholds: {
      regular: 100,
      suficiente: 150,
      bom: 250,
      otimo: 300,
    },
    tone: "orange",
  },
  {
    label: "Odonto",
    shortLabel: "ODONT",
    total: 96,
    thresholds: {
      regular: 100,
      suficiente: 150,
      bom: 250,
      otimo: 300,
    },
    tone: "red",
  },
];

const heroStats = [
  {
    value: 57,
    label: "UBS acompanhadas em uma visão única",
    tone: "emerald",
  },
  {
    value: 1284,
    label: "Atendimentos totais visualizados no mês",
    tone: "blue",
  },
  {
    value: 9,
    label: "Pendências identificadas no mesmo dia",
    tone: "orange",
  },
] as const;

const differentiators = [
  {
    icon: ClipboardList,
    title: "Fim do Caos",
    description:
      "Diga adeus ao preenchimento fragmentado e à demora na consolidação mensal das planilhas.",
    accent: "from-red-500/15 to-orange-500/15",
  },
  {
    icon: Target,
    title: "Metas Reais",
    description:
      "Configure metas quantitativas absolutas por UBS. Sem porcentagens confusas, apenas números diretos e claros.",
    accent: "from-blue-500/15 to-cyan-400/15",
  },
  {
    icon: Smartphone,
    title: "Foco no Diretor",
    description:
      "Interface mobile-first pensada para o dia a dia corrido das unidades, com cliques rápidos e feedback visual.",
    accent: "from-emerald-500/15 to-teal-400/15",
  },
];

const footerLinks = [
  { href: "#hero", label: "Início" },
  { href: "#diferenciais", label: "Diferenciais" },
  { href: "#governanca", label: "Governança" },
  { href: "/login", label: "Acessar sistema" },
];

function polarToCartesian(centerX: number, centerY: number, radius: number, angle: number) {
  const angleInRadians = ((angle - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

function getNextMilestone(gauge: MarketingGauge) {
  const thresholds = [
    { value: gauge.thresholds.regular, label: "Regular" },
    { value: gauge.thresholds.suficiente, label: "Suficiente" },
    { value: gauge.thresholds.bom, label: "Bom" },
    { value: gauge.thresholds.otimo, label: "Ótimo" },
  ];

  const next = thresholds.find((item) => gauge.total < item.value);

  if (!next) {
    return {
      delta: 0,
      label: "Ótimo",
      message: "Meta máxima atingida neste momento.",
    };
  }

  return {
    delta: next.value - gauge.total,
    label: next.label,
    message: `Faltam ${next.value - gauge.total} para chegar à faixa ${next.label}.`,
  };
}

function MarketingGaugeCard({
  gauge,
  delay = 0,
}: {
  gauge: MarketingGauge;
  delay?: number;
}) {
  const progress = Math.min(gauge.total / gauge.thresholds.otimo, 1);
  const angle = -90 + progress * 180;
  const tone = gaugeToneMap[gauge.tone];
  const nextMilestone = getNextMilestone(gauge);
  const segments = [
    { from: 180, to: 135, color: "#ef4444" },
    { from: 135, to: 90, color: "#f97316" },
    { from: 90, to: 30, color: "#10b981" },
    { from: 30, to: 0, color: "#2563eb" },
  ];

  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{
        delay,
        duration: 6.2,
        ease: "easeInOut",
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "mirror",
      }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="group relative h-full"
    >
      <Card className="relative h-full overflow-hidden rounded-[1.45rem] border-white/80 bg-white/92 shadow-[0_20px_55px_-28px_rgba(15,23,42,0.22)]">
        <div
          className="absolute inset-x-4 top-2 h-16 rounded-full blur-3xl"
          style={{ background: tone.soft }}
        />
        <CardContent className="relative p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.28em] text-muted-foreground">
                {gauge.shortLabel}
              </p>
              <p className="mt-1 text-sm font-medium leading-none text-foreground">
                {gauge.label}
              </p>
            </div>
            <div
              className="rounded-full border px-2.5 py-1 text-[10px] font-semibold"
              style={{
                backgroundColor: tone.soft,
                borderColor: tone.border,
                color: tone.main,
              }}
            >
              Meta {gauge.thresholds.otimo}
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center text-center">
            <div className="relative mx-auto h-[5.5rem] w-full max-w-[5.8rem]">
              <svg aria-hidden viewBox="0 0 140 92" className="h-full w-full overflow-visible">
                {segments.map((segment) => (
                  <path
                    key={`${segment.from}-${segment.to}`}
                    d={describeArc(70, 70, 48, segment.from, segment.to)}
                    fill="none"
                    stroke={segment.color}
                    strokeLinecap="round"
                    strokeWidth="9"
                    opacity={0.92}
                  />
                ))}

                <path
                  d={describeArc(70, 70, 36, 180, 0)}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeLinecap="round"
                  strokeWidth="9"
                />

                <motion.g
                  initial={{ rotate: -90 }}
                  whileInView={{ rotate: angle }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{
                    delay: 0.25 + delay,
                    duration: 1.1,
                    ease: smoothEase,
                  }}
                  style={{
                    originX: "70px",
                    originY: "70px",
                  }}
                >
                  <line
                    x1="70"
                    y1="70"
                    x2="70"
                    y2="28"
                    stroke={tone.main}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                </motion.g>

                <circle cx="70" cy="70" r="7" fill="#0f172a" />
                <circle cx="70" cy="70" r="3" fill="#ffffff" />
              </svg>
            </div>

            <div className="mt-2 min-w-0 w-full">
              <AnimatedCounter
                value={gauge.total}
                className="text-3xl font-semibold tracking-tight text-slate-950"
              />
              <p className="mt-1 text-xs leading-5 text-slate-500">acumulado no mês</p>
              <p
                className={cn(
                  "mt-3 rounded-2xl border px-3 py-2 text-xs font-medium transition-all duration-200 group-hover:-translate-y-0.5",
                  tone.text,
                )}
                style={{
                  backgroundColor: tone.soft,
                  borderColor: tone.border,
                }}
              >
                {nextMilestone.delta > 0
                  ? `Faltam ${nextMilestone.delta} para ${nextMilestone.label}`
                  : "Faixa máxima alcançada"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PhoneMockup() {
  const quickFields = [
    { label: "Médico", value: 12 },
    { label: "Enfermagem", value: 15 },
    { label: "Odonto", value: 7 },
  ] as const;

  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6.5, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      className="relative z-10 mx-auto w-full max-w-[17rem]"
    >
      <div className="absolute -right-4 top-8 rounded-full bg-emerald-400/25 px-3 py-2 text-[11px] font-semibold text-emerald-800 shadow-lg backdrop-blur-md">
        Registro em menos de 40s
      </div>
      <div className="overflow-hidden rounded-[2.2rem] border border-slate-200 bg-slate-950 p-3 shadow-[0_30px_80px_-24px_rgba(15,23,42,0.45)]">
        <div className="rounded-[1.7rem] bg-white px-4 pb-4 pt-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Formulário rápido
              </p>
              <p className="text-sm font-semibold text-slate-900">Produção diária</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
              Hoje
            </div>
          </div>

          <div className="space-y-3">
            {quickFields.map((field) => (
              <div
                key={field.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">{field.label}</span>
                  <span className="text-xs text-slate-400">toque rápido</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-500 shadow-sm"
                  >
                    -
                  </button>
                  <div className="flex-1 rounded-2xl bg-white py-3 text-center text-2xl font-semibold text-slate-950 shadow-sm">
                    {field.value}
                  </div>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-500 shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">Observação</p>
            <p className="mt-2 text-sm text-slate-700">
              Equipe odontológica reduzida por manutenção da cadeira.
            </p>
          </div>

          <motion.div whileTap={{ scale: 0.98 }} className="mt-4">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-slate-950/25"
            >
              <CheckCircle2 className="h-4 w-4" />
              Enviar produção
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function TabletMockup() {
  const pendingUnits = ["UBS Lago Azul", "UBS Nova Esperança", "UBS Centro Sul"];
  const notes = [
    "UBS Lago Azul: queda pontual por ausências da equipe médica.",
    "UBS Centro Sul: odontologia em agenda reduzida por manutenção.",
  ];

  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{
        duration: 7.5,
        ease: "easeInOut",
        repeat: Number.POSITIVE_INFINITY,
        delay: 0.25,
      }}
      className="relative z-20 mx-auto w-full max-w-[22rem] sm:max-w-[34rem] lg:max-w-[42rem]"
    >
      <div className="overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/92 p-1.5 shadow-[0_32px_110px_-28px_rgba(37,99,235,0.28)] backdrop-blur-xl">
        <div className="rounded-[1.7rem] border border-slate-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(239,247,255,0.94))] p-3 sm:p-5">
          <div className="rounded-[1.45rem] border border-slate-200/80 bg-white/92 px-3 py-3 shadow-sm sm:px-4">
            <div className="space-y-4">
              <div className="max-w-[24rem]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-blue-600">
                  Painel da coordenação
                </p>
                <h3 className="mt-2 text-lg font-semibold leading-tight tracking-tight text-slate-950 sm:text-[1.75rem]">
                  Monitoramento de metas e pendências em tempo real
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {heroStats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={cn(
                      "rounded-2xl border px-3 py-2.5 shadow-sm",
                      index === 0 && "border-emerald-200 bg-emerald-50/90",
                      index === 1 && "border-blue-200 bg-blue-50/90",
                      index === 2 && "border-orange-200 bg-orange-50/90",
                    )}
                  >
                    <AnimatedCounter
                      value={stat.value}
                      className="text-base font-semibold tracking-tight text-slate-950 sm:text-xl"
                    />
                    <p className="mt-1 text-[10px] leading-snug text-slate-600 sm:text-[11px]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {heroGauges.map((gauge, index) => (
                <MarketingGaugeCard
                  key={gauge.label}
                  gauge={gauge}
                  delay={index * 0.1}
                />
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.45rem] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Pendências do dia</p>
                    <p className="mt-1 text-xs text-slate-500">Unidades que ainda não enviaram</p>
                  </div>
                  <Badge variant="warning">3 UBS</Badge>
                </div>

                <div className="space-y-2.5">
                  {pendingUnits.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-slate-700">{item}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.45rem] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Observações de campo</p>
                    <p className="mt-1 text-xs text-slate-500">Justificativas registradas no dia</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {notes.map((item, index) => (
                    <div
                      key={item}
                      className={cn(
                        "rounded-2xl border px-3 py-3 text-sm leading-6",
                        index === 0
                          ? "border-emerald-200 bg-emerald-50/80 text-slate-700"
                          : "border-slate-200 bg-slate-50 text-slate-600",
                      )}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function LandingPage({
  systemName,
  logoUrl,
  whatsappHref,
}: LandingPageProps) {
  return (
    <main className="relative overflow-hidden pb-20 sm:pb-24">
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,#ffffff_0%,#eefcff_30%,#f7fbff_72%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-8rem] top-[-3rem] h-[24rem] w-[24rem] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute right-[-6rem] top-[6rem] h-[18rem] w-[18rem] rounded-full bg-blue-300/25 blur-3xl" />
        <div className="absolute bottom-[12rem] left-[12%] h-[16rem] w-[16rem] rounded-full bg-emerald-300/18 blur-3xl" />
      </div>

      <header className="page-shell pt-4 sm:pt-5">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-panel flex items-center justify-between gap-3 rounded-[1.6rem] border border-white/70 px-4 py-3 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.18)] sm:px-5 sm:py-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-white shadow-lg">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={systemName} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-slate-950">
                {systemName}
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Tecnologia para Secretarias Municipais de Saúde
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-sm text-slate-600">
            <div className="hidden items-center gap-1 md:flex">
              {footerLinks.slice(0, 3).map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full px-3 py-2 transition-colors hover:bg-white hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/80 bg-white/90 px-4"
              >
                <Link href="/login">Acessar Sistema</Link>
              </Button>
            </motion.div>
          </nav>
        </motion.div>
      </header>

      <section id="hero" className="page-shell pt-8 sm:pt-12 lg:pt-14">
        <div className="grid items-center gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:gap-12">
          <motion.div {...revealUp} className="relative">
            <Badge
              variant="secondary"
              className="rounded-full border border-white/80 bg-white/85 px-4 py-2 text-slate-700 shadow-sm"
            >
              <BadgeCheck className="mr-1 h-3.5 w-3.5 text-emerald-600" />
              SaaS para gestão de atenção primária no Brasil
            </Badge>

            <h1 className="mt-5 max-w-3xl text-[clamp(2.9rem,11vw,5.9rem)] font-semibold leading-[0.94] tracking-[-0.05em] text-slate-950 text-balance">
              O ProdAPS transforma a produtividade da sua UBS em gestão estratégica.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Abandone as planilhas manuais. Uma solução digital para diretores lançarem
              a produção pelo celular e coordenadores acompanharem metas e pendências em
              tempo real.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="cta-shimmer w-full rounded-2xl bg-slate-950 px-6 py-6 text-base shadow-[0_18px_50px_-20px_rgba(15,23,42,0.45)] sm:w-auto"
                >
                  <Link href={whatsappHref} target="_blank" rel="noreferrer">
                    Solicitar Demonstração
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full rounded-2xl border-white/80 bg-white/90 px-6 py-6 text-base shadow-sm sm:w-auto"
                >
                  <Link href="/login">Acessar Sistema</Link>
                </Button>
              </motion.div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {heroStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ delay: 0.15 + index * 0.08, duration: 0.55 }}
                  className={cn(
                    "rounded-[1.45rem] border px-4 py-4 shadow-sm",
                    stat.tone === "emerald" && "border-emerald-200 bg-white/90",
                    stat.tone === "blue" && "border-blue-200 bg-white/90",
                    stat.tone === "orange" && "border-orange-200 bg-white/90",
                  )}
                >
                  <p className="text-3xl font-semibold tracking-tight text-slate-950">
                    <AnimatedCounter value={stat.value} />
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            {...revealUp}
            transition={{ ...revealUp.transition, delay: 0.1 }}
            className="relative min-h-[24rem] sm:min-h-[28rem] lg:min-h-[32rem] xl:min-h-[41rem]"
          >
            <div className="absolute left-0 top-12 z-10 hidden w-[34%] min-w-[14rem] xl:block">
              <PhoneMockup />
            </div>

            <div className="relative z-20 mx-auto w-full xl:absolute xl:right-0 xl:top-0 xl:w-[76%]">
              <TabletMockup />
            </div>
          </motion.div>
        </div>
      </section>

      <section id="diferenciais" className="page-shell pt-16 sm:pt-20">
        <motion.div {...revealUp} className="mb-8 max-w-3xl">
          <Badge className="rounded-full bg-white/80 text-slate-700 shadow-sm">
            Diferenciais do produto
          </Badge>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Gestão de Atenção Primária Inteligente e Sem Burocracia
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Pensado para Secretarias de Saúde brasileiras que precisam cobrar dados,
            fechar relatórios e reagir rápido sem sobrecarregar as equipes das unidades.
          </p>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-3">
          {differentiators.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: index * 0.08, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="h-full"
            >
              <Card className="relative h-full overflow-hidden rounded-[2rem] border-white/80 bg-white/92">
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-28 bg-gradient-to-br blur-2xl",
                    item.accent,
                  )}
                />
                <CardHeader className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="pt-4 text-2xl">{item.title}</CardTitle>
                  <CardDescription className="text-base leading-7 text-slate-600">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="governanca" className="page-shell pt-16 sm:pt-20">
        <motion.div
          {...revealUp}
          className="overflow-hidden rounded-[2.2rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94),rgba(37,99,235,0.86))] shadow-[0_32px_120px_-32px_rgba(15,23,42,0.45)]"
        >
          <div className="grid gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:py-12">
            <div className="space-y-5 text-white">
              <Badge className="w-fit rounded-full bg-white/10 text-white">
                Governança e segurança
              </Badge>
              <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Dados confiáveis, justificativas registradas e decisão mais rápida para a coordenação.
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
                O painel mostra o que falta, quem precisa de apoio e quais quedas de produção
                vieram acompanhadas de contexto operacional. Tudo com isolamento por perfil
                e visibilidade adequada para cada papel.
              </p>

              <div className="grid gap-3 pt-2">
                {[
                  "RLS por UBS para proteger o acesso do diretor.",
                  "Pendências do dia visíveis logo no topo do painel.",
                  "Observações de campo integradas ao registro de produção.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-100"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <motion.div
                whileHover={{ y: -6 }}
                className="rounded-[1.8rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">
                      Pendências
                    </p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      Saiba na hora quem ainda não enviou os dados do dia
                    </p>
                  </div>
                  <div className="rounded-full bg-orange-400/15 px-3 py-1 text-xs font-semibold text-orange-100">
                    Tempo real
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "UBS José de Alencar", risk: "Não enviou até 15h40" },
                    { name: "UBS Praia do Futuro", risk: "Sem atualização hoje" },
                    { name: "UBS Vila Nova", risk: "Equipe sinalizou atraso" },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3"
                    >
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-300">{item.risk}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -6 }}
                className="rounded-[1.8rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                      Observações
                    </p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      Justificativas integradas para quedas de produção, direto no sistema
                    </p>
                  </div>
                  <Activity className="h-5 w-5 text-emerald-200" />
                </div>
                <div className="space-y-3">
                  {[
                    "Escala médica ajustada por capacitação externa no turno da manhã.",
                    "Equipe de enfermagem reforçada no acolhimento após aumento de demanda.",
                    "Odontologia com agenda reduzida por manutenção preventiva.",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm",
                        index === 1
                          ? "border border-emerald-300/30 bg-emerald-400/10 text-emerald-50"
                          : "border border-white/10 bg-slate-950/30 text-slate-200",
                      )}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="page-shell pt-16 sm:pt-20">
        <motion.div
          {...revealUp}
          className="rounded-[2rem] border border-white/80 bg-white/90 px-5 py-6 shadow-[0_18px_70px_-28px_rgba(15,23,42,0.2)] sm:px-6 sm:py-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Pronto para substituir planilhas por visibilidade operacional?
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Leve para a sua Secretaria de Saúde uma experiência mais simples para a ponta
                e uma governança muito mais acionável para a coordenação.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <motion.div whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="cta-shimmer w-full rounded-2xl bg-slate-950 px-6 py-6 text-base sm:w-auto"
                >
                  <Link href={whatsappHref} target="_blank" rel="noreferrer">
                    Solicitar Demonstração
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full rounded-2xl border-slate-200 bg-white px-6 py-6 text-base sm:w-auto"
                >
                  <Link href="/login">Acessar Sistema</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="page-shell pt-16 sm:pt-20">
        <div className="rounded-[2rem] border border-slate-200/70 bg-white/85 px-5 py-6 shadow-[0_16px_60px_-28px_rgba(15,23,42,0.18)] sm:px-6 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                  PA
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-950">{systemName}</p>
                  <p className="text-sm text-slate-500">
                    Plataforma de governança para atenção primária em saúde.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              {footerLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="transition-colors hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Desenvolvido para Secretarias de Saúde que precisam de produtividade com contexto,
              segurança e velocidade.
            </p>

            <Link
              href="https://kltecnologia.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-950"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                KL
              </span>
              <span>
                Desenvolvido por: <span className="font-semibold">KL Tecnologia</span>{" "}
                (kltecnologia.com)
              </span>
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
