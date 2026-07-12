"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";
import { ITENS_ONBOARDING, type ChaveOnboarding } from "@/lib/onboarding/constantes";

const CHAVES_VALIDAS = new Set<string>(ITENS_ONBOARDING.map((i) => i.chave));

export async function marcarOnboardingConcluido(formData: FormData) {
  const user = await verifySession();
  const item = String(formData.get("item") ?? "");

  if (!CHAVES_VALIDAS.has(item)) {
    redirect(`/onboarding?error=${encodeURIComponent("Item inválido.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("onboarding_progresso").insert({
    aluno_id: user.id,
    item: item as ChaveOnboarding,
  });

  // 23505 (já concluído — ex: duplo clique) é idempotente, não é erro real.
  if (error && error.code !== "23505") {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/onboarding");
}
