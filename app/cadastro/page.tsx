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

          <label className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              name="aceite_termos"
              required
              className="mt-0.5"
            />
            <span>
              Li e concordo com os{" "}
              <Link
                href="/termos"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 underline dark:text-blue-400"
              >
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link
                href="/privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 underline dark:text-blue-400"
              >
                Política de Privacidade
              </Link>
              .
            </span>
          </label>

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
