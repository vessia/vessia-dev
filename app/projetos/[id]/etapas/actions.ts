"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessor } from "@/lib/auth/dal";

function mensagemDeErro(error: { code?: string; message: string }) {
  // 23505 = unique_violation — no schema, unique(projeto_id, ordem).
  return error.code === "23505"
    ? "Já existe uma etapa com essa ordem neste projeto. Escolha outro número."
    : error.message;
}

export async function criarEtapa(formData: FormData) {
  await requireProfessor();

  const projetoId = String(formData.get("projeto_id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const ordemRaw = String(formData.get("ordem") ?? "");
  const ordem = Number(ordemRaw);

  if (!nome || !ordemRaw || Number.isNaN(ordem)) {
    redirect(
      `/projetos/${projetoId}/etapas/nova?error=${encodeURIComponent(
        "Preencha nome e ordem.",
      )}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("etapas").insert({
    projeto_id: projetoId,
    nome,
    ordem,
  });

  if (error) {
    redirect(
      `/projetos/${projetoId}/etapas/nova?error=${encodeURIComponent(
        mensagemDeErro(error),
      )}`,
    );
  }

  redirect(`/projetos/${projetoId}`);
}

export async function atualizarEtapa(formData: FormData) {
  await requireProfessor();

  const projetoId = String(formData.get("projeto_id") ?? "");
  const etapaId = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const ordemRaw = String(formData.get("ordem") ?? "");
  const ordem = Number(ordemRaw);

  if (!nome || !ordemRaw || Number.isNaN(ordem)) {
    redirect(
      `/projetos/${projetoId}/etapas/${etapaId}/editar?error=${encodeURIComponent(
        "Preencha nome e ordem.",
      )}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("etapas")
    .update({ nome, ordem })
    .eq("id", etapaId);

  if (error) {
    redirect(
      `/projetos/${projetoId}/etapas/${etapaId}/editar?error=${encodeURIComponent(
        mensagemDeErro(error),
      )}`,
    );
  }

  redirect(`/projetos/${projetoId}`);
}
