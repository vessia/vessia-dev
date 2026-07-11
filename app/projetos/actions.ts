"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessor } from "@/lib/auth/dal";

export async function criarProjeto(formData: FormData) {
  const user = await requireProfessor();

  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const cliente = String(formData.get("cliente") ?? "").trim() || null;

  if (!nome) {
    redirect(`/projetos/novo?error=${encodeURIComponent("Nome é obrigatório.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projetos").insert({
    nome,
    descricao,
    cliente,
    criado_por: user.id,
  });

  if (error) {
    redirect(`/projetos/novo?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/projetos");
}

export async function atualizarProjeto(formData: FormData) {
  await requireProfessor();

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const cliente = String(formData.get("cliente") ?? "").trim() || null;

  if (!nome) {
    redirect(
      `/projetos/${id}/editar?error=${encodeURIComponent("Nome é obrigatório.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projetos")
    .update({ nome, descricao, cliente })
    .eq("id", id);

  if (error) {
    redirect(`/projetos/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/projetos");
}

export async function encerrarProjeto(formData: FormData) {
  const user = await requireProfessor();

  const id = String(formData.get("id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("projetos")
    .update({
      status: "encerrado",
      encerrado_por: user.id,
      encerrado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/projetos?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/projetos");
}
