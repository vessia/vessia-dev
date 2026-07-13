import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOnboardingCompleto } from "@/lib/onboarding/dal";
import { MissaoStatusBadge } from "@/app/_components/ui";
import { tipoMissaoInfo } from "@/lib/missoes/constantes";
import { buscarMissoesComStatus } from "@/lib/missoes/buscar";
import { Tooltip } from "@/app/_components/tooltip";
import { CONCEITOS } from "@/lib/conceitos/textos";

export default async function EtapaDetalhePage({
  params,
}: {
  params: Promise<{ id: string; etapaId: string }>;
}) {
  const user = await requireOnboardingCompleto();
  const { id: projetoId, etapaId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  const ehProfessor = profile?.papel === "professor";

  const { data: etapa } = await supabase
    .from("etapas")
    .select("id, nome, ordem, projeto_id")
    .eq("id", etapaId)
    .eq("projeto_id", projetoId)
    .single();

  if (!etapa) {
    notFound();
  }

  const { data: projeto } = await supabase
    .from("projetos")
    .select("id, nome")
    .eq("id", projetoId)
    .single();

  if (!projeto) {
    notFound();
  }

  const missoesComStatus = await buscarMissoesComStatus(supabase, etapaId);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-4 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <Link href={`/projetos/${projeto.id}`} className="underline">
              {projeto.nome}
            </Link>
          </p>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {etapa.nome}
          </h1>
        </div>

        <div className="flex gap-3">
          {ehProfessor && (
            <Link
              href={`/projetos/${projeto.id}/etapas/${etapa.id}/editar`}
              className="text-sm text-blue-600 underline dark:text-blue-400"
            >
              Editar etapa
            </Link>
          )}
          <Link
            href={`/projetos/${projeto.id}`}
            className="text-sm text-zinc-500 underline dark:text-zinc-400"
          >
            Voltar
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            <Tooltip texto={CONCEITOS.missao}>Missões</Tooltip>
          </h2>
          {ehProfessor && missoesComStatus.length > 0 && (
            <Link
              href={`/projetos/${projeto.id}/etapas/${etapa.id}/missoes/nova`}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Nova missão
            </Link>
          )}
        </div>

        {missoesComStatus.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">
              Nenhuma missão ainda.
            </p>
            {ehProfessor && (
              <Link
                href={`/projetos/${projeto.id}/etapas/${etapa.id}/missoes/nova`}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Criar a primeira missão
              </Link>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {missoesComStatus.map((missao) => {
              const tipo = tipoMissaoInfo(missao.tipo);
              return (
                <li
                  key={missao.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg" title={tipo.label}>
                      {tipo.icone}
                    </span>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {missao.titulo}{" "}
                        {!missao.obrigatoria && (
                          <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
                            (opcional)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {tipo.label} ·{" "}
                        {missao.vagas === null
                          ? "Vagas ilimitadas"
                          : `${missao.vagas} vaga${missao.vagas === 1 ? "" : "s"}`}{" "}
                        ·{" "}
                        {missao.prazo
                          ? new Date(missao.prazo).toLocaleDateString("pt-BR")
                          : "Sem prazo"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <MissaoStatusBadge status={missao.status} />
                    {ehProfessor && (
                      <Link
                        href={`/projetos/${projeto.id}/etapas/${etapa.id}/missoes/${missao.id}/editar`}
                        className="text-blue-600 underline dark:text-blue-400"
                      >
                        Editar
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
