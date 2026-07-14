import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOnboardingCompleto } from "@/lib/onboarding/dal";
import { encerrarProjeto } from "./actions";
import { Banner, StatusBadge } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";
import { criacaoProjetoHabilitada } from "@/lib/projetos/feature-flags";

const STATUS_VINCULO_LABEL: Record<string, string> = {
  convidado: "Convite pendente",
  aceito: "Aceito",
  recusado: "Recusado",
  saiu: "Você saiu",
  removido: "Removido",
};

const STATUS_VINCULO_CLASS: Record<string, string> = {
  convidado:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  aceito:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  recusado: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  saiu: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  removido: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  // Tarefa 29: bloqueia acesso ao mapa de projetos pra aluno com onboarding
  // incompleto; no-op pra professor.
  const user = await requireOnboardingCompleto();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  const ehProfessor = profile?.papel === "professor";
  const podeCriarProjeto = ehProfessor && criacaoProjetoHabilitada();

  // A RLS de "projetos: leitura por quem está vinculado" já escopa essa
  // consulta: professor só recebe projetos onde está em
  // projeto_professores; aluno só recebe onde tem linha em projeto_alunos
  // (qualquer status — inclusive convidado/recusado, pra ele poder ver o
  // histórico, ver 05 - Fluxos.md §2.1).
  const { data: projetos } = await supabase
    .from("projetos")
    .select("id, slug, nome, cliente, status")
    .order("criado_em", { ascending: false });

  const lista = projetos ?? [];

  const statusVinculoPorProjeto = new Map<string, string>();
  if (!ehProfessor && lista.length > 0) {
    const { data: vinculos } = await supabase
      .from("projeto_alunos")
      .select("projeto_id, status")
      .eq("aluno_id", user.id)
      .in("projeto_id", lista.map((p) => p.id));

    for (const v of vinculos ?? []) {
      statusVinculoPorProjeto.set(v.projeto_id, v.status);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Projetos
        </h1>
        {ehProfessor &&
          lista.length > 0 &&
          (podeCriarProjeto ? (
            <Link
              href="/projetos/novo"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Novo projeto
            </Link>
          ) : (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Criação de projetos temporariamente desativada
            </p>
          ))}
      </div>

      {params.error && <Banner variant="error">{params.error}</Banner>}

      {lista.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            {ehProfessor
              ? "Nenhum projeto ainda."
              : "Nenhum projeto atribuído a você ainda."}
          </p>
          {ehProfessor &&
            (podeCriarProjeto ? (
              <Link
                href="/projetos/novo"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Criar o primeiro projeto
              </Link>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Criação de projetos temporariamente desativada
              </p>
            ))}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {lista.map((projeto) => {
            const statusVinculo = statusVinculoPorProjeto.get(projeto.id);
            return (
              <li
                key={projeto.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/projetos/${projeto.slug}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                  >
                    {projeto.nome}
                  </Link>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={projeto.status} />
                    {!ehProfessor && statusVinculo && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_VINCULO_CLASS[statusVinculo]}`}
                      >
                        {STATUS_VINCULO_LABEL[statusVinculo]}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {projeto.cliente ?? "Sem cliente definido"}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Progresso: —
                </p>

                {ehProfessor && (
                  <div className="mt-1 flex items-center gap-4 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
                    <Link
                      href={`/projetos/${projeto.slug}/editar`}
                      className="text-blue-600 underline dark:text-blue-400"
                    >
                      Editar
                    </Link>
                    {projeto.status === "ativo" && (
                      <form action={encerrarProjeto}>
                        <input type="hidden" name="id" value={projeto.id} />
                        <SubmitButton
                          variant="danger"
                          pendingText="Encerrando..."
                          className="!px-3 !py-1 text-xs"
                        >
                          Encerrar
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
