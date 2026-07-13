import { describe, expect, it } from "vitest";
import { validarFeedback } from "./validacao";

describe("validarFeedback", () => {
  it("permite avaliação e categoria válidas", () => {
    expect(
      validarFeedback({ avaliacao: 4, categoria: "esta_bom" }).permitido,
    ).toBe(true);
  });

  it("rejeita avaliação abaixo de 1", () => {
    const resultado = validarFeedback({
      avaliacao: 0,
      categoria: "esta_bom",
    });
    expect(resultado.permitido).toBe(false);
  });

  it("rejeita avaliação acima de 5", () => {
    const resultado = validarFeedback({
      avaliacao: 6,
      categoria: "esta_bom",
    });
    expect(resultado.permitido).toBe(false);
  });

  it("rejeita avaliação não inteira", () => {
    const resultado = validarFeedback({
      avaliacao: 3.5,
      categoria: "esta_bom",
    });
    expect(resultado.permitido).toBe(false);
  });

  it("rejeita categoria fora da whitelist", () => {
    const resultado = validarFeedback({
      avaliacao: 3,
      categoria: "categoria_inventada",
    });
    expect(resultado.permitido).toBe(false);
    if (!resultado.permitido) {
      expect(resultado.motivo).toMatch(/opção válida/i);
    }
  });

  it("aceita todas as categorias da whitelist", () => {
    for (const categoria of [
      "nao_sei_o_que_fazer",
      "muito_clique",
      "tela_confusa",
      "esta_bom",
      "outro",
    ]) {
      expect(validarFeedback({ avaliacao: 3, categoria }).permitido).toBe(
        true,
      );
    }
  });
});
