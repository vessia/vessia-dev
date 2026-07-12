import Link from "next/link";
import { getOptionalUser, getProfile } from "@/lib/auth/dal";
import { logout } from "@/app/logout/actions";
import { criacaoProjetoHabilitada } from "@/lib/projetos/feature-flags";

const navLinkClass =
  "text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50";

export async function Header() {
  const user = await getOptionalUser();
  const profile = user ? await getProfile(user.id) : null;

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <Link
          href={user ? "/dashboard" : "/login"}
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Vessia
        </Link>

        {user && profile ? (
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/dashboard" className={navLinkClass}>
              Início
            </Link>
            <Link href="/projetos" className={navLinkClass}>
              Projetos
            </Link>

            {profile.papel === "professor" && criacaoProjetoHabilitada() && (
              <Link href="/projetos/novo" className={navLinkClass}>
                Novo projeto
              </Link>
            )}

            {profile.papel === "aluno" && (
              <Link href="/onboarding" className={navLinkClass}>
                Rever onboarding
              </Link>
            )}

            <span className="hidden text-zinc-300 sm:inline dark:text-zinc-700">
              |
            </span>

            <span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {profile.papel === "professor" ? "Professor" : "Aluno"}
              </span>
              {profile.nome}
            </span>

            <form action={logout}>
              <button type="submit" className={`underline ${navLinkClass}`}>
                Sair
              </button>
            </form>
          </nav>
        ) : (
          <nav className="flex gap-4 text-sm">
            <Link href="/login" className={navLinkClass}>
              Entrar
            </Link>
            <Link href="/cadastro" className={navLinkClass}>
              Criar conta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
