import Link from "next/link";

// Cobre notFound() disparado por esta página e por qualquer rota aninhada
// (etapas, missões, alunos, professores) — a mensagem é propositalmente
// ambígua entre "esse projeto não existe" e "você não tem acesso a ele",
// pra não vazar pra quem não deveria saber se um projeto existe.
export default function ProjetoNaoEncontrado() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-4 text-center sm:p-8">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Projeto não encontrado
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Este projeto não foi encontrado ou você não tem acesso a ele.
      </p>
      <Link
        href="/projetos"
        className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Voltar para projetos
      </Link>
    </main>
  );
}
