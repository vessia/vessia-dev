import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type EntregaComContexto = {
  entregaId: string;
  conteudo: string;
  tipoConteudo: string;
  participacaoId: string;
  alunoId: string;
  missaoId: string;
  projetoId: string;
};

// Cadeia entrega -> participação -> missão -> etapa -> projeto, usada tanto
// pela tela de avaliação quanto pela geração de URL assinada — ver
// DECISIONS.md ("mesma checagem de acesso já usada em todo o resto, não
// duplicada"). Mesmo estilo de busca sequencial já usado no resto do app.
export async function buscarEntregaComContexto(
  supabase: SupabaseClient,
  entregaId: string,
): Promise<EntregaComContexto | null> {
  const { data: entrega } = await supabase
    .from("entregas")
    .select("id, conteudo, tipo_conteudo, participacao_id")
    .eq("id", entregaId)
    .maybeSingle();

  if (!entrega) return null;

  const { data: participacao } = await supabase
    .from("participacoes")
    .select("aluno_id, missao_id")
    .eq("id", entrega.participacao_id)
    .maybeSingle();

  if (!participacao) return null;

  const { data: missao } = await supabase
    .from("missoes")
    .select("etapa_id")
    .eq("id", participacao.missao_id)
    .maybeSingle();

  if (!missao) return null;

  const { data: etapa } = await supabase
    .from("etapas")
    .select("projeto_id")
    .eq("id", missao.etapa_id)
    .maybeSingle();

  if (!etapa) return null;

  return {
    entregaId: entrega.id,
    conteudo: entrega.conteudo,
    tipoConteudo: entrega.tipo_conteudo,
    participacaoId: entrega.participacao_id,
    alunoId: participacao.aluno_id,
    missaoId: participacao.missao_id,
    projetoId: etapa.projeto_id,
  };
}

// Aluno só acessa a própria entrega; professor precisa estar vinculado ao
// projeto (proprietário ou colaborador — mesma regra de eh_professor_do_projeto).
export async function usuarioPodeAcessarEntrega(
  supabase: SupabaseClient,
  contexto: EntregaComContexto,
  userId: string,
  papel: string | undefined,
): Promise<boolean> {
  if (papel === "aluno") {
    return contexto.alunoId === userId;
  }

  if (papel === "professor") {
    const { data } = await supabase
      .from("projeto_professores")
      .select("professor_id")
      .eq("projeto_id", contexto.projetoId)
      .eq("professor_id", userId)
      .maybeSingle();

    return Boolean(data);
  }

  return false;
}
