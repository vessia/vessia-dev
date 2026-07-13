import { describe, expect, it } from "vitest";
import { validarNovaSenha } from "./validacao-senha";

describe("validarNovaSenha", () => {
  it("rejeita senha mais curta que o mínimo", () => {
    const resultado = validarNovaSenha({ senha: "abc12", confirmarSenha: "abc12" });

    expect(resultado.permitido).toBe(false);
    if (!resultado.permitido) {
      expect(resultado.motivo).toMatch(/pelo menos 6 caracteres/i);
    }
  });

  it("aceita senha com exatamente o tamanho mínimo", () => {
    const resultado = validarNovaSenha({ senha: "abc123", confirmarSenha: "abc123" });

    expect(resultado.permitido).toBe(true);
  });

  it("rejeita quando confirmação não bate com a senha", () => {
    const resultado = validarNovaSenha({
      senha: "senha123",
      confirmarSenha: "senha124",
    });

    expect(resultado.permitido).toBe(false);
    if (!resultado.permitido) {
      expect(resultado.motivo).toMatch(/não coincidem/i);
    }
  });

  it("prioriza o erro de tamanho mínimo sobre o de confirmação, quando os dois falham", () => {
    const resultado = validarNovaSenha({ senha: "a", confirmarSenha: "b" });

    expect(resultado.permitido).toBe(false);
    if (!resultado.permitido) {
      expect(resultado.motivo).toMatch(/pelo menos 6 caracteres/i);
    }
  });

  it("permite senha longa e confirmação idêntica", () => {
    const resultado = validarNovaSenha({
      senha: "uma-senha-bem-longa-123",
      confirmarSenha: "uma-senha-bem-longa-123",
    });

    expect(resultado.permitido).toBe(true);
  });
});
