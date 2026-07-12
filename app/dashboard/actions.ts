"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAluno } from "@/lib/auth/dal";

export async function responderConvite(formData: FormData) {
  const user = await requireAluno();
  const projetoId = String(formData.get("projeto_id") ?? "");
  const resposta = String(formData.get("resposta") ?? "");

  if (resposta !== "aceito" && resposta !== "recusado") {
    redirect(`/dashboard?error=${encodeURIComponent("Resposta inválida.")}`);
  }

  const supabase = await createClient();

  const { data: atual } = await supabase
    .from("projeto_alunos")
    .select("status")
    .eq("projeto_id", projetoId)
    .eq("aluno_id", user.id)
    .maybeSingle();

  // 05 - Fluxos.md §2.1: só responde um convite que ainda está 'convidado'
  // — não é possível responder de novo um já aceito/recusado.
  if (atual?.status !== "convidado") {
    redirect(
      `/dashboard?error=${encodeURIComponent(
        "Esse convite já foi respondido ou não existe mais.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("projeto_alunos")
    .update({ status: resposta, respondido_em: new Date().toISOString() })
    .eq("projeto_id", projetoId)
    .eq("aluno_id", user.id);

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
