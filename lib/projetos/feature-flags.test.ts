import { afterEach, describe, expect, it } from "vitest";
import { criacaoProjetoHabilitada } from "./feature-flags";

const ORIGINAL = process.env.CRIACAO_PROJETO_HABILITADA;

describe("criacaoProjetoHabilitada", () => {
  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.CRIACAO_PROJETO_HABILITADA;
    } else {
      process.env.CRIACAO_PROJETO_HABILITADA = ORIGINAL;
    }
  });

  it("é true por padrão quando a variável não está definida", () => {
    delete process.env.CRIACAO_PROJETO_HABILITADA;
    expect(criacaoProjetoHabilitada()).toBe(true);
  });

  it("é false quando a variável é explicitamente 'false'", () => {
    process.env.CRIACAO_PROJETO_HABILITADA = "false";
    expect(criacaoProjetoHabilitada()).toBe(false);
  });

  it("é true quando a variável é explicitamente 'true'", () => {
    process.env.CRIACAO_PROJETO_HABILITADA = "true";
    expect(criacaoProjetoHabilitada()).toBe(true);
  });
});
