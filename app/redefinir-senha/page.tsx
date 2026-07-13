import Link from "next/link";
import { redefinirSenha } from "./actions";
import { getOptionalUser } from "@/lib/auth/dal";
import { Card, Field, Banner, inputClass } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  // Sessão de recovery já vem configurada por /auth/callback, a partir do
  // token do link do e-mail — não requer login "normal" nem checagem de
  // papel/onboarding, só uma sessão válida qualquer.
  const user = await getOptionalUser();

  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <Card className="max-w-sm">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Link inválido ou expirado
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Esse link de redefinição de senha não é mais válido. Solicite um
            novo para continuar.
          </p>
          <Link
            href="/recuperar-senha"
            className="mt-4 inline-block w-fit rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Solicitar novo link
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <Card className="max-w-sm">
        <form action={redefinirSenha} className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Redefinir senha
          </h1>

          {params.error && <Banner variant="error">{params.error}</Banner>}

          <Field label="Nova senha">
            <input
              type="password"
              name="senha"
              required
              minLength={6}
              className={inputClass}
            />
          </Field>

          <Field label="Confirmar nova senha">
            <input
              type="password"
              name="confirmar_senha"
              required
              minLength={6}
              className={inputClass}
            />
          </Field>

          <SubmitButton pendingText="Salvando..." className="mt-2 w-full">
            Salvar nova senha
          </SubmitButton>
        </form>
      </Card>
    </main>
  );
}
