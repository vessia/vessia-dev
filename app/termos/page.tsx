import { lerDocumentoTermos, extrairSecao } from "@/lib/termos/conteudo";
import { renderizarMarkdown } from "@/lib/termos/markdown";

export default function TermosPage() {
  const documento = lerDocumentoTermos();
  const cabecalho = extrairSecao(
    documento,
    "# Termos de Uso e Política de Privacidade",
    "## Termos de Uso",
  );
  const secao = extrairSecao(documento, "## Termos de Uso", "## Política de Privacidade");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4 sm:p-8">
      {renderizarMarkdown(cabecalho)}
      {renderizarMarkdown(secao)}
    </main>
  );
}
