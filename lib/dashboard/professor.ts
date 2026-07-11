import type { SupabaseClient } from "@supabase/supabase-js";

export type PendenciaAvaliacao = {
  entregaId: string;
  alunoNome: string;
  missaoTitulo: string;
  projetoNome: string;
  numeroTentativa: number;
};

export type MissaoAtrasada = {
  missaoId: string;
  etapaId: string;
  projetoId: string;
  titulo: string;
  prazo: string;
  projetoNome: string;
};

async function buscarMissoesDoProfessor(
  supabase: SupabaseClient,
  professorId: string,
) {
  const { data: projetos } = await supabase
    .from("projetos")
    .select("id, nome")
    .eq("criado_por", professorId)
    .eq("status", "ativo");

  const listaProjetos = projetos ?? [];
  const projetoIds = listaProjetos.map((p) => p.id);
  const nomePorProjeto = new Map(listaProjetos.map((p) => [p.id, p.nome]));

  const { data: etapas } = projetoIds.length
    ? await supabase.from("etapas").select("id, projeto_id").in("projeto_id", projetoIds)
    : { data: [] };

  const listaEtapas = etapas ?? [];
  const etapaIds = listaEtapas.map((e) => e.id);
  const projetoPorEtapa = new Map(listaEtapas.map((e) => [e.id, e.projeto_id]));

  const { data: missoes } = etapaIds.length
    ? await supabase
        .from("missoes")
        .select("id, titulo, prazo, concluida_em, etapa_id")
        .in("etapa_id", etapaIds)
    : { data: [] };

  return { missoes: missoes ?? [], projetoPorEtapa, nomePorProjeto };
}

// Dashboard do professor (Bloco 9, tarefa 26): entregas pendentes de
// avaliação (Participação em_aprovacao) entre todos os projetos ativos.
export async function buscarPendenciasAvaliacao(
  supabase: SupabaseClient,
  professorId: string,
): Promise<PendenciaAvaliacao[]> {
  const { missoes, projetoPorEtapa, nomePorProjeto } =
    await buscarMissoesDoProfessor(supabase, professorId);

  const missaoIds = missoes.map((m) => m.id);
  if (missaoIds.length === 0) return [];

  const tituloPorMissao = new Map(missoes.map((m) => [m.id, m.titulo]));
  const projetoNomePorMissao = new Map(
    missoes.map((m) => [
      m.id,
      nomePorProjeto.get(projetoPorEtapa.get(m.etapa_id) ?? "") ?? "",
    ]),
  );

  const { data: participacoes } = await supabase
    .from("participacoes")
    .select("id, missao_id, aluno_id")
    .in("missao_id", missaoIds)
    .eq("status", "em_aprovacao");

  const lista = participacoes ?? [];
  if (lista.length === 0) return [];

  const participacaoIds = lista.map((p) => p.id);
  const alunoIds = Array.from(new Set(lista.map((p) => p.aluno_id)));

  const { data: alunos } = await supabase
    .from("profiles")
    .select("id, nome")
    .in("id", alunoIds);

  const nomePorAluno = new Map((alunos ?? []).map((a) => [a.id, a.nome]));

  const { data: entregas } = await supabase
    .from("entregas")
    .select("id, participacao_id, numero_tentativa")
    .in("participacao_id", participacaoIds);

  // A regra do domínio garante uma única Entrega sem Avaliação por
  // Participação em_aprovacao — a de maior numero_tentativa é essa.
  const entregaPendentePorParticipacao = new Map<
    string,
    { id: string; numero_tentativa: number }
  >();
  for (const e of entregas ?? []) {
    const atual = entregaPendentePorParticipacao.get(e.participacao_id);
    if (!atual || e.numero_tentativa > atual.numero_tentativa) {
      entregaPendentePorParticipacao.set(e.participacao_id, e);
    }
  }

  return lista
    .map((p) => {
      const entrega = entregaPendentePorParticipacao.get(p.id);
      if (!entrega) return null;

      return {
        entregaId: entrega.id,
        alunoNome: nomePorAluno.get(p.aluno_id) ?? "Aluno",
        missaoTitulo: tituloPorMissao.get(p.missao_id) ?? "",
        projetoNome: projetoNomePorMissao.get(p.missao_id) ?? "",
        numeroTentativa: entrega.numero_tentativa,
      };
    })
    .filter((p): p is PendenciaAvaliacao => p !== null);
}

// Missões atrasadas: prazo vencido, ainda não concluídas manualmente, e sem
// nenhuma entrega aprovada (04 - Modelo Conceitual.md §5). É um alerta de
// interface, não um status armazenado.
export async function buscarMissoesAtrasadas(
  supabase: SupabaseClient,
  professorId: string,
): Promise<MissaoAtrasada[]> {
  const { missoes, projetoPorEtapa, nomePorProjeto } =
    await buscarMissoesDoProfessor(supabase, professorId);

  const agora = new Date().toISOString();
  const candidatas = missoes.filter(
    (m) => m.prazo && m.prazo < agora && !m.concluida_em,
  );
  if (candidatas.length === 0) return [];

  const candidataIds = candidatas.map((m) => m.id);

  const { data: participacoes } = await supabase
    .from("participacoes")
    .select("id, missao_id")
    .in("missao_id", candidataIds);

  const missaoPorParticipacao = new Map(
    (participacoes ?? []).map((p) => [p.id, p.missao_id] as const),
  );
  const participacaoIds = (participacoes ?? []).map((p) => p.id);

  const { data: entregas } = participacaoIds.length
    ? await supabase
        .from("entregas")
        .select("id, participacao_id")
        .in("participacao_id", participacaoIds)
    : { data: [] };

  const participacaoPorEntrega = new Map(
    (entregas ?? []).map((e) => [e.id, e.participacao_id] as const),
  );
  const entregaIds = (entregas ?? []).map((e) => e.id);

  const { data: avaliacoesAprovadas } = entregaIds.length
    ? await supabase
        .from("avaliacoes")
        .select("entrega_id, resultado")
        .in("entrega_id", entregaIds)
        .in("resultado", ["aprovada", "aprovada_com_ressalvas"])
    : { data: [] };

  const missoesComEntregaAprovada = new Set(
    (avaliacoesAprovadas ?? [])
      .map((a) => participacaoPorEntrega.get(a.entrega_id))
      .map((participacaoId) => missaoPorParticipacao.get(participacaoId ?? ""))
      .filter((id): id is string => Boolean(id)),
  );

  return candidatas
    .filter((m) => !missoesComEntregaAprovada.has(m.id))
    .map((m) => ({
      missaoId: m.id,
      etapaId: m.etapa_id,
      projetoId: projetoPorEtapa.get(m.etapa_id) ?? "",
      titulo: m.titulo,
      prazo: m.prazo as string,
      projetoNome: nomePorProjeto.get(projetoPorEtapa.get(m.etapa_id) ?? "") ?? "",
    }));
}
