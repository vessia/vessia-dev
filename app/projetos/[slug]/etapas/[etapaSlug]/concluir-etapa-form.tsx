import { SubmitButton } from "@/app/_components/submit-button";
import { inputClass } from "@/app/_components/ui";

const ACEITA_ARQUIVO =
  "image/png,image/jpeg,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function ConcluirEtapaForm({
  action,
  projetoId,
  etapaId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  projetoId: string;
  etapaId: string;
}) {
  return (
    <form
      action={action}
      className="flex flex-col gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800"
    >
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Concluir etapa
      </p>

      <input type="hidden" name="projeto_id" value={projetoId} />
      <input type="hidden" name="etapa_id" value={etapaId} />

      <label className="flex flex-col gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
        Resumo de encerramento (opcional, aceita Markdown)
        <textarea
          name="resumo_encerramento"
          rows={4}
          placeholder="O que foi feito nesta etapa..."
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
        Anexar arquivo (opcional) — imagem, PDF ou Word
        <input
          type="file"
          name="arquivo"
          accept={ACEITA_ARQUIVO}
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
          Nome do link (opcional)
          <input type="text" name="anexo_nome" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
          URL do link (opcional)
          <input
            type="url"
            name="anexo_url"
            placeholder="https://..."
            className={inputClass}
          />
        </label>
      </div>

      <SubmitButton pendingText="Concluindo..." className="w-fit">
        Concluir etapa
      </SubmitButton>
    </form>
  );
}
