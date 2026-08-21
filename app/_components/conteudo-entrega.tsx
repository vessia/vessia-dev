import { ehImagem } from "@/lib/entregas/tipo-arquivo";
import { Markdown } from "@/app/_components/markdown";

// Renderização do conteúdo de uma Entrega (texto, link ou arquivo com URL
// assinada) — compartilhado entre a tela de avaliação e "Entregas desta
// missão", que mostram exatamente o mesmo dado de formas diferentes.
export function ConteudoEntrega({
  tipoConteudo,
  conteudo,
  urlAssinada,
}: {
  tipoConteudo: string;
  conteudo: string;
  urlAssinada: string | null;
}) {
  if (tipoConteudo !== "arquivo") {
    // O formulário de entrega usa o mesmo textarea livre pra "texto" e
    // "link" (nem sempre é só uma URL pura) — Markdown com autolink do
    // remark-gfm garante que qualquer URL colada vire link clicável, sem
    // exigir que o aluno cole só a URL e nada mais.
    return <Markdown>{conteudo}</Markdown>;
  }

  if (!urlAssinada) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Não foi possível carregar o arquivo agora.
      </p>
    );
  }

  if (ehImagem(conteudo)) {
    return (
      // URL assinada de curta duração, gerada por request — não faz
      // sentido pré-otimizar via next/image, que exige uma URL estável.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={urlAssinada}
        alt="Imagem enviada como entrega"
        className="max-h-96 w-full rounded-lg object-contain"
      />
    );
  }

  return (
    <a
      href={urlAssinada}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-fit items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
    >
      📄 Abrir PDF
    </a>
  );
}
