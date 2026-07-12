import { describe, expect, it } from "vitest";
import { calcularProgressoOnboarding, onboardingCompleto } from "./progresso";

describe("calcularProgressoOnboarding", () => {
  it("com nada concluído: só o primeiro item está disponível", () => {
    const itens = calcularProgressoOnboarding([]);

    expect(itens[0]).toMatchObject({
      chave: "conheca_empresa",
      concluido: false,
      disponivel: true,
    });
    expect(itens[1]).toMatchObject({ concluido: false, disponivel: false });
    expect(itens[2]).toMatchObject({ concluido: false, disponivel: false });
  });

  it("com o primeiro concluído: o segundo libera, o terceiro continua bloqueado", () => {
    const itens = calcularProgressoOnboarding(["conheca_empresa"]);

    expect(itens[0]).toMatchObject({ concluido: true, disponivel: true });
    expect(itens[1]).toMatchObject({ concluido: false, disponivel: true });
    expect(itens[2]).toMatchObject({ concluido: false, disponivel: false });
  });

  it("com os dois primeiros concluídos: o terceiro libera", () => {
    const itens = calcularProgressoOnboarding([
      "conheca_empresa",
      "como_funcionam_missoes",
    ]);

    expect(itens[2]).toMatchObject({ concluido: false, disponivel: true });
  });

  it("com os três concluídos: todos marcados como concluídos", () => {
    const itens = calcularProgressoOnboarding([
      "conheca_empresa",
      "como_funcionam_missoes",
      "como_entregar_aprovacao",
    ]);

    expect(itens.every((i) => i.concluido)).toBe(true);
  });

  it("ignora a ordem de conclusão recebida — segue sempre a ordem fixa dos itens", () => {
    // Terceiro marcado sem os anteriores (ex: dado corrompido/manipulado) —
    // ainda assim ele fica indisponível, porque o segundo não foi concluído.
    const itens = calcularProgressoOnboarding(["como_entregar_aprovacao"]);

    expect(itens[2]).toMatchObject({ concluido: true, disponivel: false });
  });
});

describe("onboardingCompleto", () => {
  it("retorna false com lista vazia", () => {
    expect(onboardingCompleto([])).toBe(false);
  });

  it("retorna false faltando um item", () => {
    expect(
      onboardingCompleto(["conheca_empresa", "como_funcionam_missoes"]),
    ).toBe(false);
  });

  it("retorna true com os três itens", () => {
    expect(
      onboardingCompleto([
        "conheca_empresa",
        "como_funcionam_missoes",
        "como_entregar_aprovacao",
      ]),
    ).toBe(true);
  });

  it("ignora itens desconhecidos extras", () => {
    expect(
      onboardingCompleto([
        "conheca_empresa",
        "como_funcionam_missoes",
        "como_entregar_aprovacao",
        "item_que_nao_existe",
      ]),
    ).toBe(true);
  });
});
