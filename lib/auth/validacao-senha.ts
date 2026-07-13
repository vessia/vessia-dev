export type ResultadoValidacaoSenha =
  | { permitido: true }
  | { permitido: false; motivo: string };

// Mesmo mínimo já usado em /cadastro (minLength no HTML) — centralizado
// aqui pra não divergir entre as duas telas que pedem senha nova.
export const TAMANHO_MINIMO_SENHA = 6;

export function validarNovaSenha({
  senha,
  confirmarSenha,
}: {
  senha: string;
  confirmarSenha: string;
}): ResultadoValidacaoSenha {
  if (senha.length < TAMANHO_MINIMO_SENHA) {
    return {
      permitido: false,
      motivo: `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`,
    };
  }

  if (senha !== confirmarSenha) {
    return { permitido: false, motivo: "As senhas não coincidem." };
  }

  return { permitido: true };
}
