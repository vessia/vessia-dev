import { describe, expect, it } from "vitest";
import { calcularProgressoEtapa } from "./progresso";

describe("calcularProgressoEtapa", () => {
  it("retorna null quando não há missões", () => {
    expect(calcularProgressoEtapa([])).toBeNull();
  });

  it("retorna null quando não há nenhuma missão obrigatória", () => {
    const progresso = calcularProgressoEtapa([
      { obrigatoria: false, concluidaEm: null },
      { obrigatoria: false, concluidaEm: "2026-07-10T00:00:00.000Z" },
    ]);

    expect(progresso).toBeNull();
  });

  it("retorna 0 quando nenhuma obrigatória está concluída", () => {
    const progresso = calcularProgressoEtapa([
      { obrigatoria: true, concluidaEm: null },
      { obrigatoria: true, concluidaEm: null },
    ]);

    expect(progresso).toBe(0);
  });

  it("retorna 100 quando todas as obrigatórias estão concluídas", () => {
    const progresso = calcularProgressoEtapa([
      { obrigatoria: true, concluidaEm: "2026-07-10T00:00:00.000Z" },
      { obrigatoria: true, concluidaEm: "2026-07-10T00:00:00.000Z" },
    ]);

    expect(progresso).toBe(100);
  });

  it("calcula a proporção apenas entre as obrigatórias, ignorando opcionais", () => {
    const progresso = calcularProgressoEtapa([
      { obrigatoria: true, concluidaEm: "2026-07-10T00:00:00.000Z" },
      { obrigatoria: true, concluidaEm: null },
      { obrigatoria: false, concluidaEm: null }, // opcional, não conta no total
    ]);

    // 1 de 2 obrigatórias concluídas = 50%, mesmo com a opcional pendente.
    expect(progresso).toBe(50);
  });

  it("arredonda a porcentagem", () => {
    const progresso = calcularProgressoEtapa([
      { obrigatoria: true, concluidaEm: "2026-07-10T00:00:00.000Z" },
      { obrigatoria: true, concluidaEm: null },
      { obrigatoria: true, concluidaEm: null },
    ]);

    // 1/3 = 33.33...% -> arredonda para 33.
    expect(progresso).toBe(33);
  });
});
