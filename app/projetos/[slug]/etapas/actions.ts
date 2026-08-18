"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessor } from "@/lib/auth/dal";
import { gerarSlugUnico } from "@/lib/slugs/unico";
import { buscarSlugPorId } from "@/lib/slugs/buscar";
import { validarArquivoEntrega } from "@/lib/entregas/validacao-arquivo";
import {
  inserirAnexoArquivo,
  inserirAnexoLink,
} from "@/lib/arquivos/inserir-anexo";

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

// DECISIONS.md, "Conclusão manual de Etapa, com resumo + anexos/links":
// resumo é opcional (só o professor "fechando" a etapa já é o fato
// relevante), assim como o arquivo e o link — nenhum dos três é obrigatório
// pra concluir. Validação de arquivo, path de upload e geração de URL
// assinada na leitura reaproveitam exatamente o mesmo fluxo já usado no
// upload de entrega (mesmo bucket 'entregas-arquivos').
export async function concluirEtapa(formData: FormData) {
  const user = await requireProfessor();

  const projetoId = String(formData.get("projeto_id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const resumo =
    String(formData.get("resumo_encerramento") ?? "").trim() || null;
  const anexoUrl = String(formData.get("anexo_url") ?? "").trim();
  const anexoNome =
    String(formData.get("anexo_nome") ?? "").trim() || anexoUrl;

  const supabase = await createClient();
  const projetoSlug = await buscarSlugPorId(supabase, "projetos", projetoId);
  const etapaSlug = await buscarSlugPorId(supabase, "etapas", etapaId);
  const destino = `/projetos/${projetoSlug}/etapas/${etapaSlug}`;

  let arquivo: File | null = null;
  const candidato = formData.get("arquivo");
  if (candidato instanceof File && candidato.size > 0) {
    const validacao = validarArquivoEntrega({
      tipo: candidato.type,
      tamanhoBytes: candidato.size,
    });

    if (!validacao.permitido) {
      redirect(`${destino}?error=${encodeURIComponent(validacao.motivo)}`);
    }

    arquivo = candidato;
  }

  const { error } = await supabase
    .from("etapas")
    .update({
      concluida_em: new Date().toISOString(),
      concluida_por: user.id,
      resumo_encerramento: resumo,
    })
    .eq("id", etapaId);

  if (error) {
    redirect(`${destino}?error=${encodeURIComponent(mensagemDeErro(error))}`);
  }

  if (arquivo) {
    // Convenção de path própria de anexo de etapa (não tem "participação"
    // nem "número de tentativa" como em Entrega): {professor_id}/etapas/
    // {etapa_id}/{timestamp}_{nome_arquivo}. O primeiro segmento precisa ser
    // o auth.uid() de quem envia (docs/009_storage_entregas_imagens.sql).
    const nomeArquivo = arquivo.name
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/etapas/${etapaId}/${Date.now()}_${nomeArquivo}`;

    const { error: uploadError } = await supabase.storage
      .from("entregas-arquivos")
      .upload(path, arquivo, { contentType: arquivo.type, upsert: false });

    if (uploadError) {
      redirect(
        `${destino}?error=${encodeURIComponent(
          "Etapa concluída, mas não foi possível enviar o arquivo: " +
            uploadError.message,
        )}`,
      );
    }

    await inserirAnexoArquivo(supabase, {
      donoTipo: "etapa",
      donoId: etapaId,
      userId: user.id,
      nome: arquivo.name,
      path,
    });
  }

  if (anexoUrl) {
    await inserirAnexoLink(supabase, {
      donoTipo: "etapa",
      donoId: etapaId,
      userId: user.id,
      url: anexoUrl,
      nome: anexoNome,
    });
  }

  redirect(destino);
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
