import Link from "next/link";
import { requireProfessor } from "@/lib/auth/dal";
import { criarProjeto } from "../actions";
import { Card, Field, Banner, inputClass } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";

export default async function NovoProjetoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireProfessor();
  const params = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <Card className="max-w-2xl">
        <form action={criarProjeto} className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Novo projeto
          </h1>

          {params.error && <Banner variant="error">{params.error}</Banner>}

          <Field label="Nome">
            <input type="text" name="nome" required className={inputClass} />
          </Field>

          <Field label="Objetivo do projeto">
            <textarea name="descricao" rows={6} className={inputClass} />
          </Field>

          <Field label="Cliente">
            <input type="text" name="cliente" className={inputClass} />
          </Field>

          <Field label="Termo específico deste projeto (opcional)">
            <textarea name="termo_especifico" rows={4} className={inputClass} />
          </Field>

          <div className="mt-2 flex items-center gap-4">
            <SubmitButton>Salvar</SubmitButton>
            <Link
              href="/projetos"
              className="text-sm text-zinc-500 underline dark:text-zinc-400"
            >
              Cancelar
            </Link>
          </div>

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Toda jornada começa pela Descoberta.
          </p>
        </form>
      </Card>
    </main>
  );
}
