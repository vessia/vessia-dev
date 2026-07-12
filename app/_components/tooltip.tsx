"use client";

import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

// Hover no desktop, tap no mobile (onClick cobre toque — hover sozinho não
// dispara em touch). DECISIONS.md: "Tooltips explicativos nos conceitos do
// domínio". Trigger é um <span role="button">, não um <button> de verdade,
// porque o badge de status é usado dentro de <Link> no mapa do projeto —
// <button> dentro de <a> é HTML inválido e disputa o clique com o link.
export function Tooltip({
  texto,
  children,
  triggerClassName = "cursor-help underline decoration-dotted underline-offset-2",
  testId,
}: {
  texto: string;
  children: ReactNode;
  triggerClassName?: string;
  testId?: string;
}) {
  const [aberto, setAberto] = useState(false);

  function alternar(evento: MouseEvent | KeyboardEvent) {
    // Impede que o tap no badge também acione a navegação do <Link> pai.
    evento.stopPropagation();
    setAberto((v) => !v);
  }

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
    >
      <span
        role="button"
        tabIndex={0}
        data-testid={testId}
        className={triggerClassName}
        onClick={alternar}
        onKeyDown={(evento) => {
          if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            alternar(evento);
          }
        }}
        onBlur={() => setAberto(false)}
        aria-label={`Explicação: ${texto}`}
      >
        {children}
      </span>
      {aberto && (
        <span
          role="tooltip"
          data-testid="tooltip-conteudo"
          className="absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
        >
          {texto}
        </span>
      )}
    </span>
  );
}
