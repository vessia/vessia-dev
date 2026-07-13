import { describe, expect, it } from "vitest";
import {
  podeEnviarEntrega,
  podeParticipar,
  precisaAceitarTermoEspecifico,
  validarAvaliacao,
} from "./validacoes";

describe("podeParticipar", () => {
  it("rejeita se o aluno já participa da missão", () => {
    const resultado = podeParticipar({
      statusMissao: "disponivel",
      vagas: 5,
      participacoesExistentes: 1,
      jaParticipa: true,
      termoPendente: false,
    });

    expect(resultado.permitido).toBe(false);
    if (!resultado.permitido) {
      expect(resultado.motivo).toMatch(/já participa/i);
    }
  });

  it("rejeita missão bloqueada mesmo com vaga livre", () => {
    const resultado = podeParticipar({
      statusMissao: "bloqueada",
      vagas: 5,
      participacoesExistentes: 0,
      jaParticipa: false,
      termoPendente: false,
    });

    expect(resultado.permitido).toBe(false);
  });

  it("rejeita missão concluída", () => {
    const resultado = podeParticipar({
      statusMissao: "concluida",
      vagas: 5,
      participacoesExistentes: 0,
      jaParticipa: false,
      termoPendente: false,
    });

    expect(resultado.permitido).toBe(false);
  });

  it("permite missão disponível com vaga livre", () => {
    const resultado = podeParticipar({
      statusMissao: "disponivel",
      vagas: 2,
      participacoesExistentes: 0,
      jaParticipa: false,
      termoPendente: false,
    });

    expect(resultado.permitido).toBe(true);
  });

  it("permite missão em_andamento se ainda houver vaga (outro aluno já participando)", () => {
    const resultado = podeParticipar({
      statusMissao: "em_andamento",
      vagas: 2,
      participacoesExistentes: 1,
      jaParticipa: false,
      termoPendente: false,
    });

    expect(resultado.permitido).toBe(true);
  });

  it("rejeita quando as vagas já estão todas preenchidas", () => {
    const resultado = podeParticipar({
      statusMissao: "em_andamento",
      vagas: 2,
      participacoesExistentes: 2,
      jaParticipa: false,
      termoPendente: false,
    });

    expect(resultado.permitido).toBe(false);
    if (!resultado.permitido) {
      expect(resultado.motivo).toMatch(/vaga/i);
    }
  });

  it("permite participar mesmo com muitas participações existentes quando vagas é null (sem limite)", () => {
    const resultado = podeParticipar({
      statusMissao: "disponivel",
      vagas: null,
      participacoesExistentes: 999,
      jaParticipa: false,
      termoPendente: false,
    });

    expect(resultado.permitido).toBe(true);
  });

  it("rejeita com sinal 'termoPendente' quando o termo específico ainda não foi aceito, mesmo com tudo mais liberado", () => {
    const resultado = podeParticipar({
      statusMissao: "disponivel",
      vagas: 5,
      participacoesExistentes: 0,
      jaParticipa: false,
      termoPendente: true,
    });

    expect(resultado.permitido).toBe(false);
    if (!resultado.permitido) {
      expect(resultado.termoPendente).toBe(true);
    }
  });
});

describe("precisaAceitarTermoEspecifico", () => {
  it("não precisa quando o projeto não define termo específico", () => {
    expect(
      precisaAceitarTermoEspecifico({
        termoEspecifico: null,
        termoAceitoEm: null,
      }),
    ).toBe(false);
  });

  it("precisa quando o projeto define termo e o aluno ainda não aceitou", () => {
    expect(
      precisaAceitarTermoEspecifico({
        termoEspecifico: "Este trabalho não tem caráter trabalhista...",
        termoAceitoEm: null,
      }),
    ).toBe(true);
  });

  it("não precisa mais depois que o aluno já aceitou", () => {
    expect(
      precisaAceitarTermoEspecifico({
        termoEspecifico: "Este trabalho não tem caráter trabalhista...",
        termoAceitoEm: "2026-07-12T10:00:00.000Z",
      }),
    ).toBe(false);
  });
});

describe("podeEnviarEntrega", () => {
  it("rejeita quando a participação não está em_andamento", () => {
    const resultado = podeEnviarEntrega({
      statusParticipacao: "em_aprovacao",
      entregasExistentes: 0,
      limiteReenvios: 3,
    });

    expect(resultado.permitido).toBe(false);
  });

  it("permite a primeira entrega e calcula numeroTentativa = 1", () => {
    const resultado = podeEnviarEntrega({
      statusParticipacao: "em_andamento",
      entregasExistentes: 0,
      limiteReenvios: 3,
    });

    expect(resultado.permitido).toBe(true);
    if (resultado.permitido) {
      expect(resultado.numeroTentativa).toBe(1);
    }
  });

  it("permite a última tentativa dentro do limite", () => {
    const resultado = podeEnviarEntrega({
      statusParticipacao: "em_andamento",
      entregasExistentes: 2,
      limiteReenvios: 3,
    });

    expect(resultado.permitido).toBe(true);
    if (resultado.permitido) {
      expect(resultado.numeroTentativa).toBe(3);
    }
  });

  it("rejeita quando o limite de reenvios já foi atingido", () => {
    const resultado = podeEnviarEntrega({
      statusParticipacao: "em_andamento",
      entregasExistentes: 3,
      limiteReenvios: 3,
    });

    expect(resultado.permitido).toBe(false);
    if (!resultado.permitido) {
      expect(resultado.motivo).toMatch(/limite/i);
    }
  });
});

describe("validarAvaliacao", () => {
  it("rejeita se a entrega já foi avaliada", () => {
    const resultado = validarAvaliacao({
      resultado: "aprovada",
      feedback: "",
      jaAvaliada: true,
    });

    expect(resultado.permitido).toBe(false);
  });

  it("rejeita resultado inválido", () => {
    const resultado = validarAvaliacao({
      resultado: "excelente",
      feedback: "",
      jaAvaliada: false,
    });

    expect(resultado.permitido).toBe(false);
  });

  it("permite aprovar sem feedback", () => {
    const resultado = validarAvaliacao({
      resultado: "aprovada",
      feedback: "",
      jaAvaliada: false,
    });

    expect(resultado.permitido).toBe(true);
  });

  it("permite aprovar com ressalvas sem feedback", () => {
    const resultado = validarAvaliacao({
      resultado: "aprovada_com_ressalvas",
      feedback: "",
      jaAvaliada: false,
    });

    expect(resultado.permitido).toBe(true);
  });

  it("rejeita 'rejeitada' sem feedback (mesma regra do check constraint do banco)", () => {
    const resultado = validarAvaliacao({
      resultado: "rejeitada",
      feedback: "",
      jaAvaliada: false,
    });

    expect(resultado.permitido).toBe(false);
    if (!resultado.permitido) {
      expect(resultado.motivo).toMatch(/feedback/i);
    }
  });

  it("rejeita 'rejeitada' com feedback só de espaços em branco", () => {
    const resultado = validarAvaliacao({
      resultado: "rejeitada",
      feedback: "   ",
      jaAvaliada: false,
    });

    expect(resultado.permitido).toBe(false);
  });

  it("permite 'rejeitada' com feedback preenchido", () => {
    const resultado = validarAvaliacao({
      resultado: "rejeitada",
      feedback: "Faltou explicar o critério X.",
      jaAvaliada: false,
    });

    expect(resultado.permitido).toBe(true);
  });
});
