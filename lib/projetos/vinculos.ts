import type { SupabaseClient } from "@supabase/supabase-js";

export type PapelNoProjeto = "proprietario" | "colaborador";
export type StatusAtribuicaoAluno =
  | "convidado"
  | "aceito"
  | "recusado"
  | "saiu"
  | "removido";

export type ProfessorVinculado = {
  professorId: string;
  nome: string;
  papelNoProjeto: PapelNoProjeto;
};

export type AlunoVinculado = {
  alunoId: string;
  nome: string;
  status: StatusAtribuicaoAluno;
};

export async function buscarProfessoresDoProjeto(
  supabase: SupabaseClient,
  projetoId: string,
): Promise<ProfessorVinculado[]> {
  const { data } = await supabase
    .from("projeto_professores")
    .select("professor_id, papel_no_projeto")
    .eq("projeto_id", projetoId);

  const lista = data ?? [];
  const ids = lista.map((p) => p.professor_id);
  const { data: perfis } = ids.length
    ? await supabase.from("profiles").select("id, nome").in("id", ids)
    : { data: [] };

  const nomePorId = new Map((perfis ?? []).map((p) => [p.id, p.nome]));

  return lista
    .map((p) => ({
      professorId: p.professor_id,
      nome: nomePorId.get(p.professor_id) ?? "?",
      papelNoProjeto: p.papel_no_projeto as PapelNoProjeto,
    }))
    .sort((a, b) => (a.papelNoProjeto === b.papelNoProjeto ? 0 : a.papelNoProjeto === "proprietario" ? -1 : 1));
}

export async function buscarAlunosDoProjeto(
  supabase: SupabaseClient,
  projetoId: string,
): Promise<AlunoVinculado[]> {
  const { data } = await supabase
    .from("projeto_alunos")
    .select("aluno_id, status")
    .eq("projeto_id", projetoId);

  const lista = data ?? [];
  const ids = lista.map((a) => a.aluno_id);
  const { data: perfis } = ids.length
    ? await supabase.from("profiles").select("id, nome").in("id", ids)
    : { data: [] };

  const nomePorId = new Map((perfis ?? []).map((p) => [p.id, p.nome]));

  return lista.map((a) => ({
    alunoId: a.aluno_id,
    nome: nomePorId.get(a.aluno_id) ?? "?",
    status: a.status as StatusAtribuicaoAluno,
  }));
}

export async function buscarVinculoAlunoNoProjeto(
  supabase: SupabaseClient,
  projetoId: string,
  alunoId: string,
) {
  const { data } = await supabase
    .from("projeto_alunos")
    .select("status")
    .eq("projeto_id", projetoId)
    .eq("aluno_id", alunoId)
    .maybeSingle();

  return (data?.status as StatusAtribuicaoAluno | undefined) ?? null;
}

export type ConviteProjeto = {
  projetoId: string;
  projetoNome: string;
  projetoDescricao: string | null;
};

// Convites (status 'convidado') pendentes de resposta do aluno logado —
// usado na seção de convites do dashboard (05 - Fluxos.md §2.1).
export async function buscarConvitesPendentes(
  supabase: SupabaseClient,
  alunoId: string,
): Promise<ConviteProjeto[]> {
  const { data } = await supabase
    .from("projeto_alunos")
    .select("projeto_id")
    .eq("aluno_id", alunoId)
    .eq("status", "convidado");

  const projetoIds = (data ?? []).map((d) => d.projeto_id);
  if (projetoIds.length === 0) return [];

  const { data: projetos } = await supabase
    .from("projetos")
    .select("id, nome, descricao")
    .in("id", projetoIds);

  return (projetos ?? []).map((p) => ({
    projetoId: p.id,
    projetoNome: p.nome,
    projetoDescricao: p.descricao,
  }));
}

// Busca simples por nome, para os fluxos de "adicionar colaborador" /
// "atribuir aluno" — profiles não guarda e-mail (fica só em auth.users, não
// consultável pelo client normal), então a busca é por nome mesmo.
export async function buscarUsuariosPorNome(
  supabase: SupabaseClient,
  papel: "professor" | "aluno",
  termo: string,
  excluirIds: string[] = [],
) {
  let query = supabase
    .from("profiles")
    .select("id, nome")
    .eq("papel", papel)
    .ilike("nome", `%${termo}%`)
    .order("nome")
    .limit(10);

  if (excluirIds.length > 0) {
    query = query.not("id", "in", `(${excluirIds.join(",")})`);
  }

  const { data } = await query;
  return data ?? [];
}
