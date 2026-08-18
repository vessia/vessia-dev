export type ResultadoValidacaoArquivo =
  | { permitido: true }
  | { permitido: false; motivo: string };

const TIPOS_IMAGEM = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const TIPO_PDF = "application/pdf";
const TIPOS_DOC = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const LIMITE_IMAGEM_BYTES = 5 * 1024 * 1024;
const LIMITE_PDF_BYTES = 10 * 1024 * 1024;
const LIMITE_DOC_BYTES = 10 * 1024 * 1024;

// DECISIONS.md, "Entregas passam a suportar upload de imagem e PDF": imagem
// até 5MB, PDF até 10MB. DECISIONS.md, "Conclusão manual de Etapa, com
// resumo + anexos/links": whitelist ampliada para incluir docx (mesmo
// limite do PDF, 10MB) — mesma função, reaproveitada pelo upload de anexo de
// conclusão de etapa. Ampliar mais é só mudar essas listas.
export function validarArquivoEntrega({
  tipo,
  tamanhoBytes,
}: {
  tipo: string;
  tamanhoBytes: number;
}): ResultadoValidacaoArquivo {
  if (TIPOS_IMAGEM.includes(tipo)) {
    if (tamanhoBytes > LIMITE_IMAGEM_BYTES) {
      return {
        permitido: false,
        motivo: "Imagem maior que o limite de 5MB.",
      };
    }
    return { permitido: true };
  }

  if (tipo === TIPO_PDF) {
    if (tamanhoBytes > LIMITE_PDF_BYTES) {
      return { permitido: false, motivo: "PDF maior que o limite de 10MB." };
    }
    return { permitido: true };
  }

  if (TIPOS_DOC.includes(tipo)) {
    if (tamanhoBytes > LIMITE_DOC_BYTES) {
      return { permitido: false, motivo: "Documento maior que o limite de 10MB." };
    }
    return { permitido: true };
  }

  return {
    permitido: false,
    motivo:
      "Tipo de arquivo não suportado. Envie uma imagem (PNG, JPEG, WEBP, GIF), um PDF ou um Word (doc/docx).",
  };
}
