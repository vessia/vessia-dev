"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessor } from "@/lib/auth/dal";
import { gerarSlugUnico } from "@/lib/slugs/unico";
import { buscarSlugPorId } from "@/lib/slugs/buscar";

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

  const supabase = await createClient();
  const projetoSlug = await buscarSlugPorId(supabase, "projetos", projetoId);

  if (!nome || !ordemRaw || Number.isNaN(ordem)) {
    redirect(
      `/projetos/${projetoSlug}/etapas/nova?error=${encodeURIComponent(
        "Preencha nome e ordem.",
      )}`,
    );
  }

  const slug = await gerarSlugUnico(
    "etapas",
    { projeto_id: projetoId },
    nome,
  );

  const { error } = await supabase.from("etapas").insert({
    projeto_id: projetoId,
    nome,
    ordem,
    slug,
  });

  if (error) {
    redirect(
      `/projetos/${projetoSlug}/etapas/nova?error=${encodeURIComponent(
        mensagemDeErro(error),
      )}`,
    );
  }

  redirect(`/projetos/${projetoSlug}`);
}

export async function atualizarEtapa(formData: FormData) {
  await requireProfessor();

  const projetoId = String(formData.get("projeto_id") ?? "");
  const etapaId = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const ordemRaw = String(formData.get("ordem") ?? "");
  const ordem = Number(ordemRaw);

  const supabase = await createClient();
  const projetoSlug = await buscarSlugPorId(supabase, "projetos", projetoId);

  if (!nome || !ordemRaw || Number.isNaN(ordem)) {
    const etapaSlug = await buscarSlugPorId(supabase, "etapas", etapaId);
    redirect(
      `/projetos/${projetoSlug}/etapas/${etapaSlug}/editar?error=${encodeURIComponent(
        "Preencha nome e ordem.",
      )}`,
    );
  }

  const { error } = await supabase
    .from("etapas")
    .update({ nome, ordem })
    .eq("id", etapaId);

  if (error) {
    const etapaSlug = await buscarSlugPorId(supabase, "etapas", etapaId);
    redirect(
      `/projetos/${projetoSlug}/etapas/${etapaSlug}/editar?error=${encodeURIComponent(
        mensagemDeErro(error),
      )}`,
    );
  }

  redirect(`/projetos/${projetoSlug}`);
}
