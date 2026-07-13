"use client";

import { useActionState, useState } from "react";
import { usePathname } from "next/navigation";
import { SubmitButton } from "@/app/_components/submit-button";
import { inputClass } from "@/app/_components/ui";
import {
  CATEGORIAS_FEEDBACK,
  CATEGORIA_FEEDBACK_LABEL,
} from "@/lib/feedbacks/validacao";
import { enviarFeedback, type ResultadoEnvioFeedback } from "./actions";

// DECISIONS.md: "botão de feedback visível em qualquer página autenticada
// (não na landing pública)" — a landing e /login/cadastro nunca têm
// sessão de qualquer forma (ver FeedbackWidgetGate), mas um usuário já
// autenticado visitando essas 3 rotas por acaso também não deve ver o
// botão, daí a checagem explícita de pathname aqui.
const ROTAS_SEM_WIDGET = ["/", "/login", "/cadastro"];

const ESTADO_INICIAL: ResultadoEnvioFeedback = { status: "idle" };

function FeedbackForm({
  paginaOrigem,
  onFechar,
}: {
  paginaOrigem: string;
  onFechar: () => void;
}) {
  const [estado, formAction] = useActionState(enviarFeedback, ESTADO_INICIAL);

  if (estado.status === "sucesso") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
          Obrigado!
        </p>
        <button
          type="button"
          onClick={onFechar}
          className="text-sm text-zinc-500 underline dark:text-zinc-400"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="pagina_origem" value={paginaOrigem} />

      {estado.status === "erro" && (
        <p
          data-testid="banner-error"
          className="rounded-md border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400 dark:bg-red-950/50 dark:text-red-300"
        >
          {estado.mensagem}
        </p>
      )}

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Como está a experiência até agora?
        </legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((nota) => (
            <label
              key={nota}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-zinc-300 text-sm text-zinc-700 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-600 has-[:checked]:text-white dark:border-zinc-700 dark:text-zinc-300"
            >
              <input
                type="radio"
                name="avaliacao"
                value={nota}
                required
                className="sr-only"
              />
              {nota}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          O que mais incomoda?
        </legend>
        <div className="flex flex-col gap-1.5">
          {CATEGORIAS_FEEDBACK.map((categoria) => (
            <label
              key={categoria}
              className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <input type="radio" name="categoria" value={categoria} required />
              {CATEGORIA_FEEDBACK_LABEL[categoria]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Quer detalhar? (opcional)
        <textarea name="comentario" rows={3} className={inputClass} />
      </label>

      <div className="flex items-center gap-4">
        <SubmitButton pendingText="Enviando...">Enviar</SubmitButton>
        <button
          type="button"
          onClick={onFechar}
          className="text-sm text-zinc-500 underline dark:text-zinc-400"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function FeedbackWidget() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [instancia, setInstancia] = useState(0);

  if (ROTAS_SEM_WIDGET.includes(pathname)) {
    return null;
  }

  function fechar() {
    setAberto(false);
    setInstancia((n) => n + 1);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="fixed bottom-4 right-4 z-20 rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-lg transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Dar feedback
      </button>

      {aberto && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Feedback rápido
            </h2>
            <FeedbackForm
              key={instancia}
              paginaOrigem={pathname}
              onFechar={fechar}
            />
          </div>
        </div>
      )}
    </>
  );
}
