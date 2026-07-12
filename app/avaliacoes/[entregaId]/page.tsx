import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfessor } from "@/lib/auth/dal";
import { Banner, Card } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";
import { buscarEntregaComContexto, usuarioPodeAcessarEntrega } from "@/lib/entregas/dal";
import { gerarUrlAssinadaArquivo } from "@/lib/entregas/url-assinada";
import { ehImagem } from "@/lib/entregas/tipo-arquivo";
import { avaliar } from "./actions";

const RESULTADO_LABEL: Record<string, string> = {
  aprovada: "Aprovada",
  aprovada_com_ressalvas: "Aprovada com ressalvas",
  rejeitada: "Rejeitada",
};

function ConteudoEntrega({
  tipoConteudo,
  conteudo,
  urlAssinada,
}: {
  tipoConteudo: string;
  conteudo: string;
  urlAssinada: string | null;
}) {
  if (tipoConteudo !== "arquivo") {
    return (
      <p className="text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
        {conteudo}
      </p>
    );
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

export default async function AvaliacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ entregaId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireProfessor();
  const { entregaId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const contexto = await buscarEntregaComContexto(supabase, entregaId);

  if (!contexto) {
    notFound();
  }

  const podeAcessar = await usuarioPodeAcessarEntrega(
    supabase,
    contexto,
    user.id,
    "professor",
  );

  if (!podeAcessar) {
    redirect(
      `/dashboard?error=${encodeURIComponent("Você não tem acesso a essa entrega.")}`,
    );
  }

  const { data: missao } = await supabase
    .from("missoes")
    .select("id, titulo, criterio_avaliacao")
    .eq("id", contexto.missaoId)
    .single();

  if (!missao) {
    notFound();
  }

  const { data: aluno } = await supabase
    .from("profiles")
    .select("nome")
    .eq("id", contexto.alunoId)
    .single();

  const { data: avaliacaoExistente } = await supabase
    .from("avaliacoes")
    .select("resultado, feedback, avaliada_em")
    .eq("entrega_id", entregaId)
    .maybeSingle();

  const { data: todasEntregas } = await supabase
    .from("entregas")
    .select("id, numero_tentativa, conteudo, tipo_conteudo, enviada_em")
    .eq("participacao_id", contexto.participacaoId)
    .order("numero_tentativa", { ascending: true });

  const historico = (todasEntregas ?? []).filter((e) => e.id !== entregaId);

  const historicoIds = historico.map((e) => e.id);
  const { data: avaliacoesHistorico } = historicoIds.length
    ? await supabase
        .from("avaliacoes")
        .select("entrega_id, resultado, feedback")
        .in("entrega_id", historicoIds)
    : { data: [] };

  const avaliacaoPorEntrega = new Map(
    (avaliacoesHistorico ?? []).map((a) => [a.entrega_id, a] as const),
  );

  const urlAssinadaAtual =
    contexto.tipoConteudo === "arquivo"
      ? await gerarUrlAssinadaArquivo(contexto.conteudo)
      : null;

  const urlsHistorico = new Map(
    await Promise.all(
      historico
        .filter((e) => e.tipo_conteudo === "arquivo")
        .map(
          async (e) =>
            [e.id, await gerarUrlAssinadaArquivo(e.conteudo)] as const,
        ),
    ),
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-8">
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/dashboard" className="underline">
            Voltar ao dashboard
          </Link>
        </p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Avaliar: {aluno?.nome ?? "Aluno"} — {missao.titulo}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {todasEntregas?.find((e) => e.id === entregaId)?.numero_tentativa}ª
          tentativa
        </p>
      </div>

      {error && <Banner variant="error">{error}</Banner>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Critério de avaliação
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {missao.criterio_avaliacao}
          </p>
        </Card>
        <Card>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Entrega (
            {contexto.tipoConteudo === "link"
              ? "link"
              : contexto.tipoConteudo === "arquivo"
                ? "arquivo"
                : "texto"}
            )
          </p>
          <ConteudoEntrega
            tipoConteudo={contexto.tipoConteudo}
            conteudo={contexto.conteudo}
            urlAssinada={urlAssinadaAtual}
          />
        </Card>
      </div>

      {historico.length > 0 && (
        <Card>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Tentativas anteriores
          </p>
          <ul className="flex flex-col gap-3">
            {historico.map((e) => {
              const avaliacao = avaliacaoPorEntrega.get(e.id);
              return (
                <li
                  key={e.id}
                  className="rounded-lg border border-zinc-100 p-3 text-sm dark:border-zinc-800"
                >
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                    {e.numero_tentativa}ª tentativa —{" "}
                    {avaliacao
                      ? RESULTADO_LABEL[avaliacao.resultado]
                      : "Sem avaliação"}
                  </p>
                  <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                    <ConteudoEntrega
                      tipoConteudo={e.tipo_conteudo}
                      conteudo={e.conteudo}
                      urlAssinada={urlsHistorico.get(e.id) ?? null}
                    />
                  </div>
                  {avaliacao?.feedback && (
                    <p className="mt-1 text-zinc-500 italic dark:text-zinc-500">
                      Feedback: {avaliacao.feedback}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {avaliacaoExistente ? (
        <Card>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Já avaliada: {RESULTADO_LABEL[avaliacaoExistente.resultado]}
          </p>
          {avaliacaoExistente.feedback && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Feedback: {avaliacaoExistente.feedback}
            </p>
          )}
          {(avaliacaoExistente.resultado === "aprovada" ||
            avaliacaoExistente.resultado === "aprovada_com_ressalvas") && (
            <div className="mt-3">
              <Banner variant="info">
                Aprovar uma entrega não conclui a missão automaticamente —
                marque a missão como concluída na página dela quando julgar
                que está pronta.
              </Banner>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <form action={avaliar} className="flex flex-col gap-3">
            <input type="hidden" name="entrega_id" value={entregaId} />

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Feedback (obrigatório se rejeitar)
              <textarea
                name="feedback"
                rows={3}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <SubmitButton name="resultado" value="aprovada" pendingText="Salvando...">
                Aprovar
              </SubmitButton>
              <SubmitButton
                name="resultado"
                value="aprovada_com_ressalvas"
                variant="secondary"
                pendingText="Salvando..."
              >
                Aprovar com ressalvas
              </SubmitButton>
              <SubmitButton
                name="resultado"
                value="rejeitada"
                variant="danger"
                pendingText="Salvando..."
              >
                Rejeitar
              </SubmitButton>
            </div>
          </form>
        </Card>
      )}
    </main>
  );
}
