import { describe, expect, it } from "vitest";
import { validarArquivoEntrega } from "./validacao-arquivo";

describe("validarArquivoEntrega", () => {
  it("aceita imagem dentro do limite de 5MB", () => {
    const resultado = validarArquivoEntrega({
      tipo: "image/png",
      tamanhoBytes: 4 * 1024 * 1024,
    });
    expect(resultado.permitido).toBe(true);
  });

  it("rejeita imagem acima de 5MB", () => {
    const resultado = validarArquivoEntrega({
      tipo: "image/jpeg",
      tamanhoBytes: 6 * 1024 * 1024,
    });
    expect(resultado).toEqual({
      permitido: false,
      motivo: "Imagem maior que o limite de 5MB.",
    });
  });

  it("aceita PDF dentro do limite de 10MB", () => {
    const resultado = validarArquivoEntrega({
      tipo: "application/pdf",
      tamanhoBytes: 9 * 1024 * 1024,
    });
    expect(resultado.permitido).toBe(true);
  });

  it("rejeita PDF acima de 10MB", () => {
    const resultado = validarArquivoEntrega({
      tipo: "application/pdf",
      tamanhoBytes: 11 * 1024 * 1024,
    });
    expect(resultado).toEqual({
      permitido: false,
      motivo: "PDF maior que o limite de 10MB.",
    });
  });

  it("rejeita tipo fora da whitelist (ex: vídeo)", () => {
    const resultado = validarArquivoEntrega({
      tipo: "video/mp4",
      tamanhoBytes: 1024,
    });
    expect(resultado.permitido).toBe(false);
  });

  it("aceita cada tipo de imagem da whitelist", () => {
    for (const tipo of [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
    ]) {
      expect(validarArquivoEntrega({ tipo, tamanhoBytes: 1024 }).permitido).toBe(
        true,
      );
    }
  });
});
