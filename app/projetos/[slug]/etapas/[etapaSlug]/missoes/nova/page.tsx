import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessor } from "@/lib/auth/dal";
import { criarMissao } from "../actions";
import { TIPOS_MISSAO } from "@/lib/missoes/constantes";
import { Card, Field, Banner, inputClass } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";

export default async function NovaMissaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; etapaSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireProfessor();
  const { slug, etapaSlug } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();

  const { data: projeto } = await supabase
    .from("projetos")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!projeto) {
    notFound();
  }

  const projetoId = projeto.id;

  const { data: etapa } = await supabase
    .from("etapas")
    .select("id, nome, projeto_id")
    .eq("projeto_id", projetoId)
    .eq("slug", etapaSlug)
    .single();

  if (!etapa) {
    notFound();
  }

  const etapaId = etapa.id;

  const { data: etapasDoProjeto } = await supabase
    .from("etapas")
    .select("id, nome")
    .eq("projeto_id", projetoId);

  const etapaIds = (etapasDoProjeto ?? []).map((e) => e.id);
  const nomePorEtapa = new Map(
    (etapasDoProjeto ?? []).map((e) => [e.id, e.nome]),
  );

  const { data: missoesDoProjeto } = etapaIds.length
    ? await supabase
        .from("missoes")
        .select("id, titulo, etapa_id")
        .in("etapa_id", etapaIds)
    : { data: [] };

  const candidatas = missoesDoProjeto ?? [];

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <Card className="max-w-2xl">
        <form action={criarMissao} className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Nova missão — {etapa.nome}
          </h1>

          {error && <Banner variant="error">{error}</Banner>}

          <input type="hidden" name="projeto_id" value={projetoId} />
          <input type="hidden" name="etapa_id" value={etapaId} />

          <Field label="Título">
            <input type="text" name="titulo" required className={inputClass} />
          </Field>

          <Field label="Descrição">
            <textarea name="descricao" rows={2} className={inputClass} />
          </Field>

          <Field label="Tipo">
            <select name="tipo" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Selecione...
              </option>
              {TIPOS_MISSAO.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.icone} {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Objetivo">
            <textarea name="objetivo" required rows={2} className={inputClass} />
          </Field>

          <Field label="Entrega esperada">
            <textarea
              name="entrega_esperada"
              required
              rows={2}
              className={inputClass}
            />
          </Field>

          <Field label="Critério de avaliação">
            <textarea
              name="criterio_avaliacao"
              required
              rows={2}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Prazo (opcional)">
              <input type="datetime-local" name="prazo" className={inputClass} />
            </Field>
            <Field label="Vagas (deixe em branco para sem limite)">
              <input
                type="number"
                name="vagas"
                min={1}
                step={1}
                defaultValue={1}
                placeholder="Sem limite"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Limite de reenvios">
              <input
                type="number"
                name="limite_reenvios"
                min={0}
                step={1}
                defaultValue={1}
                required
                className={inputClass}
              />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="obrigatoria"
                defaultChecked
                className="h-4 w-4 rounded border-zinc-300"
              />
              Obrigatória
            </label>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Depende de (opcional)
            </legend>
            {candidatas.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Nenhuma outra missão no projeto ainda.
              </p>
            ) : (
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-zinc-300 p-3 dark:border-zinc-700">
                {candidatas.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <input
                      type="checkbox"
                      name="dependencias"
                      value={m.id}
                      data-testid={`dependencia-${m.id}`}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    {m.titulo}{" "}
                    <span className="text-zinc-400 dark:text-zinc-500">
                      ({nomePorEtapa.get(m.etapa_id)})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <legend className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Anexo de apoio (opcional)
            </legend>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome do link">
                <input type="text" name="anexo_nome" className={inputClass} />
              </Field>
              <Field label="URL">
                <input
                  type="url"
                  name="anexo_url"
                  placeholder="https://..."
                  className={inputClass}
                />
              </Field>
            </div>
          </fieldset>

          <div className="mt-2 flex items-center gap-4">
            <SubmitButton>Salvar</SubmitButton>
            <Link
              href={`/projetos/${slug}/etapas/${etapaSlug}`}
              className="text-sm text-zinc-500 underline dark:text-zinc-400"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}
