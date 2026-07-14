import { describe, expect, it } from "vitest";
import { pareceEmailInvalido } from "./vinculos";

describe("pareceEmailInvalido", () => {
  it("não reclama de uma busca por nome comum, sem @", () => {
    expect(pareceEmailInvalido("Maria")).toBe(false);
    expect(pareceEmailInvalido("joao silva")).toBe(false);
  });

  it("aceita um e-mail bem formado", () => {
    expect(pareceEmailInvalido("aluno@exemplo.com")).toBe(false);
    expect(pareceEmailInvalido("aluno.teste@sub.exemplo.com.br")).toBe(false);
  });

  it("rejeita algo com @ mas sem domínio", () => {
    expect(pareceEmailInvalido("aluno@")).toBe(true);
  });

  it("rejeita algo com @ mas sem TLD", () => {
    expect(pareceEmailInvalido("aluno@exemplo")).toBe(true);
  });

  it("rejeita @ solto no meio de texto", () => {
    expect(pareceEmailInvalido("procurando @alguem")).toBe(true);
  });
});
