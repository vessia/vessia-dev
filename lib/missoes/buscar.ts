import type { SupabaseClient } from "@supabase/supabase-js";
import { calcularStatusMissao, type StatusMissao } from "./status";

export type MissaoComStatus = {
  id: string;
  slug: string;
  titulo: string;
  tipo: string;
  vagas: number | null;
  prazo: string | null;
  obrigatoria: boolean;
  concluida_em: string | null;
  status: StatusMissao;
};

// Busca as missões de uma etapa já com o status calculado (seção 5 do
// Modelo Conceitual). Centralizado aqui porque tanto a página da etapa
// (visão do professor) quanto o mapa do projeto (visão do aluno) precisam
// exatamente do mesmo dado — evita duas implementações divergindo.
export async function buscarMissoesComStatus(
  supabase: SupabaseClient,
  etapaId: string,
): Promise<MissaoComStatus[]> {
  const { data: missoes } = await supabase
    .from("missoes")
    .select("id, slug, titulo, tipo, vagas, prazo, obrigatoria, concluida_em")
    .eq("etapa_id", etapaId)
    .order("titulo", { ascending: true });

  const lista = missoes ?? [];
  const missaoIds = lista.map((m) => m.id);

  const { data: dependenciasRows } = missaoIds.length
    ? await supabase
        .from("missao_dependencias")
        .select("missao_id, depende_de_id")
        .in("missao_id", missaoIds)
    : { data: [] };

  const dependeDeIds = Array.from(
    new Set((dependenciasRows ?? []).map((d) => d.depende_de_id)),
  );

  const { data: dependenciasStatus } = dependeDeIds.length
    ? await supabase
        .from("missoes")
        .select("id, concluida_em")
        .in("id", dependeDeIds)
    : { data: [] };

  const concluidaEmPorMissao = new Map(
    (dependenciasStatus ?? []).map((m) => [m.id, m.concluida_em] as const),
  );

  const dependenciasPorMissao = new Map<string, string[]>();
  for (const dep of dependenciasRows ?? []) {
    const atual = dependenciasPorMissao.get(dep.missao_id) ?? [];
    atual.push(dep.depende_de_id);
    dependenciasPorMissao.set(dep.missao_id, atual);
  }

  const { data: participacoesRows } = missaoIds.length
    ? await supabase
        .from("participacoes")
        .select("missao_id")
        .in("missao_id", missaoIds)
    : { data: [] };

  const missoesComParticipacao = new Set(
    (participacoesRows ?? []).map((p) => p.missao_id),
  );

  return lista.map((missao) => {
    const dependencias = dependenciasPorMissao.get(missao.id) ?? [];
    const todasDependenciasConcluidas = dependencias.every(
      (depId) => concluidaEmPorMissao.get(depId) != null,
    );

    return {
      ...missao,
      status: calcularStatusMissao({
        concluidaEm: missao.concluida_em,
        todasDependenciasConcluidas,
        temParticipacao: missoesComParticipacao.has(missao.id),
      }),
    };
  });
}

export type DependenciaComStatus = {
  id: string;
  titulo: string;
  concluida: boolean;
};

// Para a tela de detalhe da missão: as missões das quais ela depende, com
// indicação visual de concluída ou não (06 - Telas.md, seção 4).
export async function buscarDependenciasComStatus(
  supabase: SupabaseClient,
  missaoId: string,
): Promise<DependenciaComStatus[]> {
  const { data: deps } = await supabase
    .from("missao_dependencias")
    .select("depende_de_id")
    .eq("missao_id", missaoId);

  const ids = (deps ?? []).map((d) => d.depende_de_id);
  if (ids.length === 0) return [];

  const { data: missoes } = await supabase
    .from("missoes")
    .select("id, titulo, concluida_em")
    .in("id", ids);

  return (missoes ?? []).map((m) => ({
    id: m.id,
    titulo: m.titulo,
    concluida: m.concluida_em != null,
  }));
}
