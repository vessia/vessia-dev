import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-4 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-4 px-4 text-xs text-zinc-500 sm:justify-between sm:px-8 dark:text-zinc-400">
        <span>Vessia</span>
        <div className="flex gap-4">
          <Link href="/termos" className="underline hover:text-zinc-700 dark:hover:text-zinc-200">
            Termos de Uso
          </Link>
          <Link href="/privacidade" className="underline hover:text-zinc-700 dark:hover:text-zinc-200">
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
