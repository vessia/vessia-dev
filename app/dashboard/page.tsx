import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";
import { buscarMissoesAtrasadas, buscarPendenciasAvaliacao } from "@/lib/dashboard/professor";

export default async function DashboardPage() {
  // Defesa em profundidade: o proxy já redireciona quem não está logado,
  // mas a página não deve depender só dele (ver guia de auth do Next.js).
  // verifySession() faz esse check e redireciona para /login se preciso.
  const user = await verifySession();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, papel")
    .eq("id", user.id)
    .single();

  if (profile?.papel !== "professor") {
    return (
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Olá, {profile?.nome ?? user.email}
        </h1>
      </main>
    );
  }

  const [pendencias, atrasadas] = await Promise.all([
    buscarPendenciasAvaliacao(supabase, user.id),
    buscarMissoesAtrasadas(supabase, user.id),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-4 sm:p-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Olá, {profile.nome}
      </h1>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Pendências de avaliação ({pendencias.length})
        </h2>
        {pendencias.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nenhuma entrega esperando avaliação.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pendencias.map((p) => (
              <li
                key={p.entregaId}
                className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <Link
                  href={`/avaliacoes/${p.entregaId}`}
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  {p.alunoNome} — {p.missaoTitulo}
                </Link>
                <span className="text-zinc-400 dark:text-zinc-500">
                  {" "}
                  ({p.projetoNome}, {p.numeroTentativa}ª tentativa)
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Atrasadas ({atrasadas.length})
        </h2>
        {atrasadas.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nenhuma missão atrasada.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {atrasadas.map((m) => (
              <li
                key={m.missaoId}
                className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <Link
                  href={`/projetos/${m.projetoId}/etapas/${m.etapaId}/missoes/${m.missaoId}`}
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  {m.titulo}
                </Link>
                <span className="text-zinc-400 dark:text-zinc-500">
                  {" "}
                  ({m.projetoNome}, prazo {new Date(m.prazo).toLocaleDateString("pt-BR")})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
