"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessor } from "@/lib/auth/dal";
import { TIPOS_MISSAO } from "@/lib/missoes/constantes";
import {
  buscarGrafoDependencias,
  encontrarDependenciaCiclica,
} from "@/lib/missoes/dependencias";
import { gerarSlugUnico } from "@/lib/slugs/unico";
import { buscarSlugPorId } from "@/lib/slugs/buscar";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const TIPOS_VALIDOS = new Set<string>(TIPOS_MISSAO.map((t) => t.value));

function lerCamposMissao(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const tipo = String(formData.get("tipo") ?? "");
  const objetivo = String(formData.get("objetivo") ?? "").trim();
  const entregaEsperada = String(formData.get("entrega_esperada") ?? "").trim();
  const criterioAvaliacao = String(
    formData.get("criterio_avaliacao") ?? "",
  ).trim();
  const prazoRaw = String(formData.get("prazo") ?? "");
  const prazo = prazoRaw ? new Date(prazoRaw).toISOString() : null;
  const vagasRaw = String(formData.get("vagas") ?? "").trim();
  const vagas = vagasRaw ? Number(vagasRaw) : null;
  const obrigatoria = formData.get("obrigatoria") === "on";
  const limiteReenvios = Number(formData.get("limite_reenvios") ?? "1");
  const dependencias = formData.getAll("dependencias").map(String);

  return {
    titulo,
    descricao,
    tipo,
    objetivo,
    entregaEsperada,
    criterioAvaliacao,
    prazo,
    vagas,
    obrigatoria,
    limiteReenvios,
    dependencias,
  };
}

function validarCamposMissao(
  campos: ReturnType<typeof lerCamposMissao>,
): string | null {
  if (!campos.titulo) return "Título é obrigatório.";
  if (!TIPOS_VALIDOS.has(campos.tipo)) return "Selecione um tipo válido.";
  if (!campos.objetivo) return "Objetivo é obrigatório.";
  if (!campos.entregaEsperada) return "Entrega esperada é obrigatória.";
  if (!campos.criterioAvaliacao) return "Critério de avaliação é obrigatório.";
  if (
    campos.vagas !== null &&
    (!Number.isFinite(campos.vagas) || campos.vagas < 1)
  ) {
    return "Vagas deve ser pelo menos 1, ou em branco para sem limite.";
  }
  if (!Number.isFinite(campos.limiteReenvios) || campos.limiteReenvios < 0) {
    return "Limite de reenvios não pode ser negativo.";
  }
  return null;
}

async function salvarAnexoLink(
  supabase: SupabaseServerClient,
  missaoId: string,
  userId: string,
  formData: FormData,
) {
  const url = String(formData.get("anexo_url") ?? "").trim();
  if (!url) return;

  const nome = String(formData.get("anexo_nome") ?? "").trim() || url;

  await supabase.from("arquivos").insert({
    dono_tipo: "missao",
    dono_id: missaoId,
    nome,
    url,
    tipo: "link",
    enviado_por: userId,
  });
}

export async function criarMissao(formData: FormData) {
  const user = await requireProfessor();

  const projetoId = String(formData.get("projeto_id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const campos = lerCamposMissao(formData);

  const supabase = await createClient();
  const projetoSlug = await buscarSlugPorId(supabase, "projetos", projetoId);
  const etapaSlug = await buscarSlugPorId(supabase, "etapas", etapaId);

  const erroValidacao = validarCamposMissao(campos);
  if (erroValidacao) {
    redirect(
      `/projetos/${projetoSlug}/etapas/${etapaSlug}/missoes/nova?error=${encodeURIComponent(
        erroValidacao,
      )}`,
    );
  }

  if (campos.dependencias.length > 0) {
    const grafo = await buscarGrafoDependencias(supabase, projetoId);
    // Uma missão recém-criada não pode ter ciclo (nada ainda depende dela),
    // mas passa pela mesma checagem da edição por consistência.
    const cicloId = encontrarDependenciaCiclica(
      grafo,
      "__nova__",
      campos.dependencias,
    );
    if (cicloId) {
      redirect(
        `/projetos/${projetoSlug}/etapas/${etapaSlug}/missoes/nova?error=${encodeURIComponent(
          "Essa dependência criaria um ciclo entre missões.",
        )}`,
      );
    }
  }

  const slug = await gerarSlugUnico(
    "missoes",
    { etapa_id: etapaId },
    campos.titulo,
  );

  const { data: missao, error } = await supabase
    .from("missoes")
    .insert({
      etapa_id: etapaId,
      titulo: campos.titulo,
      descricao: campos.descricao,
      tipo: campos.tipo,
      objetivo: campos.objetivo,
      entrega_esperada: campos.entregaEsperada,
      criterio_avaliacao: campos.criterioAvaliacao,
      prazo: campos.prazo,
      vagas: campos.vagas,
      obrigatoria: campos.obrigatoria,
      limite_reenvios: campos.limiteReenvios,
      slug,
    })
    .select("id")
    .single();

  if (error || !missao) {
    redirect(
      `/projetos/${projetoSlug}/etapas/${etapaSlug}/missoes/nova?error=${encodeURIComponent(
        error?.message ?? "Não foi possível criar a missão.",
      )}`,
    );
  }

  if (campos.dependencias.length > 0) {
    await supabase.from("missao_dependencias").insert(
      campos.dependencias.map((dependeDeId) => ({
        missao_id: missao.id,
        depende_de_id: dependeDeId,
      })),
    );
  }

  await salvarAnexoLink(supabase, missao.id, user.id, formData);

  redirect(`/projetos/${projetoSlug}/etapas/${etapaSlug}`);
}

export async function atualizarMissao(formData: FormData) {
  const user = await requireProfessor();

  const projetoId = String(formData.get("projeto_id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const missaoId = String(formData.get("id") ?? "");
  const campos = lerCamposMissao(formData);

  const supabase = await createClient();
  const projetoSlug = await buscarSlugPorId(supabase, "projetos", projetoId);
  const etapaSlug = await buscarSlugPorId(supabase, "etapas", etapaId);

  const erroValidacao = validarCamposMissao(campos);
  if (erroValidacao) {
    const missaoSlug = await buscarSlugPorId(supabase, "missoes", missaoId);
    redirect(
      `/projetos/${projetoSlug}/etapas/${etapaSlug}/missoes/${missaoSlug}/editar?error=${encodeURIComponent(
        erroValidacao,
      )}`,
    );
  }

  if (campos.dependencias.length > 0) {
    const grafo = await buscarGrafoDependencias(supabase, projetoId, {
      excluirMissaoId: missaoId,
    });
    const cicloId = encontrarDependenciaCiclica(
      grafo,
      missaoId,
      campos.dependencias,
    );
    if (cicloId) {
      const missaoSlug = await buscarSlugPorId(supabase, "missoes", missaoId);
      redirect(
        `/projetos/${projetoSlug}/etapas/${etapaSlug}/missoes/${missaoSlug}/editar?error=${encodeURIComponent(
          "Essa dependência criaria um ciclo entre missões — a missão escolhida já depende, direta ou indiretamente, desta aqui.",
        )}`,
      );
    }
  }

  const { error } = await supabase
    .from("missoes")
    .update({
      titulo: campos.titulo,
      descricao: campos.descricao,
      tipo: campos.tipo,
      objetivo: campos.objetivo,
      entrega_esperada: campos.entregaEsperada,
      criterio_avaliacao: campos.criterioAvaliacao,
      prazo: campos.prazo,
      vagas: campos.vagas,
      obrigatoria: campos.obrigatoria,
      limite_reenvios: campos.limiteReenvios,
    })
    .eq("id", missaoId);

  if (error) {
    const missaoSlug = await buscarSlugPorId(supabase, "missoes", missaoId);
    redirect(
      `/projetos/${projetoSlug}/etapas/${etapaSlug}/missoes/${missaoSlug}/editar?error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  await supabase.from("missao_dependencias").delete().eq("missao_id", missaoId);

  if (campos.dependencias.length > 0) {
    await supabase.from("missao_dependencias").insert(
      campos.dependencias.map((dependeDeId) => ({
        missao_id: missaoId,
        depende_de_id: dependeDeId,
      })),
    );
  }

  await salvarAnexoLink(supabase, missaoId, user.id, formData);

  redirect(`/projetos/${projetoSlug}/etapas/${etapaSlug}`);
}
