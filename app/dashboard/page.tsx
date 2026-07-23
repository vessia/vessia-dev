import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";
import {
  buscarMissoesAtrasadas,
  buscarPendenciasAvaliacao,
  contarProjetosAtivos,
} from "@/lib/dashboard/professor";
import { buscarResumoAluno } from "@/lib/dashboard/aluno";
import { requireOnboardingCompleto } from "@/lib/onboarding/dal";
import { buscarConvitesPendentes } from "@/lib/projetos/vinculos";
import { Banner, Card } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";
import { responderConvite } from "./actions";

// DECISIONS.md, "Retoque visual no Início": card de resumo reutilizado nas
// duas visões (professor e aluno) — número grande, rótulo pequeno abaixo,
// sem interação (é só resumo visual).
function CardResumo({ numero, rotulo }: { numero: number; rotulo: string }) {
  return (
    <Card className="!p-4 text-center">
      <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
        {numero}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{rotulo}</p>
    </Card>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Defesa em profundidade: o proxy já redireciona quem não está logado,
  // mas a página não deve depender só dele (ver guia de auth do Next.js).
  // verifySession() faz esse check e redireciona para /login se preciso.
  const user = await verifySession();
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, papel")
    .eq("id", user.id)
    .single();

  if (profile?.papel !== "professor") {
    // Tarefa 29: aluno vê a trilha de boas-vindas antes de qualquer
    // projeto — redireciona pra /onboarding enquanto não completar os 3
    // itens. Professor nunca passa por esse gate.
    await requireOnboardingCompleto();

    const [convites, resumo] = await Promise.all([
      buscarConvitesPendentes(supabase, user.id),
      buscarResumoAluno(supabase, user.id),
    ]);

    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-4 sm:p-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Olá, {profile?.nome ?? user.email}
        </h1>

        {error && <Banner variant="error">{error}</Banner>}

        {!resumo.temAlgumVinculo ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Você ainda não foi adicionado a nenhum projeto. Assim que um
            professor te convidar, aparece por aqui.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <CardResumo
              numero={resumo.projetosAtivos}
              rotulo="Projetos ativos"
            />
            <CardResumo
              numero={resumo.missoesDisponiveis}
              rotulo="Missões disponíveis"
            />
          </div>
        )}

        {convites.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Convites pendentes ({convites.length})
            </h2>
            <ul className="flex flex-col gap-3">
              {convites.map((c) => (
                <li
                  key={c.projetoId}
                  className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {c.projetoNome}
                  </p>
                  {c.projetoDescricao && (
                    <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                      {c.projetoDescricao}
                    </p>
                  )}
                  <div className="mt-3 flex gap-3">
                    <form action={responderConvite}>
                      <input type="hidden" name="projeto_id" value={c.projetoId} />
                      <input type="hidden" name="resposta" value="aceito" />
                      <SubmitButton pendingText="Aceitando...">
                        Aceitar
                      </SubmitButton>
                    </form>
                    <form action={responderConvite}>
                      <input type="hidden" name="projeto_id" value={c.projetoId} />
                      <input type="hidden" name="resposta" value="recusado" />
                      <SubmitButton variant="danger" pendingText="Recusando...">
                        Recusar
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    );
  }

  const [pendencias, atrasadas, projetosAtivos] = await Promise.all([
    buscarPendenciasAvaliacao(supabase),
    buscarMissoesAtrasadas(supabase),
    contarProjetosAtivos(supabase),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-4 sm:p-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Olá, {profile.nome}
      </h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CardResumo numero={projetosAtivos} rotulo="Projetos ativos" />
        <CardResumo
          numero={pendencias.length}
          rotulo="Pendências de avaliação"
        />
        <CardResumo numero={atrasadas.length} rotulo="Atrasadas" />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Pendências de avaliação ({pendencias.length})
        </h2>
        {pendencias.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nenhuma entrega esperando avaliação.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pendencias.map((p) => (
              <li
                key={p.entregaId}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <span className="text-lg leading-none">📝</span>
                <p>
                  <Link
                    href={`/avaliacoes/${p.entregaId}`}
                    className="text-blue-600 underline dark:text-blue-400"
                  >
                    {p.alunoNome} — {p.missaoTitulo}
                  </Link>
                  <span className="text-zinc-400 dark:text-zinc-500">
                    {" "}
                    ({p.projetoNome}, {p.numeroTentativa}ª tentativa)
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Atrasadas ({atrasadas.length})
        </h2>
        {atrasadas.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nenhuma missão atrasada.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {atrasadas.map((m) => (
              <li
                key={m.missaoId}
                className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <span className="text-lg leading-none">⏰</span>
                <p>
                  <Link
                    href={`/projetos/${m.projetoSlug}/etapas/${m.etapaSlug}/missoes/${m.missaoSlug}`}
                    className="text-blue-600 underline dark:text-blue-400"
                  >
                    {m.titulo}
                  </Link>
                  <span className="text-zinc-400 dark:text-zinc-500">
                    {" "}
                    ({m.projetoNome}, prazo{" "}
                    {new Date(m.prazo).toLocaleDateString("pt-BR")})
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
