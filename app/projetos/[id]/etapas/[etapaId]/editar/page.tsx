import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessor } from "@/lib/auth/dal";
import { atualizarEtapa } from "../../actions";
import { Card, Field, Banner, inputClass } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";

export default async function EditarEtapaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; etapaId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireProfessor();
  const { id, etapaId } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: etapa } = await supabase
    .from("etapas")
    .select("id, nome, ordem, projeto_id")
    .eq("id", etapaId)
    .eq("projeto_id", id)
    .single();

  if (!etapa) {
    notFound();
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <Card className="max-w-md">
        <form action={atualizarEtapa} className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Editar etapa
          </h1>

          {error && <Banner variant="error">{error}</Banner>}

          <input type="hidden" name="id" value={etapa.id} />
          <input type="hidden" name="projeto_id" value={etapa.projeto_id} />

          <Field label="Nome">
            <input
              type="text"
              name="nome"
              required
              defaultValue={etapa.nome}
              className={inputClass}
            />
          </Field>

          <Field label="Ordem">
            <input
              type="number"
              name="ordem"
              required
              min={1}
              step={1}
              defaultValue={etapa.ordem}
              className={inputClass}
            />
          </Field>

          <div className="mt-2 flex items-center gap-4">
            <SubmitButton>Salvar</SubmitButton>
            <Link
              href={`/projetos/${etapa.projeto_id}`}
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
