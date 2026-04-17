import { productionSchema } from "@/lib/validations/production";

describe("production schema", () => {
  const basePayload = {
    data: "2026-04-16",
    medico: 10,
    enfermeiro: 8,
    odonto: 6,
    receitas: 12,
    notificacoes: 2,
    nutri: 1,
    psico: 1,
    faltas: 0,
    observacao: "",
  };

  it("accepts valid daily production", () => {
    const result = productionSchema.safeParse(basePayload);

    expect(result.success).toBe(true);
  });

  it("requires observation when a core category is zero", () => {
    const result = productionSchema.safeParse({
      ...basePayload,
      medico: 0,
      observacao: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("observacao");
    }
  });

  it("accepts zero in core category when observation is filled", () => {
    const result = productionSchema.safeParse({
      ...basePayload,
      odonto: 0,
      observacao: "Odontologia sem atendimento por ausencia do profissional.",
    });

    expect(result.success).toBe(true);
  });
});
