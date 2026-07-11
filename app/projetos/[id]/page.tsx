import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";
import { StatusBadge, MissaoStatusBadge } from "@/app/_components/ui";
import { buscarMissoesComStatus } from "@/lib/missoes/buscar";
import { calcularProgressoEtapa } from "@/lib/etapas/progresso";
import { tipoMissaoInfo } from "@/lib/missoes/constantes";

export default async function ProjetoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await verifySession();
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  const ehProfessor = profile?.papel === "professor";

  const { data: projeto } = await supabase
    .from("projetos")
    .select("id, nome, descricao, cliente, status")
    .eq("id", id)
    .single();

  if (!projeto) {
    notFound();
  }

  const { data: etapas } = await supabase
    .from("etapas")
    .select("id, nome, ordem")
    .eq("projeto_id", id)
    .order("ordem", { ascending: true });

  const lista = etapas ?? [];

  // Progresso por etapa (Modelo Conceitual, seção 4) — e, para o aluno, a
  // lista de missões de cada etapa com status calculado (mapa do projeto,
  // 06 - Telas.md seção 3). Mesma fonte de dados usada na página da etapa
  // (lib/missoes/buscar.ts), sem duplicar a lógica de busca.
  const etapasComDados = await Promise.all(
    lista.map(async (etapa) => {
      const missoes = await buscarMissoesComStatus(supabase, etapa.id);
      const progresso = calcularProgressoEtapa(
        missoes.map((m) => ({
          obrigatoria: m.obrigatoria,
          concluidaEm: m.concluida_em,
        })),
      );
      return { ...etapa, missoes, progresso };
    }),
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-4 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {projeto.nome}
            </h1>
            <StatusBadge status={projeto.status} />
          </div>
          {projeto.cliente && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Cliente: {projeto.cliente}
            </p>
          )}
          {projeto.descricao && (
            <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
              {projeto.descricao}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          {ehProfessor && (
            <Link
              href={`/projetos/${projeto.id}/editar`}
              className="text-sm text-blue-600 underline dark:text-blue-400"
            >
              Editar projeto
            </Link>
          )}
          <Link
            href="/projetos"
            className="text-sm text-zinc-500 underline dark:text-zinc-400"
          >
            Voltar
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Etapas
          </h2>
          {ehProfessor && etapasComDados.length > 0 && (
            <Link
              href={`/projetos/${projeto.id}/etapas/nova`}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Nova etapa
            </Link>
          )}
        </div>

        {etapasComDados.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">
              Nenhuma etapa ainda.
            </p>
            {ehProfessor && (
              <Link
                href={`/projetos/${projeto.id}/etapas/nova`}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Criar a primeira etapa
              </Link>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {etapasComDados.map((etapa) => (
              <li
                key={etapa.id}
                className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {etapa.ordem}
                    </span>
                    <Link
                      href={`/projetos/${projeto.id}/etapas/${etapa.id}`}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                    >
                      {etapa.nome}
                    </Link>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {etapa.progresso === null
                        ? "Sem missões obrigatórias"
                        : `Progresso: ${etapa.progresso}%`}
                    </span>
                    {ehProfessor && (
                      <Link
                        href={`/projetos/${projeto.id}/etapas/${etapa.id}/editar`}
                        className="text-blue-600 underline dark:text-blue-400"
                      >
                        Editar
                      </Link>
                    )}
                  </div>
                </div>

                {etapa.progresso !== null && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${etapa.progresso}%` }}
                    />
                  </div>
                )}

                {/* Mapa do projeto (visão do aluno): missões agrupadas por
                    etapa, com status. O professor gerencia missões na
                    página da própria etapa, então não repetimos a lista
                    aqui pra não duplicar a mesma ação em dois lugares. */}
                {!ehProfessor && (
                  <ul className="flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    {etapa.missoes.length === 0 ? (
                      <p className="text-sm text-zinc-400 dark:text-zinc-500">
                        Nenhuma missão nesta etapa ainda.
                      </p>
                    ) : (
                      etapa.missoes.map((missao) => {
                        const tipo = tipoMissaoInfo(missao.tipo);
                        const clicavel = missao.status !== "bloqueada";
                        const conteudo = (
                          <div className="flex flex-1 items-center gap-3">
                            <span className="text-lg" title={tipo.label}>
                              {tipo.icone}
                            </span>
                            <div className="flex-1">
                              <p
                                className={
                                  clicavel
                                    ? "font-medium text-zinc-900 dark:text-zinc-50"
                                    : "font-medium text-zinc-400 dark:text-zinc-500"
                                }
                              >
                                {missao.titulo}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {tipo.label} ·{" "}
                                {missao.prazo
                                  ? new Date(missao.prazo).toLocaleDateString(
                                      "pt-BR",
                                    )
                                  : "Sem prazo"}
                              </p>
                            </div>
                            <MissaoStatusBadge status={missao.status} />
                          </div>
                        );

                        return (
                          <li
                            key={missao.id}
                            className="flex items-center gap-3 rounded-lg px-2 py-1.5"
                          >
                            {clicavel ? (
                              <Link
                                href={`/projetos/${projeto.id}/etapas/${etapa.id}/missoes/${missao.id}`}
                                className="flex flex-1 items-center gap-3 rounded-lg transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                              >
                                {conteudo}
                              </Link>
                            ) : (
                              conteudo
                            )}
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
