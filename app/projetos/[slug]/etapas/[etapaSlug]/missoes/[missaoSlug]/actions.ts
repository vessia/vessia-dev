"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAluno, requireProfessor } from "@/lib/auth/dal";
import { buscarMissoesComStatus } from "@/lib/missoes/buscar";
import {
  podeEnviarEntrega,
  podeParticipar,
  precisaAceitarTermoEspecifico,
} from "@/lib/participacoes/validacoes";
import { validarArquivoEntrega } from "@/lib/entregas/validacao-arquivo";
import { buscarSlugPorId } from "@/lib/slugs/buscar";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function caminhoMissao(
  supabase: SupabaseServerClient,
  projetoId: string,
  etapaId: string,
  missaoId: string,
) {
  const [projetoSlug, etapaSlug, missaoSlug] = await Promise.all([
    buscarSlugPorId(supabase, "projetos", projetoId),
    buscarSlugPorId(supabase, "etapas", etapaId),
    buscarSlugPorId(supabase, "missoes", missaoId),
  ]);
  return `/projetos/${projetoSlug}/etapas/${etapaSlug}/missoes/${missaoSlug}`;
}

export async function participar(formData: FormData) {
  const user = await requireAluno();

  const projetoId = String(formData.get("projeto_id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const missaoId = String(formData.get("missao_id") ?? "");
  const supabase = await createClient();
  const destino = await caminhoMissao(supabase, projetoId, etapaId, missaoId);

  const { data: missao } = await supabase
    .from("missoes")
    .select("id, vagas")
    .eq("id", missaoId)
    .single();

  if (!missao) {
    redirect(`${destino}?error=${encodeURIComponent("Missão não encontrada.")}`);
  }

  // Reaproveita o mesmo cálculo de status usado no mapa/detalhe — não pode
  // divergir entre "o que a tela mostrou" e "o que o servidor valida".
  const missoesComStatus = await buscarMissoesComStatus(supabase, etapaId);
  const missaoAtual = missoesComStatus.find((m) => m.id === missaoId);

  const { count: participacoesExistentes } = await supabase
    .from("participacoes")
    .select("*", { count: "exact", head: true })
    .eq("missao_id", missaoId);

  const { data: participacaoDoAluno } = await supabase
    .from("participacoes")
    .select("id")
    .eq("missao_id", missaoId)
    .eq("aluno_id", user.id)
    .maybeSingle();

  // DECISIONS.md, "Termo específico por Projeto": revalida aqui mesmo que a
  // tela já esconda o botão "Participar" quando o termo está pendente —
  // mesma checagem (não duplicada), usada também pra decidir o que a tela
  // mostra.
  const { data: projeto } = await supabase
    .from("projetos")
    .select("termo_especifico")
    .eq("id", projetoId)
    .single();

  const { data: vinculoAluno } = await supabase
    .from("projeto_alunos")
    .select("termo_aceito_em")
    .eq("projeto_id", projetoId)
    .eq("aluno_id", user.id)
    .maybeSingle();

  const resultado = podeParticipar({
    statusMissao: missaoAtual?.status ?? "bloqueada",
    vagas: missao.vagas,
    participacoesExistentes: participacoesExistentes ?? 0,
    jaParticipa: Boolean(participacaoDoAluno),
    termoPendente: precisaAceitarTermoEspecifico({
      termoEspecifico: projeto?.termo_especifico ?? null,
      termoAceitoEm: vinculoAluno?.termo_aceito_em ?? null,
    }),
  });

  if (!resultado.permitido) {
    redirect(`${destino}?error=${encodeURIComponent(resultado.motivo)}`);
  }

  const { error } = await supabase.from("participacoes").insert({
    missao_id: missaoId,
    aluno_id: user.id,
  });

  if (error) {
    // Rede de segurança contra corrida (dois cliques quase simultâneos) —
    // o unique(missao_id, aluno_id) do banco pega o que a checagem
    // proativa acima possa ter deixado passar.
    const mensagem =
      error.code === "23505"
        ? "Você já participa dessa missão."
        : error.message;
    redirect(`${destino}?error=${encodeURIComponent(mensagem)}`);
  }

  redirect(destino);
}

export async function marcarConcluida(formData: FormData) {
  const user = await requireProfessor();

  const projetoId = String(formData.get("projeto_id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const missaoId = String(formData.get("missao_id") ?? "");
  const supabase = await createClient();
  const destino = await caminhoMissao(supabase, projetoId, etapaId, missaoId);

  // DECISIONS.md: conclusão de missão é sempre manual, decisão pedagógica
  // do professor — não depende de nenhuma Participação específica estar
  // aprovada, mesmo com múltiplas vagas.
  const { error } = await supabase
    .from("missoes")
    .update({ concluida_em: new Date().toISOString(), concluida_por: user.id })
    .eq("id", missaoId);

  if (error) {
    redirect(`${destino}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(destino);
}

export async function enviarEntrega(formData: FormData) {
  const user = await requireAluno();

  const projetoId = String(formData.get("projeto_id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const missaoId = String(formData.get("missao_id") ?? "");
  const participacaoId = String(formData.get("participacao_id") ?? "");
  const tipoConteudo = String(formData.get("tipo_conteudo") ?? "");
  const supabase = await createClient();
  const destino = await caminhoMissao(supabase, projetoId, etapaId, missaoId);

  if (
    tipoConteudo !== "texto" &&
    tipoConteudo !== "link" &&
    tipoConteudo !== "arquivo"
  ) {
    redirect(`${destino}?error=${encodeURIComponent("Selecione o tipo de conteúdo.")}`);
  }

  let conteudo = "";
  let arquivo: File | null = null;

  if (tipoConteudo === "arquivo") {
    const candidato = formData.get("arquivo");
    if (!(candidato instanceof File) || candidato.size === 0) {
      redirect(`${destino}?error=${encodeURIComponent("Selecione um arquivo para enviar.")}`);
    }

    const validacao = validarArquivoEntrega({
      tipo: candidato.type,
      tamanhoBytes: candidato.size,
    });

    if (!validacao.permitido) {
      redirect(`${destino}?error=${encodeURIComponent(validacao.motivo)}`);
    }

    arquivo = candidato;
  } else {
    conteudo = String(formData.get("conteudo") ?? "").trim();
    if (!conteudo) {
      redirect(`${destino}?error=${encodeURIComponent("Preencha o conteúdo da entrega.")}`);
    }
  }

  const { data: participacao } = await supabase
    .from("participacoes")
    .select("id, status, aluno_id, missao_id")
    .eq("id", participacaoId)
    .single();

  if (!participacao || participacao.aluno_id !== user.id) {
    redirect(`${destino}?error=${encodeURIComponent("Participação não encontrada.")}`);
  }

  const { data: missao } = await supabase
    .from("missoes")
    .select("limite_reenvios")
    .eq("id", missaoId)
    .single();

  if (!missao) {
    redirect(`${destino}?error=${encodeURIComponent("Missão não encontrada.")}`);
  }

  const { count: entregasExistentes } = await supabase
    .from("entregas")
    .select("*", { count: "exact", head: true })
    .eq("participacao_id", participacaoId);

  const resultado = podeEnviarEntrega({
    statusParticipacao: participacao.status,
    entregasExistentes: entregasExistentes ?? 0,
    limiteReenvios: missao.limite_reenvios,
  });

  if (!resultado.permitido) {
    redirect(`${destino}?error=${encodeURIComponent(resultado.motivo)}`);
  }

  if (arquivo) {
    // Convenção de path: docs/009_storage_entregas_imagens.sql —
    // {aluno_id}/{participacao_id}/{numero_tentativa}/{nome_arquivo}.
    const nomeArquivo = arquivo.name
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${participacaoId}/${resultado.numeroTentativa}/${nomeArquivo}`;

    const { error: uploadError } = await supabase.storage
      .from("entregas-arquivos")
      .upload(path, arquivo, { contentType: arquivo.type, upsert: false });

    if (uploadError) {
      redirect(
        `${destino}?error=${encodeURIComponent(
          "Não foi possível enviar o arquivo: " + uploadError.message,
        )}`,
      );
    }

    conteudo = path;
  }

  const { error: entregaError } = await supabase.from("entregas").insert({
    participacao_id: participacaoId,
    conteudo,
    tipo_conteudo: tipoConteudo,
    numero_tentativa: resultado.numeroTentativa,
  });

  if (entregaError) {
    redirect(`${destino}?error=${encodeURIComponent(entregaError.message)}`);
  }

  // Modelo Conceitual §8: ao ser criada, a Entrega muda o status da
  // Participação para 'em_aprovacao'. Exige a policy de update em
  // docs/003_participacoes_update_policy.sql.
  const { error: statusError } = await supabase
    .from("participacoes")
    .update({ status: "em_aprovacao" })
    .eq("id", participacaoId);

  if (statusError) {
    redirect(
      `${destino}?error=${encodeURIComponent(
        "Entrega registrada, mas houve um erro ao atualizar o status: " +
          statusError.message,
      )}`,
    );
  }

  redirect(destino);
}
