import { describe, expect, it } from "vitest";
import { calcularStatusMissao } from "./status";

describe("calcularStatusMissao", () => {
  it("retorna 'concluida' quando concluida_em está preenchido", () => {
    const status = calcularStatusMissao({
      concluidaEm: "2026-07-10T12:00:00.000Z",
      todasDependenciasConcluidas: true,
      temParticipacao: false,
    });

    expect(status).toBe("concluida");
  });

  it("retorna 'bloqueada' quando há dependência não concluída", () => {
    const status = calcularStatusMissao({
      concluidaEm: null,
      todasDependenciasConcluidas: false,
      temParticipacao: false,
    });

    expect(status).toBe("bloqueada");
  });

  it("retorna 'em_andamento' quando dependências ok e existe participação", () => {
    const status = calcularStatusMissao({
      concluidaEm: null,
      todasDependenciasConcluidas: true,
      temParticipacao: true,
    });

    expect(status).toBe("em_andamento");
  });

  it("retorna 'disponivel' quando dependências ok e não há participação", () => {
    const status = calcularStatusMissao({
      concluidaEm: null,
      todasDependenciasConcluidas: true,
      temParticipacao: false,
    });

    expect(status).toBe("disponivel");
  });

  it("prioriza 'concluida' mesmo com dependência pendente e participação", () => {
    const status = calcularStatusMissao({
      concluidaEm: "2026-07-10T12:00:00.000Z",
      todasDependenciasConcluidas: false,
      temParticipacao: true,
    });

    expect(status).toBe("concluida");
  });

  it("prioriza 'bloqueada' sobre 'em_andamento' quando ambos os sinais estão presentes", () => {
    const status = calcularStatusMissao({
      concluidaEm: null,
      todasDependenciasConcluidas: false,
      temParticipacao: true,
    });

    expect(status).toBe("bloqueada");
  });
});
