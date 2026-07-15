import { describe, expect, it } from "vitest";
import { emailValido, pareceEmailInvalido } from "./vinculos";

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

describe("emailValido", () => {
  it("aceita um e-mail bem formado", () => {
    expect(emailValido("aluno@exemplo.com")).toBe(true);
    expect(emailValido("aluno.teste@sub.exemplo.com.br")).toBe(true);
  });

  it("rejeita um nome sem @ (campo de convite por e-mail não aceita busca por nome)", () => {
    expect(emailValido("Maria")).toBe(false);
  });

  it("rejeita e-mail sem domínio ou sem TLD", () => {
    expect(emailValido("aluno@")).toBe(false);
    expect(emailValido("aluno@exemplo")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(emailValido("")).toBe(false);
  });
});
