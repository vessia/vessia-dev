"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAluno } from "@/lib/auth/dal";
import { requireProfessorDoProjeto } from "@/lib/projetos/dal";

export async function atribuirAluno(formData: FormData) {
  const projetoId = String(formData.get("projeto_id") ?? "");
  const alunoId = String(formData.get("aluno_id") ?? "");
  const user = await requireProfessorDoProjeto(projetoId);
  const destino = `/projetos/${projetoId}/alunos`;

  if (!alunoId) {
    redirect(`${destino}?error=${encodeURIComponent("Selecione um aluno.")}`);
  }

  const supabase = await createClient();

  const { data: atual } = await supabase
    .from("projeto_alunos")
    .select("status")
    .eq("projeto_id", projetoId)
    .eq("aluno_id", alunoId)
    .maybeSingle();

  // DECISIONS.md, "Professor pode reconvidar aluno...": quem já saiu, foi
  // removido ou recusou o convite pode ser convidado de novo — reabre a
  // mesma linha (reseta o ciclo de resposta) em vez de tentar inserir uma
  // nova, que colidiria com a chave primária (projeto_id, aluno_id).
  // termo_aceito_em não é tocado — aceite de termo específico, se existir,
  // continua valendo. 'convidado'/'aceito' cai no insert abaixo, que
  // continua barrando com a mesma mensagem de sempre.
  if (
    atual &&
    (atual.status === "saiu" ||
      atual.status === "removido" ||
      atual.status === "recusado")
  ) {
    const { error } = await supabase
      .from("projeto_alunos")
      .update({
        status: "convidado",
        atribuido_por: user.id,
        atribuido_em: new Date().toISOString(),
        respondido_em: null,
      })
      .eq("projeto_id", projetoId)
      .eq("aluno_id", alunoId);

    if (error) {
      redirect(`${destino}?error=${encodeURIComponent(error.message)}`);
    }

    redirect(destino);
  }

  const { error } = await supabase.from("projeto_alunos").insert({
    projeto_id: projetoId,
    aluno_id: alunoId,
    status: "convidado",
    atribuido_por: user.id,
  });

  if (error) {
    const mensagem =
      error.code === "23505"
        ? "Esse aluno já foi atribuído a este projeto."
        : error.message;
    redirect(`${destino}?error=${encodeURIComponent(mensagem)}`);
  }

  redirect(destino);
}

export async function removerAluno(formData: FormData) {
  const projetoId = String(formData.get("projeto_id") ?? "");
  await requireProfessorDoProjeto(projetoId);
  const destino = `/projetos/${projetoId}/alunos`;
  const alunoId = String(formData.get("aluno_id") ?? "");

  const supabase = await createClient();

  const { data: atual } = await supabase
    .from("projeto_alunos")
    .select("status")
    .eq("projeto_id", projetoId)
    .eq("aluno_id", alunoId)
    .maybeSingle();

  // 05 - Fluxos.md §2.1: só faz sentido remover quem está 'aceito' — não
  // quem nunca aceitou, recusou, já saiu ou já foi removido.
  if (atual?.status !== "aceito") {
    redirect(
      `${destino}?error=${encodeURIComponent(
        "Só é possível remover um aluno que esteja com status aceito.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("projeto_alunos")
    .update({ status: "removido", respondido_em: new Date().toISOString() })
    .eq("projeto_id", projetoId)
    .eq("aluno_id", alunoId);

  if (error) {
    redirect(`${destino}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(destino);
}

export async function sairDoProjeto(formData: FormData) {
  const user = await requireAluno();
  const projetoId = String(formData.get("projeto_id") ?? "");
  const destino = `/projetos/${projetoId}`;

  const supabase = await createClient();

  const { data: atual } = await supabase
    .from("projeto_alunos")
    .select("status")
    .eq("projeto_id", projetoId)
    .eq("aluno_id", user.id)
    .maybeSingle();

  if (atual?.status !== "aceito") {
    redirect(
      `${destino}?error=${encodeURIComponent(
        "Você só pode sair de um projeto em que estiver com status aceito.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("projeto_alunos")
    .update({ status: "saiu", respondido_em: new Date().toISOString() })
    .eq("projeto_id", projetoId)
    .eq("aluno_id", user.id);

  if (error) {
    redirect(`${destino}?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/projetos");
}
