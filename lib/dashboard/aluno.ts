import type { SupabaseClient } from "@supabase/supabase-js";
import { buscarMissoesComStatus } from "@/lib/missoes/buscar";

export type ResumoAluno = {
  projetosAtivos: number;
  missoesDisponiveis: number;
  temAlgumVinculo: boolean;
};

// DECISIONS.md, "Retoque visual no Início": resumo simples no dashboard do
// aluno — quantos projetos ativos ele tem (vínculo 'aceito' + projeto
// 'ativo') e quantas missões estão disponíveis pra ele agora, somadas
// entre todos esses projetos. Reaproveita buscarMissoesComStatus (mesma
// fonte de status usada no mapa do projeto) em vez de recalcular a regra.
// `temAlgumVinculo` distingue "0 porque não tem nenhum projeto ainda" de
// "0 porque só tem convite pendente/recusado" — só o primeiro caso mostra
// a mensagem amigável de tela vazia.
export async function buscarResumoAluno(
  supabase: SupabaseClient,
  alunoId: string,
): Promise<ResumoAluno> {
  const { data: vinculos } = await supabase
    .from("projeto_alunos")
    .select("projeto_id, status")
    .eq("aluno_id", alunoId);

  const listaVinculos = vinculos ?? [];
  const temAlgumVinculo = listaVinculos.length > 0;

  const projetoIdsAceitos = listaVinculos
    .filter((v) => v.status === "aceito")
    .map((v) => v.projeto_id);

  if (projetoIdsAceitos.length === 0) {
    return { projetosAtivos: 0, missoesDisponiveis: 0, temAlgumVinculo };
  }

  const { data: projetosAtivos } = await supabase
    .from("projetos")
    .select("id")
    .in("id", projetoIdsAceitos)
    .eq("status", "ativo");

  const projetoIdsAtivos = (projetosAtivos ?? []).map((p) => p.id);

  if (projetoIdsAtivos.length === 0) {
    return { projetosAtivos: 0, missoesDisponiveis: 0, temAlgumVinculo };
  }

  const { data: etapas } = await supabase
    .from("etapas")
    .select("id")
    .in("projeto_id", projetoIdsAtivos);

  const missoesPorEtapa = await Promise.all(
    (etapas ?? []).map((e) => buscarMissoesComStatus(supabase, e.id)),
  );

  const missoesDisponiveis = missoesPorEtapa
    .flat()
    .filter((m) => m.status === "disponivel").length;

  return {
    projetosAtivos: projetoIdsAtivos.length,
    missoesDisponiveis,
    temAlgumVinculo,
  };
}
