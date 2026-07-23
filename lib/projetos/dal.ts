import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessor } from "@/lib/auth/dal";
import { precisaAceitarTermoEspecifico } from "@/lib/participacoes/validacoes";

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

// DECISIONS.md, "Aceite do termo específico vira gate de projeto, não
// embutido numa missão": gate isolado, checado assim que o aluno acessa
// qualquer conteúdo do projeto (mapa, etapa ou missão) — não mais atrelado
// à tentativa de participar de uma missão específica. Chamado só para
// aluno com vínculo 'aceito' (professor nunca passa por aqui).
export async function requireTermoAceito(
  alunoId: string,
  projetoId: string,
  projetoSlug: string,
) {
  const supabase = await createClient();

  const { data: projeto } = await supabase
    .from("projetos")
    .select("termo_especifico")
    .eq("id", projetoId)
    .single();

  const { data: vinculo } = await supabase
    .from("projeto_alunos")
    .select("termo_aceito_em")
    .eq("projeto_id", projetoId)
    .eq("aluno_id", alunoId)
    .maybeSingle();

  const pendente = precisaAceitarTermoEspecifico({
    termoEspecifico: projeto?.termo_especifico ?? null,
    termoAceitoEm: vinculo?.termo_aceito_em ?? null,
  });

  if (pendente) {
    redirect(`/projetos/${projetoSlug}/aceitar-termo`);
  }
}
