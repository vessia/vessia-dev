import Link from "next/link";
import { solicitarRecuperacaoSenha } from "./actions";
import { Card, Field, Banner, inputClass } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";

export default async function RecuperarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <Card className="max-w-sm">
        <form
          action={solicitarRecuperacaoSenha}
          className="flex flex-col gap-4"
        >
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Recuperar senha
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </p>

          {params.message && <Banner variant="info">{params.message}</Banner>}
          {params.error && <Banner variant="error">{params.error}</Banner>}

          <Field label="E-mail">
            <input type="email" name="email" required className={inputClass} />
          </Field>

          <SubmitButton pendingText="Enviando..." className="mt-2 w-full">
            Enviar link
          </SubmitButton>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            <Link
              href="/login"
              className="font-medium text-blue-600 underline dark:text-blue-400"
            >
              Voltar para o login
            </Link>
          </p>
        </form>
      </Card>
    </main>
  );
}
