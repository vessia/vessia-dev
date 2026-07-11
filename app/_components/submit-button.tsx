"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Salvando...",
  variant = "primary",
  name,
  value,
  className = "",
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger";
  name?: string;
  value?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary:
      "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900",
    danger:
      "bg-white text-red-600 border border-red-200 hover:bg-red-50 dark:bg-zinc-950 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40",
  };

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={`rounded-full px-5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
