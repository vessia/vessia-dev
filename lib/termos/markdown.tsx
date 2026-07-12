import type { ReactNode } from "react";

// Conversor minimalista, feito sob medida pro subconjunto de markdown usado
// em docs/Termos e Privacidade.md (#, ##, ###, >, ---, **negrito**,
// parágrafos) — não é um parser genérico, é o suficiente pra renderizar o
// documento fonte sem reescrever o texto à mão (risco de divergência).
function renderInline(texto: string): ReactNode {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**") ? (
      <strong key={i}>{parte.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{parte}</span>
    ),
  );
}

export function renderizarMarkdown(texto: string): ReactNode[] {
  const linhas = texto.split("\n");
  const blocos: ReactNode[] = [];
  let paragrafoAtual: string[] = [];
  let citacaoAtual: string[] = [];
  let key = 0;

  function flushParagrafo() {
    if (paragrafoAtual.length > 0) {
      blocos.push(
        <p
          key={key++}
          className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
        >
          {renderInline(paragrafoAtual.join(" "))}
        </p>,
      );
      paragrafoAtual = [];
    }
  }

  function flushCitacao() {
    if (citacaoAtual.length > 0) {
      blocos.push(
        <blockquote
          key={key++}
          className="border-l-4 border-amber-400 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {renderInline(citacaoAtual.join(" "))}
        </blockquote>,
      );
      citacaoAtual = [];
    }
  }

  for (const linhaBruta of linhas) {
    const linha = linhaBruta.trimEnd();

    if (linha.trim() === "") {
      flushParagrafo();
      flushCitacao();
      continue;
    }

    if (linha.trim() === "---") {
      flushParagrafo();
      flushCitacao();
      blocos.push(
        <hr key={key++} className="border-zinc-200 dark:border-zinc-800" />,
      );
      continue;
    }

    if (linha.startsWith("### ")) {
      flushParagrafo();
      flushCitacao();
      blocos.push(
        <h3
          key={key++}
          className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
        >
          {linha.slice(4)}
        </h3>,
      );
      continue;
    }

    if (linha.startsWith("## ")) {
      flushParagrafo();
      flushCitacao();
      blocos.push(
        <h2
          key={key++}
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          {linha.slice(3)}
        </h2>,
      );
      continue;
    }

    if (linha.startsWith("# ")) {
      flushParagrafo();
      flushCitacao();
      blocos.push(
        <h1
          key={key++}
          className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
        >
          {linha.slice(2)}
        </h1>,
      );
      continue;
    }

    if (linha.startsWith("> ")) {
      flushParagrafo();
      citacaoAtual.push(linha.slice(2));
      continue;
    }

    flushCitacao();
    paragrafoAtual.push(linha);
  }

  flushParagrafo();
  flushCitacao();

  return blocos;
}
