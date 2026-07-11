import Link from "next/link";
import { cadastrar } from "./actions";
import { Card, Field, Banner, inputClass } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <Card className="max-w-sm">
        <form action={cadastrar} className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Criar conta
          </h1>

          {params.error && <Banner variant="error">{params.error}</Banner>}

          <Field label="Nome">
            <input type="text" name="nome" required className={inputClass} />
          </Field>

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

          <fieldset className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <legend className="mb-0.5">Papel</legend>
            <div className="flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-normal text-zinc-700 transition has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700 dark:border-zinc-700 dark:text-zinc-300 dark:has-[:checked]:border-blue-400 dark:has-[:checked]:bg-blue-950/40 dark:has-[:checked]:text-blue-300">
                <input type="radio" name="papel" value="professor" required className="sr-only" />
                Professor
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-normal text-zinc-700 transition has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700 dark:border-zinc-700 dark:text-zinc-300 dark:has-[:checked]:border-blue-400 dark:has-[:checked]:bg-blue-950/40 dark:has-[:checked]:text-blue-300">
                <input type="radio" name="papel" value="aluno" required className="sr-only" />
                Aluno
              </label>
            </div>
          </fieldset>

          <SubmitButton pendingText="Criando..." className="mt-2 w-full">
            Criar conta
          </SubmitButton>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 underline dark:text-blue-400"
            >
              Entrar
            </Link>
          </p>
        </form>
      </Card>
    </main>
  );
}
