import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProprietarioDoProjeto } from "@/lib/projetos/dal";
import {
  buscarProfessoresDoProjeto,
  buscarUsuariosPorNome,
} from "@/lib/projetos/vinculos";
import { Banner, Card, Field, inputClass } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";
import { adicionarColaborador, removerProfessor } from "./actions";

export default async function ProfessoresDoProjetoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; busca?: string }>;
}) {
  const { id: projetoId } = await params;
  // Modelo Conceitual §3.1: só o proprietário gerencia professores.
  await requireProprietarioDoProjeto(projetoId);
  const { error, busca } = await searchParams;
  const supabase = await createClient();

  const { data: projeto } = await supabase
    .from("projetos")
    .select("id, nome")
    .eq("id", projetoId)
    .single();

  if (!projeto) {
    notFound();
  }

  const professores = await buscarProfessoresDoProjeto(supabase, projetoId);
  const termoBusca = busca?.trim();
  const resultados = termoBusca
    ? await buscarUsuariosPorNome(
        supabase,
        "professor",
        termoBusca,
        professores.map((p) => p.professorId),
      )
    : [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 sm:p-8">
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <Link href={`/projetos/${projetoId}`} className="underline">
            {projeto.nome}
          </Link>
        </p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Professores do projeto
        </h1>
      </div>

      {error && <Banner variant="error">{error}</Banner>}

      <Card>
        <ul className="flex flex-col gap-3">
          {professores.map((p) => (
            <li
              key={p.professorId}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-zinc-900 dark:text-zinc-50">
                {p.nome}{" "}
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {p.papelNoProjeto === "proprietario"
                    ? "Proprietário"
                    : "Colaborador"}
                </span>
              </span>
              {p.papelNoProjeto !== "proprietario" && (
                <form action={removerProfessor}>
                  <input type="hidden" name="projeto_id" value={projetoId} />
                  <input
                    type="hidden"
                    name="professor_id"
                    value={p.professorId}
                  />
                  <SubmitButton
                    variant="danger"
                    pendingText="Removendo..."
                    className="!px-3 !py-1 text-xs"
                  >
                    Remover
                  </SubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <form method="get" className="flex flex-col gap-3">
          <Field label="Buscar professor por nome ou e-mail">
            <input
              type="text"
              name="busca"
              defaultValue={busca ?? ""}
              className={inputClass}
            />
          </Field>
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Buscar
          </button>
        </form>

        {termoBusca && (
          <ul className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {resultados.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Nenhum professor encontrado.
              </p>
            ) : (
              resultados.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-zinc-900 dark:text-zinc-50">
                    {r.nome}{" "}
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {r.email}
                    </span>
                  </span>
                  <form action={adicionarColaborador}>
                    <input type="hidden" name="projeto_id" value={projetoId} />
                    <input type="hidden" name="professor_id" value={r.id} />
                    <SubmitButton
                      pendingText="Adicionando..."
                      className="!px-3 !py-1 text-xs"
                    >
                      Adicionar
                    </SubmitButton>
                  </form>
                </li>
              ))
            )}
          </ul>
        )}
      </Card>
    </main>
  );
}
