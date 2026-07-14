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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// O campo de busca aceita nome OU e-mail no mesmo input — se o termo tem
// "@" mas não parece um e-mail válido, vale avisar isso explicitamente em
// vez de só dizer "nenhum resultado encontrado" (preparação pré-lançamento
// pra alunos reais — busca por e-mail precisa de mensagens de erro claras).
export function pareceEmailInvalido(termo: string): boolean {
  return termo.includes("@") && !EMAIL_REGEX.test(termo);
}

// Busca por nome OU e-mail, para os fluxos de "adicionar colaborador" /
// "atribuir aluno" (DECISIONS.md: "Busca de aluno/professor por e-mail, não
// só nome" — nome sozinho é ambíguo). Duas queries separadas (em vez de
// `.or()` com uma string montada na mão) pra não precisar escapar vírgula/
// parênteses do termo digitado na sintaxe de filtro do PostgREST.
export async function buscarUsuariosPorNome(
  supabase: SupabaseClient,
  papel: "professor" | "aluno",
  termo: string,
  excluirIds: string[] = [],
) {
  function query() {
    let q = supabase.from("profiles").select("id, nome, email").eq("papel", papel);
    if (excluirIds.length > 0) {
      q = q.not("id", "in", `(${excluirIds.join(",")})`);
    }
    return q;
  }

  const [porNome, porEmail] = await Promise.all([
    query().ilike("nome", `%${termo}%`).order("nome").limit(10),
    query().ilike("email", `%${termo}%`).order("nome").limit(10),
  ]);

  const porId = new Map<string, { id: string; nome: string; email: string }>();
  for (const r of [...(porNome.data ?? []), ...(porEmail.data ?? [])]) {
    porId.set(r.id, r);
  }

  return Array.from(porId.values())
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .slice(0, 10);
}
