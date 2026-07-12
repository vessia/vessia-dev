"use client";

import { useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { inputClass } from "@/app/_components/ui";

const ACEITA_ARQUIVO =
  "image/png,image/jpeg,image/webp,image/gif,application/pdf";

export function EntregaForm({
  action,
  projetoId,
  etapaId,
  missaoId,
  participacaoId,
  titulo,
}: {
  action: (formData: FormData) => void | Promise<void>;
  projetoId: string;
  etapaId: string;
  missaoId: string;
  participacaoId: string;
  titulo: string;
}) {
  const [tipo, setTipo] = useState<"texto" | "link" | "arquivo">("texto");

  return (
    <form
      action={action}
      className="flex flex-col gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800"
    >
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {titulo}
      </p>

      <input type="hidden" name="projeto_id" value={projetoId} />
      <input type="hidden" name="etapa_id" value={etapaId} />
      <input type="hidden" name="missao_id" value={missaoId} />
      <input type="hidden" name="participacao_id" value={participacaoId} />

      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="tipo_conteudo"
            value="texto"
            checked={tipo === "texto"}
            onChange={() => setTipo("texto")}
          />
          Texto
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="tipo_conteudo"
            value="link"
            checked={tipo === "link"}
            onChange={() => setTipo("link")}
          />
          Link
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="tipo_conteudo"
            value="arquivo"
            checked={tipo === "arquivo"}
            onChange={() => setTipo("arquivo")}
          />
          Imagem ou PDF
        </label>
      </div>

      {tipo === "arquivo" ? (
        <input
          type="file"
          name="arquivo"
          accept={ACEITA_ARQUIVO}
          required
          className={inputClass}
        />
      ) : (
        <textarea
          name="conteudo"
          required
          rows={4}
          placeholder="Descreva o que você produziu, ou cole o link aqui..."
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      )}

      <SubmitButton pendingText="Enviando..." className="w-fit">
        Enviar
      </SubmitButton>
    </form>
  );
}
