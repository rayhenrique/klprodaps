import { z } from "zod";

const nonNegativeInt = z.coerce.number().int().min(0);

export const productionSchema = z
  .object({
    data: z.string().min(1, "Informe a data do registro."),
    medico: nonNegativeInt,
    enfermeiro: nonNegativeInt,
    odonto: nonNegativeInt,
    receitas: nonNegativeInt,
    notificacoes: nonNegativeInt,
    nutri: nonNegativeInt,
    psico: nonNegativeInt,
    faltas: nonNegativeInt,
    observacao: z
      .string()
      .max(500, "A observacao pode ter no maximo 500 caracteres.")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    const requiresObservation =
      value.medico === 0 || value.enfermeiro === 0 || value.odonto === 0;

    if (requiresObservation && !value.observacao?.trim()) {
      ctx.addIssue({
        code: "custom",
        message:
          "A observacao e obrigatoria quando medico, enfermagem ou odonto estiver zerado.",
        path: ["observacao"],
      });
    }
  });

export type ProductionSchemaInput = z.input<typeof productionSchema>;
export type ProductionSchema = z.output<typeof productionSchema>;
