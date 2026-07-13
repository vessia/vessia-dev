import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/app/_components/ui";
import { getOptionalUser } from "@/lib/auth/dal";

// 01 - Visão.md, seções 0 e 1: identidade e proposta central do produto.
// Landing só existe pra dar contexto a quem cai aqui sem saber o que é a
// Vessia — não é página de conversão (sem preço/depoimentos/logos).
const PASSOS = [
  {
    titulo: "Projeto",
    texto: "O trabalho real que será desenvolvido para um cliente real.",
  },
  {
    titulo: "Etapas",
    texto:
      "Marcos do projeto. Organizam as missões relacionadas e mostram o progresso conforme avançam.",
  },
  {
    titulo: "Missões",
    texto:
      "A menor unidade de trabalho — cada uma com objetivo, entrega e critério de avaliação claros.",
  },
] as const;

export default async function HomePage() {
  // Landing é só pra quem ainda não conhece a Vessia — quem já tem sessão
  // não precisa ver "Entrar"/"Criar conta" de novo, vai direto pro
  // dashboard.
  const user = await getOptionalUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-16 p-4 py-16 sm:p-8 sm:py-24">
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Projetos reais, organizados em missões claras
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-300">
          Da entrevista com o cliente à entrega final: um mapa único que
          mostra onde o projeto está e o que falta.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Criar conta
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-center text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Como funciona
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PASSOS.map((passo, i) => (
            <Card key={passo.titulo}>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {i + 1}. {passo.titulo}
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {passo.texto}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
