import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessor } from "@/lib/auth/dal";

// Exige professor + vínculo como proprietário desse projeto específico.
// Usado na tela de gestão de professores (Modelo Conceitual §3.1: só o
// proprietário adiciona/remove outros professores).
export async function requireProprietarioDoProjeto(projetoId: string) {
  const user = await requireProfessor();
  const supabase = await createClient();

  const { data } = await supabase
    .from("projeto_professores")
    .select("papel_no_projeto")
    .eq("projeto_id", projetoId)
    .eq("professor_id", user.id)
    .maybeSingle();

  if (data?.papel_no_projeto !== "proprietario") {
    redirect(
      `/projetos/${projetoId}?error=${encodeURIComponent(
        "Apenas o proprietário pode gerenciar professores do projeto.",
      )}`,
    );
  }

  return user;
}

// Exige professor + vínculo (proprietário OU colaborador) com esse projeto.
// Usado na tela de gestão de alunos (qualquer professor vinculado atribui).
export async function requireProfessorDoProjeto(projetoId: string) {
  const user = await requireProfessor();
  const supabase = await createClient();

  const { data } = await supabase
    .from("projeto_professores")
    .select("professor_id")
    .eq("projeto_id", projetoId)
    .eq("professor_id", user.id)
    .maybeSingle();

  if (!data) {
    redirect(
      `/projetos?error=${encodeURIComponent("Você não está vinculado a esse projeto.")}`,
    );
  }

  return user;
}
