import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { gerarUrlAssinadaArquivo } from "./url-assinada";

export type EntregaDaMissao = {
  id: string;
  numeroTentativa: number;
  conteudo: string;
  tipoConteudo: string;
  enviadaEm: string;
  urlAssinada: string | null;
};

export type ParticipacaoComEntregas = {
  participacaoId: string;
  alunoId: string;
  alunoNome: string;
  entregas: EntregaDaMissao[];
};

// "Entregas desta missão": lista todas as participações de uma missão com
// suas entregas (mais recente primeiro), pra quem está vinculado ao projeto
// (professor OU qualquer aluno aceito, incluindo o próprio autor vendo a
// própria entrega) — RLS de participacoes/entregas já escopa isso por
// vínculo de projeto (docs/017_rls_entregas_participacoes_avaliacoes_escopo_projeto.sql),
// essa função só monta a leitura agrupada por aluno.
export async function buscarEntregasDaMissao(
  supabase: SupabaseClient,
  missaoId: string,
): Promise<ParticipacaoComEntregas[]> {
  const { data: participacoes } = await supabase
    .from("participacoes")
    .select("id, aluno_id")
    .eq("missao_id", missaoId);

  const lista = participacoes ?? [];
  if (lista.length === 0) return [];

  const participacaoIds = lista.map((p) => p.id);
  const alunoIds = Array.from(new Set(lista.map((p) => p.aluno_id)));

  const [{ data: alunos }, { data: entregas }] = await Promise.all([
    supabase.from("profiles").select("id, nome").in("id", alunoIds),
    supabase
      .from("entregas")
      .select(
        "id, participacao_id, numero_tentativa, conteudo, tipo_conteudo, enviada_em",
      )
      .in("participacao_id", participacaoIds)
      .order("numero_tentativa", { ascending: false }),
  ]);

  const nomePorAluno = new Map(
    (alunos ?? []).map((a) => [a.id, a.nome] as const),
  );

  const urlsPorEntrega = new Map(
    await Promise.all(
      (entregas ?? [])
        .filter((e) => e.tipo_conteudo === "arquivo")
        .map(
          async (e) =>
            [e.id, await gerarUrlAssinadaArquivo(e.conteudo)] as const,
        ),
    ),
  );

  const entregasPorParticipacao = new Map<string, EntregaDaMissao[]>();
  for (const e of entregas ?? []) {
    const atual = entregasPorParticipacao.get(e.participacao_id) ?? [];
    atual.push({
      id: e.id,
      numeroTentativa: e.numero_tentativa,
      conteudo: e.conteudo,
      tipoConteudo: e.tipo_conteudo,
      enviadaEm: e.enviada_em,
      urlAssinada: urlsPorEntrega.get(e.id) ?? null,
    });
    entregasPorParticipacao.set(e.participacao_id, atual);
  }

  return lista
    .map((p) => ({
      participacaoId: p.id,
      alunoId: p.aluno_id,
      alunoNome: nomePorAluno.get(p.aluno_id) ?? "Aluno",
      entregas: entregasPorParticipacao.get(p.id) ?? [],
    }))
    .filter((p) => p.entregas.length > 0)
    .sort((a, b) => a.alunoNome.localeCompare(b.alunoNome, "pt-BR"));
}
