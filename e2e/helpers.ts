import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { supabaseAdmin } from "./supabase-admin";

const STATE_PATH = path.resolve(__dirname, ".auth/state.json");

export type UsuarioTeste = {
  id: string;
  email: string;
  password: string;
  nome: string;
  papel: "professor" | "aluno";
};

export function lerUsuariosDeTeste(): {
  professor: UsuarioTeste;
  aluno: UsuarioTeste;
} {
  return JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
}

export async function loginViaUI(
  page: Page,
  usuario: { email: string; password: string },
) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(usuario.email);
  await page.getByLabel("Senha").fill(usuario.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard");
}

export async function criarProjetoDeTeste(criadoPor: string, nome: string) {
  const { data, error } = await supabaseAdmin
    .from("projetos")
    .insert({ nome, criado_por: criadoPor })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Falha ao criar projeto de teste: ${error?.message}`);
  }

  return data.id as string;
}

export async function criarEtapaDeTeste(
  projetoId: string,
  nome: string,
  ordem: number,
) {
  const { data, error } = await supabaseAdmin
    .from("etapas")
    .insert({ projeto_id: projetoId, nome, ordem })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Falha ao criar etapa de teste: ${error?.message}`);
  }

  return data.id as string;
}

export async function criarMissaoDeTeste(
  etapaId: string,
  titulo: string,
  opcoes?: { prazo?: string },
) {
  const { data, error } = await supabaseAdmin
    .from("missoes")
    .insert({
      etapa_id: etapaId,
      titulo,
      tipo: "estudar",
      objetivo: "Objetivo de teste",
      entrega_esperada: "Entrega de teste",
      criterio_avaliacao: "Critério de teste",
      prazo: opcoes?.prazo,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Falha ao criar missão de teste: ${error?.message}`);
  }

  return data.id as string;
}

export async function criarDependenciaDeTeste(
  missaoId: string,
  dependeDeId: string,
) {
  const { error } = await supabaseAdmin
    .from("missao_dependencias")
    .insert({ missao_id: missaoId, depende_de_id: dependeDeId });

  if (error) {
    throw new Error(`Falha ao criar dependência de teste: ${error.message}`);
  }
}

export async function marcarMissaoConcluidaDeTeste(
  missaoId: string,
  professorId: string,
) {
  const { error } = await supabaseAdmin
    .from("missoes")
    .update({ concluida_em: new Date().toISOString(), concluida_por: professorId })
    .eq("id", missaoId);

  if (error) {
    throw new Error(`Falha ao marcar missão de teste como concluída: ${error.message}`);
  }
}

export async function criarParticipacaoDeTeste(
  missaoId: string,
  alunoId: string,
  status: "em_andamento" | "em_aprovacao" | "concluida" = "em_andamento",
) {
  const { data, error } = await supabaseAdmin
    .from("participacoes")
    .insert({ missao_id: missaoId, aluno_id: alunoId, status })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Falha ao criar participação de teste: ${error?.message}`);
  }

  return data.id as string;
}

export async function criarEntregaDeTeste(
  participacaoId: string,
  numeroTentativa: number,
) {
  const { data, error } = await supabaseAdmin
    .from("entregas")
    .insert({
      participacao_id: participacaoId,
      conteudo: "Conteúdo de teste",
      tipo_conteudo: "texto",
      numero_tentativa: numeroTentativa,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Falha ao criar entrega de teste: ${error?.message}`);
  }

  return data.id as string;
}

export async function buscarAvaliacao(entregaId: string) {
  const { data } = await supabaseAdmin
    .from("avaliacoes")
    .select("resultado, feedback")
    .eq("entrega_id", entregaId)
    .maybeSingle();

  return data;
}

export async function contarEntregas(participacaoId: string) {
  const { count } = await supabaseAdmin
    .from("entregas")
    .select("*", { count: "exact", head: true })
    .eq("participacao_id", participacaoId);

  return count ?? 0;
}

export async function buscarStatusParticipacao(participacaoId: string) {
  const { data } = await supabaseAdmin
    .from("participacoes")
    .select("status")
    .eq("id", participacaoId)
    .single();

  return data?.status as string | undefined;
}

export async function contarDependencias(missaoId: string, dependeDeId: string) {
  const { count } = await supabaseAdmin
    .from("missao_dependencias")
    .select("*", { count: "exact", head: true })
    .eq("missao_id", missaoId)
    .eq("depende_de_id", dependeDeId);

  return count ?? 0;
}
