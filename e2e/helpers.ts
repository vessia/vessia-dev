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

// Bloco 12: desde a migration 006, RLS de projetos/etapas/missoes/etc. é
// escopada por vínculo (projeto_professores/projeto_alunos), não mais por
// "qualquer professor" / "leitura geral". Todo projeto de teste precisa do
// proprietário vinculado pra ficar visível ao professor de teste; passe
// `alunoAceitoId` quando o teste também precisar que o aluno de teste
// participe (RLS exige status 'aceito' em projeto_alunos pra isso).
export async function criarProjetoDeTeste(
  criadoPor: string,
  nome: string,
  opcoes?: { alunoAceitoId?: string; termoEspecifico?: string },
) {
  const { data, error } = await supabaseAdmin
    .from("projetos")
    .insert({
      nome,
      criado_por: criadoPor,
      termo_especifico: opcoes?.termoEspecifico ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Falha ao criar projeto de teste: ${error?.message}`);
  }

  const projetoId = data.id as string;

  const { error: professorError } = await supabaseAdmin
    .from("projeto_professores")
    .insert({
      projeto_id: projetoId,
      professor_id: criadoPor,
      papel_no_projeto: "proprietario",
      adicionado_por: criadoPor,
    });

  if (professorError) {
    throw new Error(
      `Falha ao vincular professor de teste ao projeto: ${professorError.message}`,
    );
  }

  if (opcoes?.alunoAceitoId) {
    const { error: alunoError } = await supabaseAdmin
      .from("projeto_alunos")
      .insert({
        projeto_id: projetoId,
        aluno_id: opcoes.alunoAceitoId,
        status: "aceito",
        atribuido_por: criadoPor,
        respondido_em: new Date().toISOString(),
      });

    if (alunoError) {
      throw new Error(
        `Falha ao vincular aluno de teste ao projeto: ${alunoError.message}`,
      );
    }
  }

  return projetoId;
}

// Seeds diretos das tabelas de vínculo do Bloco 12 — usados quando o teste
// quer partir de um estado já pronto (ex: testar "remover colaborador" sem
// precisar re-testar o fluxo de "adicionar" pela UI a cada vez).
export async function adicionarColaboradorDeTeste(
  projetoId: string,
  professorId: string,
  adicionadoPor: string,
) {
  const { error } = await supabaseAdmin.from("projeto_professores").insert({
    projeto_id: projetoId,
    professor_id: professorId,
    papel_no_projeto: "colaborador",
    adicionado_por: adicionadoPor,
  });

  if (error) {
    throw new Error(`Falha ao adicionar colaborador de teste: ${error.message}`);
  }
}

export async function atribuirAlunoDeTeste(
  projetoId: string,
  alunoId: string,
  atribuidoPor: string,
) {
  const { error } = await supabaseAdmin.from("projeto_alunos").insert({
    projeto_id: projetoId,
    aluno_id: alunoId,
    status: "convidado",
    atribuido_por: atribuidoPor,
  });

  if (error) {
    throw new Error(`Falha ao atribuir aluno de teste: ${error.message}`);
  }
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
