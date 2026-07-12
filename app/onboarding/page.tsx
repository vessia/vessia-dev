import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";
import { calcularProgressoOnboarding, onboardingCompleto } from "@/lib/onboarding/progresso";
import { Banner, Card } from "@/app/_components/ui";
import { SubmitButton } from "@/app/_components/submit-button";
import { marcarOnboardingConcluido } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await verifySession();
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("onboarding_progresso")
    .select("item")
    .eq("aluno_id", user.id);

  const concluidos = (data ?? []).map((d) => d.item);
  const itens = calcularProgressoOnboarding(concluidos);
  const completo = onboardingCompleto(concluidos);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Bem-vindo à Empresa Júnior
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Antes de ver os projetos, dá uma olhada rápida em como tudo
          funciona por aqui — são só 3 passos.
        </p>
      </div>

      {error && <Banner variant="error">{error}</Banner>}

      <ul className="flex flex-col gap-4">
        {itens.map((item) => (
          <li key={item.chave}>
            <Card
              className={item.disponivel ? undefined : "opacity-60"}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">
                  {item.concluido ? "✅" : item.disponivel ? "🟢" : "🔒"}
                </span>
                <div className="flex flex-1 flex-col gap-2">
                  <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
                    {item.titulo}
                  </h2>

                  {item.disponivel && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {item.texto}
                    </p>
                  )}

                  {item.disponivel && !item.concluido && (
                    <form action={marcarOnboardingConcluido} className="mt-1">
                      <input type="hidden" name="item" value={item.chave} />
                      <SubmitButton pendingText="Marcando...">
                        Marcar como concluído
                      </SubmitButton>
                    </form>
                  )}

                  {item.concluido && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Concluído
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {completo ? (
        <Link
          href="/projetos"
          className="w-fit rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Continuar
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="w-fit cursor-not-allowed rounded-full bg-zinc-200 px-5 py-2 text-sm font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
        >
          Continuar
        </button>
      )}
    </main>
  );
}
