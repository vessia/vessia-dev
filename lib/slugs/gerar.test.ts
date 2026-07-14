import { describe, expect, it } from "vitest";
import { gerarSlugBase } from "./gerar";

describe("gerarSlugBase", () => {
  it("deixa minúsculo e troca espaço por hífen", () => {
    expect(gerarSlugBase("Bíblia 3D")).toBe("biblia-3d");
  });

  it("remove acentos", () => {
    expect(gerarSlugBase("Descoberta")).toBe("descoberta");
    expect(gerarSlugBase("Não é assim")).toBe("nao-e-assim");
  });

  it("troca pontuação e underscore por hífen", () => {
    expect(gerarSlugBase("teste_etapa1")).toBe("teste-etapa1");
    expect(gerarSlugBase("Etapa: Descoberta!")).toBe("etapa-descoberta");
  });

  it("colapsa hífens repetidos e remove das pontas", () => {
    expect(gerarSlugBase("  --Missão   1--  ")).toBe("missao-1");
  });

  it("cai em 'sem-nome' se o resultado ficar vazio", () => {
    expect(gerarSlugBase("!!!")).toBe("sem-nome");
    expect(gerarSlugBase("")).toBe("sem-nome");
  });
});
