import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResultadoAvaliacao, StatusParticipacao } from "./resumo";

export type ParticipacaoComResultado = {
  id: string;
  alunoId: string;
  status: StatusParticipacao;
  ultimoResultado: ResultadoAvaliacao | null;
};

// Participações de uma missão, cada uma com o resultado da sua avaliação
// mais recente (se houver) — usado como contexto para "marcar missão como
// concluída" (professor decide, não é regra automática).
export async function buscarParticipacoesComResultado(
  supabase: SupabaseClient,
  missaoId: string,
): Promise<ParticipacaoComResultado[]> {
  const { data: participacoes } = await supabase
    .from("participacoes")
    .select("id, aluno_id, status")
    .eq("missao_id", missaoId);

  const lista = participacoes ?? [];
  const participacaoIds = lista.map((p) => p.id);

  const { data: entregas } = participacaoIds.length
    ? await supabase
        .from("entregas")
        .select("id, participacao_id, numero_tentativa")
        .in("participacao_id", participacaoIds)
    : { data: [] };

  const entregaIds = (entregas ?? []).map((e) => e.id);

  const { data: avaliacoes } = entregaIds.length
    ? await supabase
        .from("avaliacoes")
        .select("entrega_id, resultado")
        .in("entrega_id", entregaIds)
    : { data: [] };

  const resultadoPorEntrega = new Map(
    (avaliacoes ?? []).map((a) => [a.entrega_id, a.resultado] as const),
  );

  const entregasPorParticipacao = new Map<
    string,
    { id: string; numero_tentativa: number }[]
  >();
  for (const e of entregas ?? []) {
    const atual = entregasPorParticipacao.get(e.participacao_id) ?? [];
    atual.push(e);
    entregasPorParticipacao.set(e.participacao_id, atual);
  }

  return lista.map((p) => {
    const entregasDaParticipacao = (entregasPorParticipacao.get(p.id) ?? [])
      .slice()
      .sort((a, b) => b.numero_tentativa - a.numero_tentativa);

    let ultimoResultado: ResultadoAvaliacao | null = null;
    for (const e of entregasDaParticipacao) {
      const resultado = resultadoPorEntrega.get(e.id);
      if (resultado) {
        ultimoResultado = resultado as ResultadoAvaliacao;
        break;
      }
    }

    return {
      id: p.id,
      alunoId: p.aluno_id,
      status: p.status,
      ultimoResultado,
    };
  });
}
