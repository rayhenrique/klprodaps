import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email("Informe um email valido."),
  password: z
    .string()
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(72, "A senha precisa ter no maximo 72 caracteres."),
  nome_completo: z.string().min(3, "Informe o nome completo."),
  role: z.enum(["superadmin", "coordenador", "diretor"]),
  ubs_id: z.string().uuid().nullable().optional(),
});

export const updateUserSchema = z.object({
  id: z.string().uuid("Utilizador invalido."),
  nome_completo: z.string().min(3, "Informe o nome completo."),
  role: z.enum(["superadmin", "coordenador", "diretor"]),
  ubs_id: z.string().uuid().nullable().optional(),
  password: z
    .string()
    .max(72, "A senha precisa ter no maximo 72 caracteres.")
    .optional()
    .or(z.literal("")),
});

export const upsertUbsSchema = z.object({
  nome: z.string().min(3, "Informe o nome da UBS."),
  endereco: z.string().min(5, "Informe o endereco da UBS."),
  contato: z.string().optional().or(z.literal("")),
});

export const goalConfigSchema = z.object({
  ubs_id: z.string().uuid("Selecione uma UBS."),
  categoria: z.enum(["medico", "enfermeiro", "odonto"]),
  limite_regular: z.coerce.number().int().min(0),
  limite_suficiente: z.coerce.number().int().min(1),
  limite_bom: z.coerce.number().int().min(1),
  limite_otimo: z.coerce.number().int().min(1),
});

export const brandingSchema = z.object({
  nome_sistema: z
    .string()
    .min(3, "Informe o nome do sistema.")
    .max(50, "Use ate 50 caracteres."),
});
