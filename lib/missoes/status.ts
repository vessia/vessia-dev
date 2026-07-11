// Implementa a regra de 04 - Modelo Conceitual.md, seção 5 — status da
// Missão nunca é armazenado, sempre calculado a partir de concluida_em,
// dependências e participações.
export type StatusMissao = "concluida" | "bloqueada" | "em_andamento" | "disponivel";

export function calcularStatusMissao({
  concluidaEm,
  todasDependenciasConcluidas,
  temParticipacao,
}: {
  concluidaEm: string | null;
  todasDependenciasConcluidas: boolean;
  temParticipacao: boolean;
}): StatusMissao {
  if (concluidaEm) return "concluida";
  if (!todasDependenciasConcluidas) return "bloqueada";
  if (temParticipacao) return "em_andamento";
  return "disponivel";
}

export const STATUS_MISSAO_INFO: Record<
  StatusMissao,
  { label: string; icone: string; className: string }
> = {
  disponivel: {
    label: "Disponível",
    icone: "🟢",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  bloqueada: {
    label: "Bloqueada",
    icone: "🔒",
    className: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
  em_andamento: {
    label: "Em andamento",
    icone: "🟡",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  concluida: {
    label: "Concluída",
    icone: "✅",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
};
