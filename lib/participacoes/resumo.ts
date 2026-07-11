export type StatusParticipacao = "em_andamento" | "em_aprovacao" | "concluida";
export type ResultadoAvaliacao =
  | "aprovada"
  | "aprovada_com_ressalvas"
  | "rejeitada";

export type ResumoParticipacoes = {
  aprovadas: number;
  comRessalvas: number;
  rejeitadas: number;
  pendentes: number;
  semEntrega: number;
};

// Contexto pra ajudar o professor a decidir "marcar missão como concluída"
// (04 - Modelo Conceitual.md §5 + DECISIONS.md — decisão manual, sem regra
// automática). Classifica cada Participação pelo resultado da sua
// avaliação mais recente; "pendente" é quem está em_aprovacao agora.
export function resumirParticipacoes(
  participacoes: {
    status: StatusParticipacao;
    ultimoResultado: ResultadoAvaliacao | null;
  }[],
): ResumoParticipacoes {
  const resumo: ResumoParticipacoes = {
    aprovadas: 0,
    comRessalvas: 0,
    rejeitadas: 0,
    pendentes: 0,
    semEntrega: 0,
  };

  for (const p of participacoes) {
    if (p.status === "em_aprovacao") {
      resumo.pendentes++;
      continue;
    }
    if (p.ultimoResultado === "aprovada") {
      resumo.aprovadas++;
      continue;
    }
    if (p.ultimoResultado === "aprovada_com_ressalvas") {
      resumo.comRessalvas++;
      continue;
    }
    if (p.ultimoResultado === "rejeitada") {
      resumo.rejeitadas++;
      continue;
    }
    resumo.semEntrega++;
  }

  return resumo;
}
