"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessor } from "@/lib/auth/dal";
import { validarAvaliacao } from "@/lib/participacoes/validacoes";

export async function avaliar(formData: FormData) {
  const user = await requireProfessor();

  const entregaId = String(formData.get("entrega_id") ?? "");
  const resultado = String(formData.get("resultado") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();
  const destino = `/avaliacoes/${entregaId}`;

  const supabase = await createClient();

  const { data: entrega } = await supabase
    .from("entregas")
    .select("id, participacao_id")
    .eq("id", entregaId)
    .single();

  if (!entrega) {
    redirect(`${destino}?error=${encodeURIComponent("Entrega não encontrada.")}`);
  }

  const { data: avaliacaoExistente } = await supabase
    .from("avaliacoes")
    .select("id")
    .eq("entrega_id", entregaId)
    .maybeSingle();

  const validacao = validarAvaliacao({
    resultado,
    feedback,
    jaAvaliada: Boolean(avaliacaoExistente),
  });

  if (!validacao.permitido) {
    redirect(`${destino}?error=${encodeURIComponent(validacao.motivo)}`);
  }

  const { error: avaliacaoError } = await supabase.from("avaliacoes").insert({
    entrega_id: entregaId,
    resultado,
    feedback: feedback || null,
    avaliador_id: user.id,
  });

  if (avaliacaoError) {
    redirect(`${destino}?error=${encodeURIComponent(avaliacaoError.message)}`);
  }

  // Modelo Conceitual §9: aprovada/aprovada_com_ressalvas -> concluída;
  // rejeitada -> volta pra em_andamento (permite reenvio, respeitando o
  // limite já validado no Bloco 8). Exige a policy de update do professor
  // em docs/004_participacoes_professor_update_policy.sql.
  const novoStatus = resultado === "rejeitada" ? "em_andamento" : "concluida";

  const { error: statusError } = await supabase
    .from("participacoes")
    .update({ status: novoStatus })
    .eq("id", entrega.participacao_id);

  if (statusError) {
    redirect(
      `${destino}?error=${encodeURIComponent(
        "Avaliação registrada, mas houve um erro ao atualizar o status: " +
          statusError.message,
      )}`,
    );
  }

  redirect("/dashboard");
}
