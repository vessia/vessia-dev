// Definições copiadas de 01 - Visão.md, seção 4 (Conceitos) — não
// reescrever do zero aqui; se o texto mudar, muda lá primeiro (DECISIONS.md:
// "copy centralizado, para não haver definições divergentes do mesmo
// conceito em lugares diferentes").
export const CONCEITOS = {
  missao:
    "Menor unidade de trabalho. Toda missão possui quatro elementos obrigatórios: objetivo (por que ela existe), entrega (o que deve ser produzido), critério de avaliação (como será julgada) e dependências (o que precisa estar concluído antes, e o que ela desbloqueia depois).",
  vagas:
    "Um aluno não assume uma missão como dono exclusivo — ele participa dela. Uma missão pode ter várias vagas, e cada aluno que participa tem sua própria entrega e seu próprio status de aprovação, independente dos demais participantes.",
  etapa:
    "Representa um marco do projeto. Organiza missões relacionadas e serve como indicador de progresso. Uma etapa é considerada concluída quando todas as missões obrigatórias pertencentes a ela estiverem aprovadas (com ou sem ressalvas).",
  dependencia:
    "Define quais missões precisam estar concluídas — e aprovadas — antes que outra possa ser iniciada. Dependências são definidas entre missões específicas, não entre etapas inteiras.",
  statusBloqueada: "Bloqueada: ainda depende de outra missão ser concluída e aprovada antes de poder começar.",
  statusDisponivel: "Disponível: nenhuma dependência pendente — já pode ser iniciada.",
  statusEmAndamento: "Em andamento: já tem participação e a entrega ainda não foi enviada para avaliação.",
  statusEmAprovacao: "Em aprovação: a entrega já foi enviada e está aguardando a decisão do professor.",
  statusConcluida: "Concluída: já foi aprovada (com ou sem ressalvas) pelo professor.",
} as const;
