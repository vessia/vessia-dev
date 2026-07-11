import { describe, expect, it } from "vitest";
import { resumirParticipacoes } from "./resumo";

describe("resumirParticipacoes", () => {
  it("retorna tudo zerado para lista vazia", () => {
    expect(resumirParticipacoes([])).toEqual({
      aprovadas: 0,
      comRessalvas: 0,
      rejeitadas: 0,
      pendentes: 0,
      semEntrega: 0,
    });
  });

  it("conta em_aprovacao como pendente, independente do último resultado", () => {
    const resumo = resumirParticipacoes([
      { status: "em_aprovacao", ultimoResultado: "rejeitada" },
    ]);

    expect(resumo.pendentes).toBe(1);
    expect(resumo.rejeitadas).toBe(0);
  });

  it("classifica pelo último resultado quando não está em_aprovacao", () => {
    const resumo = resumirParticipacoes([
      { status: "concluida", ultimoResultado: "aprovada" },
      { status: "concluida", ultimoResultado: "aprovada_com_ressalvas" },
      { status: "em_andamento", ultimoResultado: "rejeitada" },
    ]);

    expect(resumo.aprovadas).toBe(1);
    expect(resumo.comRessalvas).toBe(1);
    expect(resumo.rejeitadas).toBe(1);
  });

  it("classifica como semEntrega quem está em_andamento sem nenhuma avaliação ainda", () => {
    const resumo = resumirParticipacoes([
      { status: "em_andamento", ultimoResultado: null },
    ]);

    expect(resumo.semEntrega).toBe(1);
  });

  it("soma corretamente uma mistura de todos os casos", () => {
    const resumo = resumirParticipacoes([
      { status: "em_aprovacao", ultimoResultado: null },
      { status: "concluida", ultimoResultado: "aprovada" },
      { status: "concluida", ultimoResultado: "aprovada" },
      { status: "concluida", ultimoResultado: "aprovada_com_ressalvas" },
      { status: "em_andamento", ultimoResultado: "rejeitada" },
      { status: "em_andamento", ultimoResultado: null },
    ]);

    expect(resumo).toEqual({
      pendentes: 1,
      aprovadas: 2,
      comRessalvas: 1,
      rejeitadas: 1,
      semEntrega: 1,
    });
  });
});
