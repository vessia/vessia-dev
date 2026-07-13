export const CATEGORIAS_FEEDBACK = [
  "nao_sei_o_que_fazer",
  "muito_clique",
  "tela_confusa",
  "esta_bom",
  "outro",
] as const;

export type CategoriaFeedback = (typeof CATEGORIAS_FEEDBACK)[number];

export const CATEGORIA_FEEDBACK_LABEL: Record<CategoriaFeedback, string> = {
  nao_sei_o_que_fazer: "Não sei o que fazer",
  muito_clique: "Muito clique pra pouca coisa",
  tela_confusa: "Tela confusa",
  esta_bom: "Está bom",
  outro: "Outro",
};

export type ResultadoValidacaoFeedback =
  | { permitido: true }
  | { permitido: false; motivo: string };

// DECISIONS.md, "Widget de feedback guiado": só duas perguntas fixas são
// obrigatórias (avaliação 1-5 e categoria) — o comentário é sempre opcional.
export function validarFeedback({
  avaliacao,
  categoria,
}: {
  avaliacao: number;
  categoria: string;
}): ResultadoValidacaoFeedback {
  if (!Number.isInteger(avaliacao) || avaliacao < 1 || avaliacao > 5) {
    return { permitido: false, motivo: "Selecione uma avaliação de 1 a 5." };
  }

  if (!CATEGORIAS_FEEDBACK.includes(categoria as CategoriaFeedback)) {
    return { permitido: false, motivo: "Selecione uma opção válida." };
  }

  return { permitido: true };
}
