import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessor } from "@/lib/auth/dal";
import { criarEtapa } from "../actions";
import { Card, Field, Banner, inputClass } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";

export default async function NovaEtapaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireProfessor();
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: projeto } = await supabase
    .from("projetos")
    .select("id, nome")
    .eq("id", id)
    .single();

  if (!projeto) {
    notFound();
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <Card className="max-w-md">
        <form action={criarEtapa} className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Nova etapa — {projeto.nome}
          </h1>

          {error && <Banner variant="error">{error}</Banner>}

          <input type="hidden" name="projeto_id" value={projeto.id} />

          <Field label="Nome">
            <input type="text" name="nome" required className={inputClass} />
          </Field>

          <Field label="Ordem">
            <input
              type="number"
              name="ordem"
              required
              min={1}
              step={1}
              className={inputClass}
            />
          </Field>

          <div className="mt-2 flex items-center gap-4">
            <SubmitButton>Salvar</SubmitButton>
            <Link
              href={`/projetos/${projeto.id}`}
              className="text-sm text-zinc-500 underline dark:text-zinc-400"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}
