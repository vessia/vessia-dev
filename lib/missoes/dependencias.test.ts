import { describe, expect, it } from "vitest";
import { encontrarDependenciaCiclica } from "./dependencias";

describe("encontrarDependenciaCiclica", () => {
  it("permite quando não há dependências existentes ainda (grafo vazio)", () => {
    const grafo = new Map<string, string[]>();

    const resultado = encontrarDependenciaCiclica(grafo, "A", ["B"]);

    expect(resultado).toBeNull();
  });

  it("permite uma dependência que não fecha ciclo", () => {
    // B depende de C. Propor que A dependa de B não cria ciclo.
    const grafo = new Map<string, string[]>([["B", ["C"]]]);

    const resultado = encontrarDependenciaCiclica(grafo, "A", ["B"]);

    expect(resultado).toBeNull();
  });

  it("detecta ciclo direto (A depende de B, tentar B depender de A)", () => {
    // A já depende de B.
    const grafo = new Map<string, string[]>([["A", ["B"]]]);

    // Tentar fazer B depender de A fecharia o ciclo B -> A -> B.
    const resultado = encontrarDependenciaCiclica(grafo, "B", ["A"]);

    expect(resultado).toBe("A");
  });

  it("detecta ciclo transitivo (A->B->C, tentar C->A)", () => {
    const grafo = new Map<string, string[]>([
      ["A", ["B"]],
      ["B", ["C"]],
    ]);

    // Tentar fazer C depender de A fecharia o ciclo C -> A -> B -> C.
    const resultado = encontrarDependenciaCiclica(grafo, "C", ["A"]);

    expect(resultado).toBe("A");
  });

  it("detecta autodependência direta", () => {
    const grafo = new Map<string, string[]>();

    const resultado = encontrarDependenciaCiclica(grafo, "A", ["A"]);

    expect(resultado).toBe("A");
  });

  it("identifica qual candidata específica fecha o ciclo entre várias válidas", () => {
    const grafo = new Map<string, string[]>([
      ["B", ["C"]],
      ["X", ["A"]], // X depende de A -> propor A depender de X fecha ciclo
    ]);

    const resultado = encontrarDependenciaCiclica(grafo, "A", ["B", "X"]);

    expect(resultado).toBe("X");
  });
});
