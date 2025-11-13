import { z } from "zod";

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/[^\d]/g, "");

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;

  return true;
}

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(3, "Nome deve ter no mínimo 3 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres"),

    email: z.string().email("Email inválido").toLowerCase(),

    cpf: z
      .string()
      .regex(cpfRegex, "CPF deve estar no formato 000.000.000-00")
      .refine(isValidCPF, "CPF inválido"),

    password: z
      .string()
      .min(6, "Senha deve ter no mínimo 6 caracteres")
      .max(100, "Senha deve ter no máximo 100 caracteres"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),

  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const depositSchema = z.object({
  amount: z
    .string()
    .min(1, "Valor é obrigatório")
    .refine((val) => {
      const cleaned = val.replace(/\D/g, "");
      if (!cleaned) return false;
      const number = parseInt(cleaned, 10) / 100;
      return number > 0;
    }, "Valor deve ser maior que zero")
    .refine((val) => {
      const cleaned = val.replace(/\D/g, "");
      if (!cleaned) return false;
      const number = parseInt(cleaned, 10) / 100;
      return number <= 1000000;
    }, "Valor máximo: R$ 1.000.000,00"),

  description: z
    .string()
    .max(255, "Descrição deve ter no máximo 255 caracteres")
    .optional(),
});

export type DepositFormData = z.infer<typeof depositSchema>;

export const transferSchema = z.object({
  recipientCpf: z
    .string()
    .min(1, "CPF do destinatário é obrigatório")
    .regex(cpfRegex, "CPF deve estar no formato 000.000.000-00")
    .refine(isValidCPF, "CPF do destinatário inválido"),

  amount: z
    .string()
    .min(1, "Valor é obrigatório")
    .refine((val) => {
      const cleaned = val.replace(/\D/g, "");
      if (!cleaned) return false;
      const number = parseInt(cleaned, 10) / 100;
      return number > 0;
    }, "Valor deve ser maior que zero")
    .refine((val) => {
      const cleaned = val.replace(/\D/g, "");
      if (!cleaned) return false;
      const number = parseInt(cleaned, 10) / 100;
      return number <= 1000000;
    }, "Valor máximo: R$ 1.000.000,00"),

  description: z
    .string()
    .max(255, "Descrição deve ter no máximo 255 caracteres")
    .optional(),
});

export type TransferFormData = z.infer<typeof transferSchema>;

export const validateCPF = (cpf: string): boolean => {
  return cpfRegex.test(cpf) && isValidCPF(cpf);
};

export const validateEmail = (email: string): boolean => {
  return z.string().email().safeParse(email).success;
};

export const validateAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000;
};

export const validateUUID = (uuid: string): boolean => {
  return z.string().uuid().safeParse(uuid).success;
};
