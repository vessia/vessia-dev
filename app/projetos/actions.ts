"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessor } from "@/lib/auth/dal";
import { criacaoProjetoHabilitada } from "@/lib/projetos/feature-flags";
import { gerarSlugUnico } from "@/lib/slugs/unico";
import { buscarSlugPorId } from "@/lib/slugs/buscar";

export async function criarProjeto(formData: FormData) {
  const user = await requireProfessor();

  // DECISIONS.md: interruptor geral, checado no servidor — não é só a UI
  // escondendo o botão. Bloqueia mesmo o proprietário, antes de qualquer
  // outra validação de campo.
  if (!criacaoProjetoHabilitada()) {
    redirect(
      `/projetos/novo?error=${encodeURIComponent(
        "Criação de novos projetos está temporariamente desativada.",
      )}`,
    );
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const cliente = String(formData.get("cliente") ?? "").trim() || null;
  const termoEspecifico =
    String(formData.get("termo_especifico") ?? "").trim() || null;

  if (!nome) {
    redirect(`/projetos/novo?error=${encodeURIComponent("Nome é obrigatório.")}`);
  }

  const supabase = await createClient();
  const slug = await gerarSlugUnico("projetos", null, nome);
  const { data: projeto, error } = await supabase
    .from("projetos")
    .insert({
      nome,
      descricao,
      cliente,
      termo_especifico: termoEspecifico,
      criado_por: user.id,
      slug,
    })
    .select("id")
    .single();

  if (error || !projeto) {
    redirect(
      `/projetos/novo?error=${encodeURIComponent(error?.message ?? "Não foi possível criar o projeto.")}`,
    );
  }

  // Modelo Conceitual §3/§3.1: quem cria o projeto vira automaticamente seu
  // proprietário em ProjetoProfessor — sem essa linha, RLS bloqueia o
  // próprio criador de editar etapas/missões do projeto que acabou de criar.
  const { error: vinculoError } = await supabase.from("projeto_professores").insert({
    projeto_id: projeto.id,
    professor_id: user.id,
    papel_no_projeto: "proprietario",
    adicionado_por: user.id,
  });

  if (vinculoError) {
    redirect(
      `/projetos/novo?error=${encodeURIComponent(
        "Projeto criado, mas houve um erro ao vincular você como proprietário: " +
          vinculoError.message,
      )}`,
    );
  }

  redirect("/projetos");
}

export async function atualizarProjeto(formData: FormData) {
  await requireProfessor();

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const cliente = String(formData.get("cliente") ?? "").trim() || null;
  const termoEspecifico =
    String(formData.get("termo_especifico") ?? "").trim() || null;

  const supabase = await createClient();

  if (!nome) {
    const slug = await buscarSlugPorId(supabase, "projetos", id);
    redirect(
      `/projetos/${slug}/editar?error=${encodeURIComponent("Nome é obrigatório.")}`,
    );
  }

  const { error } = await supabase
    .from("projetos")
    .update({ nome, descricao, cliente, termo_especifico: termoEspecifico })
    .eq("id", id);

  if (error) {
    const slug = await buscarSlugPorId(supabase, "projetos", id);
    redirect(`/projetos/${slug}/editar?error=${encodeURIComponent(error.message)}`);
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
