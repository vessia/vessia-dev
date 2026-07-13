// 3 itens fixos no código (ver DECISIONS.md) — Etapa 0 de
// 03 - Projeto Bíblia 3D.md, textos baseados nos conceitos de 01 - Visão.md.
export const ITENS_ONBOARDING = [
  {
    chave: "conheca_empresa",
    titulo: "Conheça a Vessia",
    texto:
      "A Vessia não é um gerenciador de tarefas — é um ambiente de aprendizagem baseado em projetos reais para clientes reais. Aqui você não fica esperando alguém te dizer o que fazer: a plataforma sempre mostra, com clareza, o que já pode ser feito agora. E o professor não precisa carregar na cabeça o estado de cada aluno — ele acompanha tudo por aqui também.",
  },
  {
    chave: "como_funcionam_missoes",
    titulo: "Como funcionam as missões",
    texto:
      "Todo projeto é organizado em Etapas, e cada Etapa tem Missões — a menor unidade de trabalho, sempre com um objetivo, uma entrega esperada e um critério de avaliação claros. Uma missão só fica disponível quando as missões das quais ela depende já foram concluídas. Não existe kanban nem backlog aqui: existe um mapa de missões — bloqueadas ou disponíveis — que você percorre conforme avança.",
  },
  {
    chave: "como_entregar_aprovacao",
    titulo: "Como entregar e como funciona a aprovação",
    texto:
      "Ao participar de uma missão, você executa o trabalho e registra sua entrega na plataforma. O professor então decide: aprovar, aprovar com ressalvas (aprovado, mas com um feedback sobre o que poderia melhorar), ou rejeitar. Se for rejeitada, você recebe um feedback obrigatório e pode reenviar, dentro do limite de tentativas da missão. Se esgotar as tentativas, é hora de pedir ajuda ao professor diretamente.",
  },
] as const;

export type ChaveOnboarding = (typeof ITENS_ONBOARDING)[number]["chave"];
