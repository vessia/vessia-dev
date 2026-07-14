// DECISIONS.md, "URL amigável (slug) por Projeto, Etapa e Missão": mesma
// regra usada no backfill da migration 015 (minúsculas, sem acento,
// espaço/pontuação vira hífen) — reimplementada em JS (não em SQL) porque
// é aqui, na criação via Server Action, que o slug precisa ser gerado a
// partir de agora.
export function gerarSlugBase(texto: string): string {
  const base = texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "sem-nome";
}
