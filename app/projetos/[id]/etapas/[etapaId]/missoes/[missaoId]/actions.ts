"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAluno, requireProfessor } from "@/lib/auth/dal";
import { buscarMissoesComStatus } from "@/lib/missoes/buscar";
import { podeEnviarEntrega, podeParticipar } from "@/lib/participacoes/validacoes";

function caminhoMissao(projetoId: string, etapaId: string, missaoId: string) {
  return `/projetos/${projetoId}/etapas/${etapaId}/missoes/${missaoId}`;
}

export async function participar(formData: FormData) {
  const user = await requireAluno();

  const projetoId = String(formData.get("projeto_id") ?? "");
  const etapaId = String(formData.get("etapa_id") ?? "");
  const missaoId = String(formData.get("missao_id") ?? "");
  const destino = caminhoMissao(projetoId, etapaId, missaoId);

  const supabase = await createClient();

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

  const resultado = podeParticipar({
    statusMissao: missaoAtual?.status ?? "bloqueada",
    vagas: missao.vagas,
    participacoesExistentes: participacoesExistentes ?? 0,
    jaParticipa: Boolean(participacaoDoAluno),
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
  const destino = caminhoMissao(projetoId, etapaId, missaoId);

  const supabase = await createClient();

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
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  const tipoConteudo = String(formData.get("tipo_conteudo") ?? "");
  const destino = caminhoMissao(projetoId, etapaId, missaoId);

  if (!conteudo) {
    redirect(`${destino}?error=${encodeURIComponent("Preencha o conteúdo da entrega.")}`);
  }

  if (tipoConteudo !== "texto" && tipoConteudo !== "link") {
    redirect(`${destino}?error=${encodeURIComponent("Selecione o tipo de conteúdo.")}`);
  }

  const supabase = await createClient();

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
