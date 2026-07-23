import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOnboardingCompleto } from "@/lib/onboarding/dal";
import { MissaoStatusBadge } from "@/app/_components/ui";
import { tipoMissaoInfo } from "@/lib/missoes/constantes";
import { buscarMissoesComStatus } from "@/lib/missoes/buscar";
import { Tooltip } from "@/app/_components/tooltip";
import { CONCEITOS } from "@/lib/conceitos/textos";
import { requireTermoAceito } from "@/lib/projetos/dal";

export default async function EtapaDetalhePage({
  params,
}: {
  params: Promise<{ slug: string; etapaSlug: string }>;
}) {
  const user = await requireOnboardingCompleto();
  const { slug: projetoSlug, etapaSlug } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  const ehProfessor = profile?.papel === "professor";

  const { data: projeto } = await supabase
    .from("projetos")
    .select("id, slug, nome")
    .eq("slug", projetoSlug)
    .single();

  if (!projeto) {
    notFound();
  }

  const { data: etapa } = await supabase
    .from("etapas")
    .select("id, slug, nome, ordem, projeto_id")
    .eq("projeto_id", projeto.id)
    .eq("slug", etapaSlug)
    .single();

  if (!etapa) {
    notFound();
  }

  // DECISIONS.md, "Aceite do termo específico vira gate de projeto":
  // checado assim que o aluno acessa qualquer Etapa diretamente (deep
  // link), não só pelo mapa do projeto. RLS de `etapas` já garante que só
  // aluno com vínculo 'aceito' chega até aqui (senão a query acima teria
  // retornado nula), então não precisa checar o status de novo.
  if (!ehProfessor) {
    await requireTermoAceito(user.id, projeto.id, projeto.slug);
  }

  const missoesComStatus = await buscarMissoesComStatus(supabase, etapa.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-4 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <Link href={`/projetos/${projeto.slug}`} className="underline">
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
              href={`/projetos/${projeto.slug}/etapas/${etapa.slug}/editar`}
              className="text-sm text-blue-600 underline dark:text-blue-400"
            >
              Editar etapa
            </Link>
          )}
          <Link
            href={`/projetos/${projeto.slug}`}
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
              href={`/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/nova`}
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
                href={`/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/nova`}
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
                  className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                >
                  {/* Stretched link (DECISIONS.md, "Cards inteiros
                      clicáveis"): cobre o card inteiro; "Editar" abaixo
                      fica "relative z-10" pra continuar navegando pro
                      próprio destino, não pro da missão. */}
                  <Link
                    href={`/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}`}
                    className="flex flex-1 items-center gap-3 rounded-lg transition after:absolute after:inset-0 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
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
                  </Link>

                  <div className="relative z-10 flex items-center gap-4 text-sm">
                    <MissaoStatusBadge status={missao.status} />
                    {ehProfessor && (
                      <Link
                        href={`/projetos/${projeto.slug}/etapas/${etapa.slug}/missoes/${missao.slug}/editar`}
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
