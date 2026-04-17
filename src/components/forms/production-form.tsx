"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Plus, SendHorizonal } from "lucide-react";
import {
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { saveDailyProduction } from "@/actions/production";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLocalTodayISO } from "@/lib/utils/date";
import {
  productionSchema,
  type ProductionSchemaInput,
  type ProductionSchema,
} from "@/lib/validations/production";
import type { ProductionRecord } from "@/types/domain";

type ProductionFormProps = {
  initialRecord: ProductionRecord | null;
  isWeekend: boolean;
};

type NumericFieldName = keyof Pick<
  ProductionSchemaInput,
  | "medico"
  | "enfermeiro"
  | "odonto"
  | "receitas"
  | "notificacoes"
  | "nutri"
  | "psico"
  | "faltas"
>;

const numericFields: Array<{
  key: NumericFieldName;
  label: string;
}> = [
  { key: "medico", label: "Medico" },
  { key: "enfermeiro", label: "Enfermagem" },
  { key: "odonto", label: "Odontologia" },
  { key: "receitas", label: "Receitas" },
  { key: "notificacoes", label: "Notificacoes" },
  { key: "nutri", label: "Nutri" },
  { key: "psico", label: "Psicologia" },
  { key: "faltas", label: "Faltas" },
];

function buildDefaults(record: ProductionRecord | null): ProductionSchema {
  return {
    data: record?.data ?? getLocalTodayISO(),
    medico: record?.medico ?? 0,
    enfermeiro: record?.enfermeiro ?? 0,
    odonto: record?.odonto ?? 0,
    receitas: record?.receitas ?? 0,
    notificacoes: record?.notificacoes ?? 0,
    nutri: record?.nutri ?? 0,
    psico: record?.psico ?? 0,
    faltas: record?.faltas ?? 0,
    observacao: record?.observacao ?? "",
  };
}

type NumericStepperFieldProps = {
  name: NumericFieldName;
  label: string;
  control: Control<ProductionSchemaInput>;
  register: UseFormRegister<ProductionSchemaInput>;
  setValue: UseFormSetValue<ProductionSchemaInput>;
  errors: FieldErrors<ProductionSchemaInput>;
  disabled: boolean;
};

function NumericStepperField({
  name,
  label,
  control,
  register,
  setValue,
  errors,
  disabled,
}: NumericStepperFieldProps) {
  const value = useWatch({
    control,
    name,
  });
  const safeValue = Number(value ?? 0);
  const error = errors[name]?.message;

  return (
    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Label htmlFor={name}>{label}</Label>
        <span className="text-xs text-muted-foreground">Inteiro</span>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() =>
            setValue(name, Math.max(0, safeValue - 1), {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          disabled={disabled}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          id={name}
          className="h-14 text-center text-2xl font-semibold"
          inputMode="numeric"
          type="number"
          min={0}
          {...register(name, { valueAsNumber: true })}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() =>
            setValue(name, safeValue + 1, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {typeof error === "string" ? (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

export function ProductionForm({
  initialRecord,
  isWeekend,
}: ProductionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProductionSchemaInput, unknown, ProductionSchema>({
    resolver: zodResolver(productionSchema),
    defaultValues: buildDefaults(initialRecord),
  });

  useEffect(() => {
    form.reset(buildDefaults(initialRecord));
  }, [form, initialRecord]);

  const onSubmit = form.handleSubmit((values) => {
    const toastId = toast.loading(
      initialRecord ? "Atualizando producao..." : "Salvando producao...",
    );

    startTransition(async () => {
      const result = await saveDailyProduction(values);

      toast.dismiss(toastId);

      if (!result.success) {
        if (result.issues?.length) {
          toast.error(result.issues.join(" "));
        } else {
          toast.error(result.message);
        }
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  });

  return (
    <Card className="rounded-[2rem]">
      <CardHeader>
        <CardTitle>Lancamento diario</CardTitle>
        <CardDescription>
          Formulario mobile-first com validacao por data atual, fim de semana e
          observacao obrigatoria quando houver zero nas categorias principais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" {...form.register("data")} disabled />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {numericFields.map((field) => (
              <NumericStepperField
                key={field.key}
                control={form.control}
                disabled={isWeekend || isPending}
                errors={form.formState.errors}
                label={field.label}
                name={field.key}
                register={form.register}
                setValue={form.setValue}
              />
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observacao operacional</Label>
            <Textarea
              id="observacao"
              placeholder="Justifique baixas de producao, faltas da equipa ou qualquer ocorrencia operacional."
              {...form.register("observacao")}
              disabled={isWeekend || isPending}
            />
            <p className="text-xs text-muted-foreground">
              Obrigatoria quando medico, enfermagem ou odontologia estiverem zerados.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {isWeekend
                ? "Envio bloqueado no fim de semana."
                : "O registro vale para a data atual e fica sujeito a RLS."}
            </div>
            <Button
              size="lg"
              type="submit"
              disabled={isWeekend || isPending}
              className="w-full sm:w-auto"
            >
              <SendHorizonal className="h-4 w-4" />
              {isPending
                ? "Salvando..."
                : initialRecord
                  ? "Atualizar hoje"
                  : "Enviar hoje"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
