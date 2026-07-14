import Link from "next/link";

// Boundary global — cobre qualquer notFound() ou URL não reconhecida que
// não tenha um not-found.tsx mais específico no meio do caminho (ex:
// /projetos/[id] tem o seu próprio, mais específico). Sem isso, essas
// rotas caem no 404 padrão do Next.js (genérico, sem link de volta).
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-4 text-center sm:p-8">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Página não encontrada
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Essa página não existe ou você não tem acesso a ela. Se acha que
        isso é um erro, fale com o professor responsável.
      </p>
      <Link
        href="/"
        className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Voltar para o início
      </Link>
    </main>
  );
}
