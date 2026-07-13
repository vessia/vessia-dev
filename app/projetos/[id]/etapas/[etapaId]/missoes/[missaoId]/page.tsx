import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOnboardingCompleto } from "@/lib/onboarding/dal";
import { Banner, MissaoStatusBadge } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";
import { Tooltip } from "@/app/_components/tooltip";
import { CONCEITOS } from "@/lib/conceitos/textos";
import { tipoMissaoInfo } from "@/lib/missoes/constantes";
import { buscarDependenciasComStatus } from "@/lib/missoes/buscar";
import { calcularStatusMissao } from "@/lib/missoes/status";
import { buscarParticipacoesComResultado } from "@/lib/participacoes/buscar";
import { resumirParticipacoes } from "@/lib/participacoes/resumo";
import { precisaAceitarTermoEspecifico } from "@/lib/participacoes/validacoes";
import {
  participar,
  enviarEntrega,
  marcarConcluida,
  aceitarTermoProjeto,
} from "./actions";
import { EntregaForm } from "./entrega-form";

export default async function MissaoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; etapaId: string; missaoId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireOnboardingCompleto();
  const { id: projetoId, etapaId, missaoId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  const ehAluno = profile?.papel === "aluno";
  const ehProfessor = profile?.papel === "professor";

  const { data: missao } = await supabase
    .from("missoes")
    .select(
      "id, titulo, descricao, tipo, objetivo, entrega_esperada, criterio_avaliacao, prazo, vagas, obrigatoria, limite_reenvios, concluida_em, concluida_por, etapa_id",
    )
    .eq("id", missaoId)
    .eq("etapa_id", etapaId)
    .single();

  if (!missao) {
    notFound();
  }

  const dependencias = await buscarDependenciasComStatus(supabase, missao.id);
  const todasDependenciasConcluidas = dependencias.every((d) => d.concluida);

  const { count: vagasPreenchidas } = await supabase
    .from("participacoes")
    .select("*", { count: "exact", head: true })
    .eq("missao_id", missao.id);

  const status = calcularStatusMissao({
    concluidaEm: missao.concluida_em,
    todasDependenciasConcluidas,
    temParticipacao: (vagasPreenchidas ?? 0) > 0,
  });

  const { data: anexos } = await supabase
    .from("arquivos")
    .select("id, nome, url")
    .eq("dono_tipo", "missao")
    .eq("dono_id", missao.id);

  // Participação do próprio aluno logado (se houver) e, se estiver
  // aguardando entrega, quantas tentativas já foram usadas.
  let participacao: { id: string; status: string } | null = null;
  let entregasExistentes = 0;

  if (ehAluno) {
    const { data } = await supabase
      .from("participacoes")
      .select("id, status")
      .eq("missao_id", missao.id)
      .eq("aluno_id", user.id)
      .maybeSingle();

    participacao = data;

    if (participacao?.status === "em_andamento") {
      const { count } = await supabase
        .from("entregas")
        .select("*", { count: "exact", head: true })
        .eq("participacao_id", participacao.id);

      entregasExistentes = count ?? 0;
    }
  }

  const podeParticiparAgora =
    ehAluno &&
    !participacao &&
    (status === "disponivel" || status === "em_andamento");
  const vagasEsgotadas =
    podeParticiparAgora &&
    missao.vagas !== null &&
    (vagasPreenchidas ?? 0) >= missao.vagas;

  // DECISIONS.md, "Termo específico por Projeto": só entra em jogo quando o
  // projeto define um termo — aceite é por projeto, então vale pra qualquer
  // missão dele, não só esta.
  let termoPendente = false;
  let termoEspecifico: string | null = null;

  if (podeParticiparAgora) {
    const { data: projeto } = await supabase
      .from("projetos")
      .select("termo_especifico")
      .eq("id", projetoId)
      .single();

    const { data: vinculoAluno } = await supabase
      .from("projeto_alunos")
      .select("termo_aceito_em")
      .eq("projeto_id", projetoId)
      .eq("aluno_id", user.id)
      .maybeSingle();

    termoEspecifico = projeto?.termo_especifico ?? null;
    termoPendente = precisaAceitarTermoEspecifico({
      termoEspecifico,
      termoAceitoEm: vinculoAluno?.termo_aceito_em ?? null,
    });
  }

  // Contexto pra decisão manual de "marcar como concluída" (professor).
  let resumoParticipacoes = null;
  let concluidaPorNome: string | null = null;

  if (ehProfessor) {
    const participacoesComResultado = await buscarParticipacoesComResultado(
      supabase,
      missao.id,
    );
    resumoParticipacoes = resumirParticipacoes(participacoesComResultado);

    if (missao.concluida_por) {
      const { data: quemConcluiu } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", missao.concluida_por)
        .single();
      concluidaPorNome = quemConcluiu?.nome ?? null;
    }
  }

  const tipo = tipoMissaoInfo(missao.tipo);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            <Link
              href={`/projetos/${projetoId}/etapas/${etapaId}`}
              className="underline"
            >
              Voltar para a etapa
            </Link>
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            <span title={tipo.label}>{tipo.icone}</span>
            {missao.titulo}
          </h1>
        </div>
        <MissaoStatusBadge status={status} />
      </div>

      {error && <Banner variant="error">{error}</Banner>}

      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {missao.descricao && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {missao.descricao}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Objetivo
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {missao.objetivo}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Entrega esperada
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {missao.entrega_esperada}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Critério de avaliação
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {missao.criterio_avaliacao}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Prazo
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {missao.prazo
                ? new Date(missao.prazo).toLocaleDateString("pt-BR")
                : "Sem prazo"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              <Tooltip texto={CONCEITOS.vagas}>Vagas</Tooltip>
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {missao.vagas === null
                ? `${vagasPreenchidas ?? 0} participando (sem limite)`
                : `${vagasPreenchidas ?? 0} de ${missao.vagas} preenchidas`}
            </p>
          </div>
          {!missao.obrigatoria && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Obrigatória
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">Não</p>
            </div>
          )}
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            <Tooltip texto={CONCEITOS.dependencia}>Dependências</Tooltip>
          </p>
          {dependencias.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Nenhuma.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {dependencias.map((dep) => (
                <li
                  key={dep.id}
                  className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  <span>{dep.concluida ? "✅" : "🔒"}</span>
                  {dep.titulo}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Anexos de apoio
          </p>
          {(anexos ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Nenhum.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {anexos!.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline dark:text-blue-400"
                  >
                    {a.nome}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Estado da Participação do aluno logado — só um bloco de ação
            por vez, de acordo com onde ele está no fluxo. */}
        {podeParticiparAgora &&
          (termoPendente ? (
            <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Termo específico deste projeto
              </p>
              <p className="text-sm whitespace-pre-wrap text-amber-800 dark:text-amber-200">
                {termoEspecifico}
              </p>
              <form action={aceitarTermoProjeto} className="w-fit">
                <input type="hidden" name="projeto_id" value={projetoId} />
                <input type="hidden" name="etapa_id" value={etapaId} />
                <input type="hidden" name="missao_id" value={missao.id} />
                <SubmitButton pendingText="Registrando...">
                  Li e concordo
                </SubmitButton>
              </form>
            </div>
          ) : vagasEsgotadas ? (
            <p className="mt-2 w-fit rounded-full bg-zinc-100 px-4 py-2 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              🚫 Vagas esgotadas.
            </p>
          ) : (
            <form action={participar}>
              <input type="hidden" name="projeto_id" value={projetoId} />
              <input type="hidden" name="etapa_id" value={etapaId} />
              <input type="hidden" name="missao_id" value={missao.id} />
              <SubmitButton pendingText="Entrando...">Participar</SubmitButton>
            </form>
          ))}

        {participacao?.status === "em_andamento" && (
          <EntregaForm
            action={enviarEntrega}
            projetoId={projetoId}
            etapaId={etapaId}
            missaoId={missao.id}
            participacaoId={participacao.id}
            titulo={
              entregasExistentes > 0
                ? `Reenviar — ${entregasExistentes + 1}ª tentativa de ${missao.limite_reenvios}`
                : "Enviar entrega"
            }
          />
        )}

        {participacao?.status === "em_aprovacao" && (
          <p className="mt-2 w-fit rounded-full bg-amber-100 px-4 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Tooltip texto={CONCEITOS.statusEmAprovacao}>🟠</Tooltip> Entrega
            enviada — aguardando avaliação do professor.
          </p>
        )}

        {participacao?.status === "concluida" && (
          <p className="mt-2 w-fit rounded-full bg-blue-100 px-4 py-2 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            ✅ Missão concluída.
          </p>
        )}

        {/* Conclusão manual da missão (professor) — decisão pedagógica,
            não depende de nenhuma Participação específica estar aprovada
            (DECISIONS.md). Os números abaixo são só contexto. */}
        {ehProfessor && resumoParticipacoes && (
          <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Participações: {resumoParticipacoes.aprovadas} aprovada
              {resumoParticipacoes.aprovadas === 1 ? "" : "s"},{" "}
              {resumoParticipacoes.comRessalvas} com ressalvas,{" "}
              {resumoParticipacoes.rejeitadas} rejeitada
              {resumoParticipacoes.rejeitadas === 1 ? "" : "s"},{" "}
              {resumoParticipacoes.pendentes} pendente
              {resumoParticipacoes.pendentes === 1 ? "" : "s"},{" "}
              {resumoParticipacoes.semEntrega} sem entrega ainda
            </p>

            {missao.concluida_em ? (
              <p className="w-fit rounded-full bg-blue-100 px-4 py-2 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                ✅ Concluída em{" "}
                {new Date(missao.concluida_em).toLocaleDateString("pt-BR")}
                {concluidaPorNome ? ` por ${concluidaPorNome}` : ""}.
              </p>
            ) : (
              <form action={marcarConcluida}>
                <input type="hidden" name="projeto_id" value={projetoId} />
                <input type="hidden" name="etapa_id" value={etapaId} />
                <input type="hidden" name="missao_id" value={missao.id} />
                <SubmitButton pendingText="Concluindo...">
                  Marcar missão como concluída
                </SubmitButton>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
