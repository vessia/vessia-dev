import type { ReactNode } from "react";
import { STATUS_MISSAO_INFO, type StatusMissao } from "@/lib/missoes/status";
import { CONCEITOS } from "@/lib/conceitos/textos";
import { Tooltip } from "./tooltip";

const CONCEITO_POR_STATUS: Record<StatusMissao, string> = {
  bloqueada: CONCEITOS.statusBloqueada,
  disponivel: CONCEITOS.statusDisponivel,
  em_andamento: CONCEITOS.statusEmAndamento,
  concluida: CONCEITOS.statusConcluida,
};

export const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {label}
      {children}
    </label>
  );
}

export function Banner({
  variant,
  children,
}: {
  variant: "error" | "info";
  children: ReactNode;
}) {
  const styles =
    variant === "error"
      ? "border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-950/50 dark:text-red-300"
      : "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/50 dark:text-blue-300";

  return (
    <p
      data-testid={`banner-${variant}`}
      className={`rounded-md border-l-4 px-4 py-3 text-sm ${styles}`}
    >
      {children}
    </p>
  );
}

export function StatusBadge({ status }: { status: "ativo" | "encerrado" }) {
  const styles =
    status === "ativo"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {status === "ativo" ? "Ativo" : "Encerrado"}
    </span>
  );
}

export function MissaoStatusBadge({ status }: { status: StatusMissao }) {
  const info = STATUS_MISSAO_INFO[status];

  return (
    <Tooltip
      texto={CONCEITO_POR_STATUS[status]}
      testId="missao-status-badge"
      triggerClassName={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${info.className}`}
    >
      {info.icone} {info.label}
    </Tooltip>
  );
}
