import Link from "next/link";
import { login } from "./actions";
import { Card, Field, Banner, inputClass } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <Card className="max-w-sm">
        <form action={login} className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Entrar
          </h1>

          {params.message && <Banner variant="info">{params.message}</Banner>}
          {params.error && <Banner variant="error">{params.error}</Banner>}

          <Field label="E-mail">
            <input type="email" name="email" required className={inputClass} />
          </Field>

          <Field label="Senha">
            <input
              type="password"
              name="senha"
              required
              minLength={6}
              className={inputClass}
            />
          </Field>

          <SubmitButton pendingText="Entrando..." className="mt-2 w-full">
            Entrar
          </SubmitButton>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Não tem conta?{" "}
            <Link
              href="/cadastro"
              className="font-medium text-blue-600 underline dark:text-blue-400"
            >
              Criar conta
            </Link>
          </p>
        </form>
      </Card>
    </main>
  );
}
