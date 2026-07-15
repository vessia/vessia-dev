"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAluno } from "@/lib/auth/dal";
import { requireProfessorDoProjeto } from "@/lib/projetos/dal";
import { buscarSlugPorId } from "@/lib/slugs/buscar";
import { atribuirOuReconvidarAluno, emailValido } from "@/lib/projetos/vinculos";

export async function atribuirAluno(formData: FormData) {
  const projetoId = String(formData.get("projeto_id") ?? "");
  const alunoId = String(formData.get("aluno_id") ?? "");
  const user = await requireProfessorDoProjeto(projetoId);
  const supabase = await createClient();
  const projetoSlug = await buscarSlugPorId(supabase, "projetos", projetoId);
  const destino = `/projetos/${projetoSlug}/alunos`;

  if (!alunoId) {
    redirect(`${destino}?error=${encodeURIComponent("Selecione um aluno.")}`);
  }

  const { error } = await atribuirOuReconvidarAluno(
    supabase,
    projetoId,
    alunoId,
    user.id,
  );

  if (error) {
    redirect(`${destino}?error=${encodeURIComponent(error)}`);
  }

  redirect(destino);
}

// DECISIONS.md, "Convite por e-mail para aluno não cadastrado ainda":
// professor digita um e-mail; se já existe conta de aluno com ele, atribui
// na hora (mesma lógica de atribuirAluno); senão, registra uma pendência
// resolvida automaticamente no cadastro (app/cadastro/actions.ts).
export async function convidarPorEmail(formData: FormData) {
  const projetoId = String(formData.get("projeto_id") ?? "");
  const emailBruto = String(formData.get("email") ?? "").trim();
  const user = await requireProfessorDoProjeto(projetoId);
  const supabase = await createClient();
  const projetoSlug = await buscarSlugPorId(supabase, "projetos", projetoId);
  const destino = `/projetos/${projetoSlug}/alunos`;

  if (!emailBruto || !emailValido(emailBruto)) {
    redirect(`${destino}?error=${encodeURIComponent("Informe um e-mail válido.")}`);
  }

  const email = emailBruto.toLowerCase();

  const { data: alunoExistente } = await supabase
    .from("profiles")
    .select("id")
    .eq("papel", "aluno")
    .ilike("email", email)
    .maybeSingle();

  if (alunoExistente) {
    const { error } = await atribuirOuReconvidarAluno(
      supabase,
      projetoId,
      alunoExistente.id,
      user.id,
    );

    if (error) {
      redirect(`${destino}?error=${encodeURIComponent(error)}`);
    }

    redirect(`${destino}?message=${encodeURIComponent("Aluno convidado.")}`);
  }

  // Não duplica pendência se já existe uma não resolvida pra esse mesmo
  // projeto+e-mail (evita duas linhas tentando resolver pro mesmo vínculo
  // quando a pessoa se cadastrar).
  const { data: pendenteExistente } = await supabase
    .from("convites_email_pendentes")
    .select("id")
    .eq("projeto_id", projetoId)
    .ilike("email", email)
    .is("resolvido_em", null)
    .maybeSingle();

  if (!pendenteExistente) {
    const { error } = await supabase.from("convites_email_pendentes").insert({
      projeto_id: projetoId,
      email,
      convidado_por: user.id,
    });

    if (error) {
      redirect(`${destino}?error=${encodeURIComponent(error.message)}`);
    }
  }

  redirect(
    `${destino}?message=${encodeURIComponent(
      "Convite registrado — será aplicado automaticamente quando esse e-mail se cadastrar.",
    )}`,
  );
}

export async function removerAluno(formData: FormData) {
  const projetoId = String(formData.get("projeto_id") ?? "");
  await requireProfessorDoProjeto(projetoId);
  const supabase = await createClient();
  const projetoSlug = await buscarSlugPorId(supabase, "projetos", projetoId);
  const destino = `/projetos/${projetoSlug}/alunos`;
  const alunoId = String(formData.get("aluno_id") ?? "");

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
  const supabase = await createClient();
  const projetoSlug = await buscarSlugPorId(supabase, "projetos", projetoId);
  const destino = `/projetos/${projetoSlug}`;

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
