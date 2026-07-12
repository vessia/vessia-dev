import "server-only";
import fs from "node:fs";
import path from "node:path";

const CAMINHO = path.resolve(process.cwd(), "docs", "Termos e Privacidade.md");

// Lê o documento fonte diretamente do disco a cada request — texto sempre
// idêntico ao que o Gestor mantém em docs/, sem risco de uma cópia
// divergir da outra (DECISIONS.md: "publicar um rascunho real... campos
// [A DEFINIR] precisam ser preenchidos antes da publicação").
export function lerDocumentoTermos(): string {
  return fs.readFileSync(CAMINHO, "utf-8");
}

// Extrai o trecho entre dois marcadores literais (início inclusive, fim
// exclusivo). fimMarker null vai até o final do documento.
export function extrairSecao(
  conteudo: string,
  inicioMarker: string,
  fimMarker: string | null,
): string {
  const inicioIdx = conteudo.indexOf(inicioMarker);
  if (inicioIdx === -1) return "";

  const fimIdx = fimMarker ? conteudo.indexOf(fimMarker, inicioIdx) : -1;
  const fim = fimIdx === -1 ? conteudo.length : fimIdx;

  return conteudo.slice(inicioIdx, fim).trim();
}
