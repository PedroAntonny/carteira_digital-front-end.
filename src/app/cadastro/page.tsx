"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Card, CardHeader } from "@/components/Card";
import { registerAction, loginAction } from "@/lib/actions";
import { setToken, setUser } from "@/lib/token";
import { formatCPF, cleanCPF } from "@/lib/utils";
import { registerSchema, type RegisterFormData } from "@/lib/validations";

export default function CadastroPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const cpfValue = watch("cpf");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const registerResult = await registerAction({
        name: data.name,
        email: data.email,
        password: data.password,
        cpf: cleanCPF(data.cpf),
      });

      if (!registerResult.success) {
        toast.error(registerResult.error || "Erro ao cadastrar");
        return;
      }

      const loginResult = await loginAction({
        email: data.email,
        password: data.password,
      });

      if (!loginResult.success) {
        toast.error(loginResult.error || "Erro ao fazer login");
        return;
      }

      if (loginResult.data?.access_token) {
        setToken(loginResult.data.access_token);
      }
      if (loginResult.data?.user) {
        setUser(loginResult.data.user);
      }

      toast.success("Cadastro realizado com sucesso!");
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        toast.error(String(err.message) || "Erro ao cadastrar");
      } else {
        toast.error("Erro ao cadastrar");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setValue("cpf", formatted, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader title="Cadastro" subtitle="Crie sua carteira digital" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome completo"
              type="text"
              {...register("name")}
              error={errors.name?.message}
              placeholder="João Silva"
            />

            <Input
              label="Email"
              type="email"
              {...register("email")}
              error={errors.email?.message}
              placeholder="seu@email.com"
            />

            <Input
              label="CPF"
              type="text"
              value={cpfValue || ""}
              onChange={handleCPFChange}
              error={errors.cpf?.message}
              placeholder="000.000.000-00"
              maxLength={14}
            />

            <Input
              label="Senha"
              type="password"
              {...register("password")}
              error={errors.password?.message}
              placeholder="••••••••"
            />

            <Input
              label="Confirmar senha"
              type="password"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
              placeholder="••••••••"
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Cadastrar
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Faça login
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              ← Voltar para início
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
