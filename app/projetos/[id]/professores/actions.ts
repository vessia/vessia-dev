"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProprietarioDoProjeto } from "@/lib/projetos/dal";

export async function adicionarColaborador(formData: FormData) {
  const projetoId = String(formData.get("projeto_id") ?? "");
  const professorId = String(formData.get("professor_id") ?? "");
  const user = await requireProprietarioDoProjeto(projetoId);
  const destino = `/projetos/${projetoId}/professores`;

  if (!professorId) {
    redirect(`${destino}?error=${encodeURIComponent("Selecione um professor.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projeto_professores").insert({
    projeto_id: projetoId,
    professor_id: professorId,
    papel_no_projeto: "colaborador",
    adicionado_por: user.id,
  });

  if (error) {
    const mensagem =
      error.code === "23505"
        ? "Esse professor já está vinculado ao projeto."
        : error.message;
    redirect(`${destino}?error=${encodeURIComponent(mensagem)}`);
  }

  redirect(destino);
}

export async function removerProfessor(formData: FormData) {
  const projetoId = String(formData.get("projeto_id") ?? "");
  await requireProprietarioDoProjeto(projetoId);
  const destino = `/projetos/${projetoId}/professores`;
  const professorId = String(formData.get("professor_id") ?? "");

  const supabase = await createClient();

  const { data: alvo } = await supabase
    .from("projeto_professores")
    .select("papel_no_projeto")
    .eq("projeto_id", projetoId)
    .eq("professor_id", professorId)
    .maybeSingle();

  if (alvo?.papel_no_projeto === "proprietario") {
    redirect(
      `${destino}?error=${encodeURIComponent(
        "Não é possível remover o proprietário do projeto.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("projeto_professores")
    .delete()
    .eq("projeto_id", projetoId)
    .eq("professor_id", professorId);

  if (error) {
    redirect(`${destino}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(destino);
}
