// Função pura (só lê process.env) — sem "server-only" de propósito, pra
// poder ser testada direto com Vitest. Só é de fato chamada a partir de
// Server Components/Actions, mas não tem nada nela que exija isso.
// DECISIONS.md, "Criação de novo Projeto temporariamente desativada por
// feature flag": interruptor geral e reversível, não uma permissão por
// papel/usuário — desliga a criação de projeto pra todo mundo, incluindo o
// proprietário. Default habilitado (true) se a variável não estiver
// definida, pra não quebrar nada até ser explicitamente desligada.
export function criacaoProjetoHabilitada(): boolean {
  return process.env.CRIACAO_PROJETO_HABILITADA !== "false";
}
