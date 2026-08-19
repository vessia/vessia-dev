import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

// Textos livres de Missão (descrição, objetivo, entrega esperada, critério)
// e de Etapa (resumo de encerramento) passam a aceitar Markdown básico —
// antes, um "enter" simples no textarea virava texto corrido na tela,
// porque HTML colapsa quebra de linha sozinho. remark-breaks trata cada
// quebra de linha do texto original como quebra de linha renderizada (o
// CommonMark puro só quebra parágrafo em linha em branco dupla, o que
// confundia quem só apertava enter uma vez). Sem plugin de HTML bruto
// (rehype-raw) de propósito — o texto vem de qualquer professor e é lido
// por qualquer aluno vinculado, então tags soltas no meio do texto
// aparecem como texto literal, nunca são executadas.
export function Markdown({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={`text-sm text-zinc-700 dark:text-zinc-300 ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-900 dark:text-zinc-50">
              {children}
            </strong>
          ),
          ul: ({ children }) => (
            <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline dark:text-blue-400"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-2 border-l-2 border-zinc-300 pl-3 text-zinc-500 last:mb-0 dark:border-zinc-700 dark:text-zinc-400">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <p className="mb-1 font-semibold text-zinc-900 dark:text-zinc-50">
              {children}
            </p>
          ),
          h2: ({ children }) => (
            <p className="mb-1 font-semibold text-zinc-900 dark:text-zinc-50">
              {children}
            </p>
          ),
          h3: ({ children }) => (
            <p className="mb-1 font-semibold text-zinc-900 dark:text-zinc-50">
              {children}
            </p>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
