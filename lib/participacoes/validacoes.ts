import type { StatusMissao } from "@/lib/missoes/status";

export type ResultadoValidacao =
  | { permitido: true }
  | { permitido: false; motivo: string; termoPendente?: true };

// DECISIONS.md, "Termo específico por Projeto": se o projeto define um
// termo, o aluno precisa aceitá-lo (registrando a data em
// projeto_alunos.termo_aceito_em) antes de conseguir participar de
// qualquer missão daquele projeto — aceite é por projeto, não por missão.
// Compartilhada entre a tela (decide se mostra o bloco de aceite) e a
// Server Action de participar (revalida), pra não duplicar a regra.
export function precisaAceitarTermoEspecifico({
  termoEspecifico,
  termoAceitoEm,
}: {
  termoEspecifico: string | null;
  termoAceitoEm: string | null;
}): boolean {
  return Boolean(termoEspecifico) && !termoAceitoEm;
}

// 04 - Modelo Conceitual.md, seção 7: uma Participação só pode ser criada
// (a) se o termo específico do projeto (quando existir) já foi aceito,
// (b) se o aluno ainda não participa dessa missão, (c) em missão disponível
// ou em andamento (nunca bloqueada/concluída), e (d) se ainda houver vaga.
// DECISIONS.md, "Missão pode ter vagas ilimitadas": vagas null = sem teto,
// a checagem de vaga disponível é ignorada nesse caso.
export function podeParticipar({
  statusMissao,
  vagas,
  participacoesExistentes,
  jaParticipa,
  termoPendente,
}: {
  statusMissao: StatusMissao;
  vagas: number | null;
  participacoesExistentes: number;
  jaParticipa: boolean;
  termoPendente: boolean;
}): ResultadoValidacao {
  if (termoPendente) {
    return {
      permitido: false,
      motivo: "Aceite o termo específico deste projeto antes de participar.",
      termoPendente: true,
    };
  }

  if (jaParticipa) {
    return { permitido: false, motivo: "Você já participa dessa missão." };
  }

  if (statusMissao !== "disponivel" && statusMissao !== "em_andamento") {
    return {
      permitido: false,
      motivo: "Essa missão não está disponível para participação.",
    };
  }

  if (vagas !== null && participacoesExistentes >= vagas) {
    return {
      permitido: false,
      motivo: "Não há mais vagas disponíveis nesta missão.",
    };
  }

  return { permitido: true };
}

export type ResultadoValidacaoEntrega =
  | { permitido: true; numeroTentativa: number }
  | { permitido: false; motivo: string };

// 04 - Modelo Conceitual.md, seção 7/8: uma Entrega só pode ser enviada (a)
// enquanto a Participação estiver "em_andamento" (não em aprovação nem
// concluída), e (b) se o número de Entregas ainda não atingiu o
// limite_reenvios da missão.
export function podeEnviarEntrega({
  statusParticipacao,
  entregasExistentes,
  limiteReenvios,
}: {
  statusParticipacao: "em_andamento" | "em_aprovacao" | "concluida";
  entregasExistentes: number;
  limiteReenvios: number;
}): ResultadoValidacaoEntrega {
  if (statusParticipacao !== "em_andamento") {
    return {
      permitido: false,
      motivo: "Essa participação não está aguardando entrega no momento.",
    };
  }

  if (entregasExistentes >= limiteReenvios) {
    return {
      permitido: false,
      motivo:
        "Limite de reenvios atingido. Aguarde uma intervenção do professor.",
    };
  }

  return { permitido: true, numeroTentativa: entregasExistentes + 1 };
}

export const RESULTADOS_AVALIACAO = [
  "aprovada",
  "aprovada_com_ressalvas",
  "rejeitada",
] as const;

export type ResultadoAvaliacao = (typeof RESULTADOS_AVALIACAO)[number];

// 001_initial_schema.sql já bloqueia isso via check constraint
// (resultado <> 'rejeitada' or feedback is not null) — validar aqui antes
// do insert dá uma mensagem amigável em vez do erro cru do Postgres.
export function validarAvaliacao({
  resultado,
  feedback,
  jaAvaliada,
}: {
  resultado: string;
  feedback: string;
  jaAvaliada: boolean;
}): ResultadoValidacao {
  if (jaAvaliada) {
    return { permitido: false, motivo: "Essa entrega já foi avaliada." };
  }

  if (!RESULTADOS_AVALIACAO.includes(resultado as ResultadoAvaliacao)) {
    return { permitido: false, motivo: "Selecione um resultado válido." };
  }

  if (resultado === "rejeitada" && !feedback.trim()) {
    return {
      permitido: false,
      motivo: "Feedback é obrigatório ao rejeitar uma entrega.",
    };
  }

  return { permitido: true };
}
