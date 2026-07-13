import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessorDoProjeto } from "@/lib/projetos/dal";
import {
  buscarAlunosDoProjeto,
  buscarUsuariosPorNome,
  type StatusAtribuicaoAluno,
} from "@/lib/projetos/vinculos";
import { Banner, Card, Field, inputClass } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";
import { atribuirAluno, removerAluno } from "./actions";

const STATUS_LABEL: Record<StatusAtribuicaoAluno, string> = {
  convidado: "Convidado (aguardando resposta)",
  aceito: "Aceito",
  recusado: "Recusado",
  saiu: "Saiu",
  removido: "Removido",
};

const STATUS_CLASS: Record<StatusAtribuicaoAluno, string> = {
  convidado:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  aceito:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  recusado: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  saiu: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  removido: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default async function AlunosDoProjetoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; busca?: string }>;
}) {
  const { id: projetoId } = await params;
  // 05 - Fluxos.md §2.1: qualquer professor vinculado (proprietário ou
  // colaborador) pode atribuir/gerenciar alunos.
  await requireProfessorDoProjeto(projetoId);
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

  const alunos = await buscarAlunosDoProjeto(supabase, projetoId);
  const termoBusca = busca?.trim();
  const resultados = termoBusca
    ? await buscarUsuariosPorNome(
        supabase,
        "aluno",
        termoBusca,
        alunos.map((a) => a.alunoId),
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
          Alunos do projeto
        </h1>
      </div>

      {error && <Banner variant="error">{error}</Banner>}

      <Card>
        {alunos.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nenhum aluno atribuído ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {alunos.map((a) => (
              <li
                key={a.alunoId}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-zinc-900 dark:text-zinc-50">
                  {a.nome}{" "}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[a.status]}`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                </span>
                {a.status === "aceito" && (
                  <form action={removerAluno}>
                    <input type="hidden" name="projeto_id" value={projetoId} />
                    <input type="hidden" name="aluno_id" value={a.alunoId} />
                    <SubmitButton
                      variant="danger"
                      pendingText="Removendo..."
                      className="!px-3 !py-1 text-xs"
                    >
                      Remover
                    </SubmitButton>
                  </form>
                )}
                {(a.status === "saiu" ||
                  a.status === "removido" ||
                  a.status === "recusado") && (
                  <form action={atribuirAluno}>
                    <input type="hidden" name="projeto_id" value={projetoId} />
                    <input type="hidden" name="aluno_id" value={a.alunoId} />
                    <SubmitButton
                      pendingText="Reconvidando..."
                      className="!px-3 !py-1 text-xs"
                    >
                      Reconvidar
                    </SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <form method="get" className="flex flex-col gap-3">
          <Field label="Buscar aluno por nome ou e-mail">
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
                Nenhum aluno encontrado.
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
                  <form action={atribuirAluno}>
                    <input type="hidden" name="projeto_id" value={projetoId} />
                    <input type="hidden" name="aluno_id" value={r.id} />
                    <SubmitButton
                      pendingText="Atribuindo..."
                      className="!px-3 !py-1 text-xs"
                    >
                      Atribuir
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
