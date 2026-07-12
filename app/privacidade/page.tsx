import { lerDocumentoTermos, extrairSecao } from "@/lib/termos/conteudo";
import { renderizarMarkdown } from "@/lib/termos/markdown";

export default function PrivacidadePage() {
  const documento = lerDocumentoTermos();
  const secao = extrairSecao(
    documento,
    "## Política de Privacidade",
    "## Notas para quem for revisar",
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4 sm:p-8">
      {renderizarMarkdown(secao)}
    </main>
  );
}
