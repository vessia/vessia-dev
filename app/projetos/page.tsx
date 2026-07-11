import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";
import { encerrarProjeto } from "./actions";
import { Banner, StatusBadge } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const user = await verifySession();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  const ehProfessor = profile?.papel === "professor";

  const { data: projetos } = await supabase
    .from("projetos")
    .select("id, nome, cliente, status")
    .order("criado_em", { ascending: false });

  const lista = projetos ?? [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Projetos
        </h1>
        {ehProfessor && lista.length > 0 && (
          <Link
            href="/projetos/novo"
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Novo projeto
          </Link>
        )}
      </div>

      {params.error && <Banner variant="error">{params.error}</Banner>}

      {lista.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            Nenhum projeto ainda.
          </p>
          {ehProfessor && (
            <Link
              href="/projetos/novo"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Criar o primeiro projeto
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {lista.map((projeto) => (
            <li
              key={projeto.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/projetos/${projeto.id}`}
                  className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                >
                  {projeto.nome}
                </Link>
                <StatusBadge status={projeto.status} />
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
                    href={`/projetos/${projeto.id}/editar`}
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
          ))}
        </ul>
      )}
    </main>
  );
}
