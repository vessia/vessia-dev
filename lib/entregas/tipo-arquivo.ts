const EXTENSOES_IMAGEM = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

// O path guardado em entregas.conteudo sempre termina com a extensão
// original do arquivo enviado (ver enviarEntrega) — infere o tipo de
// renderização a partir dela, sem precisar guardar um campo à parte.
export function ehImagem(path: string): boolean {
  const extensao = path.split(".").pop()?.toLowerCase();
  return extensao ? EXTENSOES_IMAGEM.has(extensao) : false;
}
